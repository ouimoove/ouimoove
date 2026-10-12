// OuiMoove → Sèvizi bridge. The browser talks only to this function; the
// Sèvizi partner key never leaves the server.
//
//   { action: 'vendors',  category, city?, q? }                      public (anon key is enough)
//   { action: 'request',  category, city, event_date?, guests?, budget?, message?, wedding_id? }   signed-in
//   { action: 'offers' }                                              signed-in
//
// Secrets: SEVIZI_PARTNER_URL (…/functions/v1/partner-api), SEVIZI_PARTNER_KEY.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const PARTNER_URL = Deno.env.get('SEVIZI_PARTNER_URL') ?? '';
const PARTNER_KEY = Deno.env.get('SEVIZI_PARTNER_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const CATEGORIES = ['planner', 'venue', 'catering', 'decor', 'photo', 'video', 'music', 'mc', 'makeup', 'attire',
  'cake', 'transport', 'stationery', 'rentals'];
const DAILY_LIMIT = 5;

async function sevizi(payload: Record<string, unknown>) {
  const res = await fetch(PARTNER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-partner-key': PARTNER_KEY },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`sevizi_${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!PARTNER_URL || !PARTNER_KEY) return json({ error: 'not_configured' }, 503);

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  // Who is calling? (null for a visitor who isn't signed in)
  const authed = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await authed.auth.getUser();
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    if (body.action === 'vendors') {
      if (!CATEGORIES.includes(body.category)) return json({ vendors: [] });
      const out = await sevizi({
        action: 'vendors', categories: [body.category],
        city: typeof body.city === 'string' ? body.city.slice(0, 80) : undefined,
        q: typeof body.q === 'string' ? body.q.slice(0, 80) : undefined, limit: 24,
      });
      return json({ vendors: out.vendors ?? [] });
    }

    if (!user) return json({ error: 'not_signed_in' }, 401);

    if (body.action === 'request') {
      if (!CATEGORIES.includes(body.category)) return json({ error: 'invalid_category' }, 400);
      const city = String(body.city ?? '').trim().slice(0, 80);
      if (!city) return json({ error: 'city_required' }, 400);

      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { count } = await db.from('wedding_sevizi_requests').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', since);
      if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'too_many_requests' }, 429);

      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 800) : '';
      const guests = Number(body.guests) > 0 ? Math.min(Math.round(Number(body.guests)), 5000) : null;
      const budget = Number(body.budget) > 0 ? Math.round(Number(body.budget)) : null;
      const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.event_date ?? '')) ? body.event_date : null;

      const row = await db.from('wedding_sevizi_requests').insert({
        user_id: user.id, wedding_id: body.wedding_id ?? null, category: body.category, city,
        event_date: eventDate, guests, budget, message: message || null,
      }).select('id').single();
      if (row.error) throw row.error;

      let seviziId: string | null = null;
      try {
        const out = await sevizi({
          action: 'create_request', ref: row.data.id, category: body.category, city,
          event_date: eventDate, guests, budget, description: message,
        });
        seviziId = out.request_id ?? null;
      } catch (e) {
        // Don't keep a request Sèvizi never received.
        await db.from('wedding_sevizi_requests').delete().eq('id', row.data.id);
        throw e;
      }
      await db.from('wedding_sevizi_requests').update({ sevizi_request_id: seviziId }).eq('id', row.data.id);
      return json({ id: row.data.id });
    }

    if (body.action === 'offers') {
      const { data: mine, error } = await db.from('wedding_sevizi_requests').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      if (!mine?.length) return json({ requests: [] });
      const out = await sevizi({ action: 'offers', refs: mine.map((r) => r.id) });
      const byRef = new Map<string, any>((out.requests ?? []).map((r: any) => [r.ref, r]));
      return json({
        requests: mine.map((r) => ({
          id: r.id, category: r.category, city: r.city, event_date: r.event_date, guests: r.guests,
          budget: r.budget, message: r.message, created_at: r.created_at,
          status: byRef.get(r.id)?.status ?? 'ouverte', offers: byRef.get(r.id)?.offers ?? [],
        })),
      });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('sevizi-bridge', e);
    return json({ error: 'server_error' }, 502);
  }
});
