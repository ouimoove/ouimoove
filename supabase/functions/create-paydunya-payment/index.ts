import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { isRateLimited, rateLimitedResponse } from './_shared/rateLimit.ts'
import { priceCart, priceListing } from './_shared/pricing.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAYDUNYA_BASE = Deno.env.get('PAYDUNYA_MODE') === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

const PD_HEADERS = {
  'PAYDUNYA-MASTER-KEY':  Deno.env.get('PAYDUNYA_MASTER_KEY')  ?? '',
  'PAYDUNYA-PRIVATE-KEY': Deno.env.get('PAYDUNYA_PRIVATE_KEY') ?? '',
  'PAYDUNYA-TOKEN':       Deno.env.get('PAYDUNYA_TOKEN')        ?? '',
  'Content-Type': 'application/json',
}

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ouimoove.app'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

// Only ever send the buyer back to our own site — never a URL the browser
// supplied that points somewhere else.
function safeReturnUrl(candidate: unknown, fallbackPath: string) {
  try {
    const u = new URL(String(candidate))
    if (u.origin === new URL(SITE_URL).origin || u.hostname === 'localhost') return u.toString()
  } catch { /* fall through */ }
  return `${SITE_URL}${fallbackPath}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // 10 invoice creations per IP per 5 minutes — generous for real checkout retries, tight enough to block abuse.
  if (await isRateLimited(req, 'create-paydunya-payment', 10, 300)) return rateLimitedResponse(CORS)

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    // Who is paying comes from the verified session token — never from the request body.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: authData } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } }
    const user = authData?.user
    if (!user) return json({ error: 'Connexion requise.' }, 401)

    // The browser sends only WHAT it wants (ids, quantities, promo code, or a
    // listing id). Every price and the total are computed here from the DB.
    const { type, cart, listingId, promoCode, returnUrl, cancelUrl, method, phone } = await req.json()

    let total = 0
    let description = ''
    let items: Array<{ name: string; quantity: number; unit_price: number; total_price: number; description: string }> = []
    let orderType: 'purchase' | 'resale' = 'purchase'
    let payload: Record<string, unknown> = {}
    let listingToReserve: string | null = null

    if (type === 'resale') {
      orderType = 'resale'
      const priced = await priceListing(admin, listingId, user.id, 'active')
      if (!priced.ok) return json({ error: priced.error }, 400)
      total = priced.total
      description = `OuiMoove — revente (${priced.listing.quantity} billet(s))`
      items = [{
        name: `${priced.listing.eventTitle} — ${priced.listing.ticketName} (revente)`,
        quantity: 1, unit_price: total, total_price: total, description: 'Billet OuiMoove (revente)',
      }]
      payload = { listingId: priced.listing.id }
      listingToReserve = priced.listing.id
    } else {
      const priced = await priceCart(admin, cart, promoCode)
      if (!priced.ok) return json({ error: priced.error }, 400)
      total = priced.total
      description = `OuiMoove — ${priced.lines.reduce((n, l) => n + l.qty, 0)} billet(s)`
      items = priced.lines.map((l) => ({
        name: `${l.eventTitle} — ${l.ticketName}`,
        quantity: l.qty, unit_price: l.price, total_price: l.price * l.qty, description: 'Billet OuiMoove',
      }))
      // A discount has no line item of its own; PayDunya validates
      // total_amount against the items, so fold it into a single negative-free
      // adjustment by charging the discounted total on one summary line.
      if (priced.discount > 0) {
        items = [{ name: description, quantity: 1, unit_price: total, total_price: total, description: `Code ${priced.promoCode}` }]
      }
      payload = {
        cart: priced.lines.map((l) => ({ ticketTypeId: l.ticketTypeId, qty: l.qty })),
        promoCode: priced.promoCode,
      }
    }

    // Free after discount → nothing to charge here; the client's free-order path handles it.
    if (total <= 0) return json({ error: 'Aucun paiement requis.' }, 400)

    // Reserve a resale listing atomically: only one buyer can flip it from 'active'.
    if (listingToReserve) {
      const { data: reserved } = await admin
        .from('ticket_listings')
        .update({ status: 'reserved', buyer_id: user.id })
        .eq('id', listingToReserve)
        .eq('status', 'active')
        .select('id')
      if (!reserved || reserved.length === 0) return json({ error: 'Cette annonce n’est plus disponible.' }, 409)
    }

    const releaseListing = async () => {
      if (listingToReserve) {
        await admin.from('ticket_listings').update({ status: 'active', buyer_id: null }).eq('id', listingToReserve)
      }
    }

    const body: Record<string, unknown> = {
      invoice: { total_amount: total, description, items },
      store: {
        name:    Deno.env.get('PAYDUNYA_STORE_NAME') ?? 'OuiMoove',
        tagline: 'Vos billets, partout au Togo',
        logo_url: `${SITE_URL}/ouimoove-logo.png`,
      },
      actions: {
        cancel_url:   safeReturnUrl(cancelUrl, '/?paydunya_cancel=1'),
        return_url:   safeReturnUrl(returnUrl, '/?paydunya_return=1'),
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paydunya-webhook`,
      },
      custom_data: { user_id: user.id },
    }

    // Pre-fill phone for mobile money
    if (method !== 'card' && phone) {
      body.customer = { phone_number: String(phone).slice(0, 20) }
    }

    const res  = await fetch(`${PAYDUNYA_BASE}/checkout-invoice/create`, {
      method:  'POST',
      headers: PD_HEADERS,
      body:    JSON.stringify(body),
    })
    const data = await res.json()

    if (data?.response_code !== '00' || !data?.token) {
      await releaseListing()
      return json({ ...data, checkout_url: null })
    }

    // The order + pending payment are written here with the service role,
    // from the server-computed values — the browser can no longer choose
    // what gets recorded (or later completed) for this payment.
    const orderId = crypto.randomUUID()
    const { error: orderError } = await admin.from('orders').insert({
      id:             orderId,
      user_id:        user.id,
      buyer_name:     user.user_metadata?.full_name || user.email,
      buyer_email:    user.email,
      total_cfa:      total,
      payment_method: String(method ?? 'card'),
      payment_status: 'pending',
      paydunya_token: data.token,
    })
    const { error: pendingError } = orderError ? { error: orderError } : await admin.from('pending_payments').insert({
      token:    data.token,
      order_id: orderId,
      type:     orderType,
      user_id:  user.id,
      payload:  { ...payload, total },
    })
    if (orderError || pendingError) {
      console.error('create-paydunya-payment: could not record order', orderError ?? pendingError)
      await admin.from('orders').delete().eq('id', orderId)
      await releaseListing()
      return json({ error: 'Impossible de créer la commande.' }, 500)
    }

    // PayDunya's own response already contains the correct customer-facing
    // checkout URL in response_text (e.g. https://payment.paydunya.com/payment/{token})
    // — use it verbatim instead of guessing a URL pattern ourselves.
    return json({ ...data, checkout_url: data.response_text ?? null, order_id: orderId, total })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
