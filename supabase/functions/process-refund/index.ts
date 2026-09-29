// Refunds. PayDunya has no refund endpoint, so a refund is a payout (their
// "disbursement" API) of the order total to the buyer's mobile-money number,
// paid from the merchant balance — or, when no payout is possible (card
// orders) or wanted, a bookkeeping-only "manual" refund the admin pays by hand.
//
// Flow: an organizer REQUESTS a refund for an order on their event; an admin
// APPROVES or REJECTS it. Approval marks the order refunded, returns the
// tickets to stock and (optionally) sends the payout. Every write happens here
// with the service role; the browser only asks.
//
// Body: { action: 'request',  orderId, reason? }
//       { action: 'reject',   requestId }
//       { action: 'approve',  requestId, mode: 'payout' | 'manual', phone? }
//       { action: 'finalize', requestId }   // re-check a payout left 'processing'

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PD_HEADERS = {
  'PAYDUNYA-MASTER-KEY':  Deno.env.get('PAYDUNYA_MASTER_KEY')  ?? '',
  'PAYDUNYA-PRIVATE-KEY': Deno.env.get('PAYDUNYA_PRIVATE_KEY') ?? '',
  'PAYDUNYA-TOKEN':       Deno.env.get('PAYDUNYA_TOKEN')        ?? '',
  'Content-Type': 'application/json',
}
const DISBURSE = 'https://app.paydunya.com/api/v2/disburse'
const IS_LIVE = Deno.env.get('PAYDUNYA_MODE') === 'live'

// Our payment_method values -> PayDunya payout channels (Togo).
const WITHDRAW_MODE: Record<string, string> = { tmoney: 't-money-togo', flooz: 'moov-togo' }

// deno-lint-ignore no-explicit-any
type Admin = any

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function normalizeTogoPhone(raw: unknown): string | null {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('00228')) d = d.slice(5)
  else if (d.startsWith('228') && d.length === 11) d = d.slice(3)
  return /^\d{8}$/.test(d) ? d : null
}

const checkedIn = (c: unknown) => Array.isArray(c) ? c.some((n) => Number(n) > 0) : Number(c) > 0

// Loads an order and decides whether it can be refunded at all.
async function loadRefundableOrder(admin: Admin, orderId: string) {
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, buyer_name, total_cfa, payment_method, payment_status, order_items(id, event_id, ticket_type_id, quantity, checked_in, checked_in_count, is_resale, resold)')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return { error: 'Commande introuvable.' }
  if (order.payment_status !== 'paid') return { error: 'Cette commande n’est pas payée (ou déjà remboursée).' }
  if (!(Number(order.total_cfa) > 0)) return { error: 'Commande gratuite : rien à rembourser.' }

  const items = order.order_items ?? []
  if (items.some((i: any) => i.is_resale || i.resold)) {
    return { error: 'Les commandes de revente ne peuvent pas être remboursées ici.' }
  }
  if (items.some((i: any) => i.checked_in || checkedIn(i.checked_in_count))) {
    return { error: 'Des billets de cette commande ont déjà été validés à l’entrée.' }
  }

  const eventIds = [...new Set(items.map((i: any) => i.event_id))]
  const { data: events } = await admin.from('events').select('id, title, organizer_id').in('id', eventIds)
  return { order, items, events: events ?? [] }
}

// Marks the order refunded and puts the tickets back on sale.
async function completeRefund(admin: Admin, requestId: string, status: 'paid_out' | 'manual', decidedBy: string, extra: Record<string, unknown> = {}) {
  const { data: req } = await admin.from('refund_requests').select('order_id').eq('id', requestId).single()

  const { data: claimed } = await admin
    .from('orders').update({ payment_status: 'refunded' })
    .eq('id', req.order_id).eq('payment_status', 'paid').select('id')

  if (claimed && claimed.length > 0) {
    const { data: items } = await admin.from('order_items').select('ticket_type_id, quantity, is_resale').eq('order_id', req.order_id)
    for (const it of items ?? []) {
      if (it.is_resale) continue
      const { data: tk } = await admin.from('ticket_types').select('quantity_sold').eq('id', it.ticket_type_id).single()
      if (tk) {
        await admin.from('ticket_types')
          .update({ quantity_sold: Math.max(0, (tk.quantity_sold || 0) - it.quantity) })
          .eq('id', it.ticket_type_id)
      }
    }
  }

  await admin.from('refund_requests').update({
    status, decided_by: decidedBy, decided_at: new Date().toISOString(), payout_error: null, ...extra,
  }).eq('id', requestId)
}

async function revertToPending(admin: Admin, requestId: string, message: string, extra: Record<string, unknown> = {}) {
  await admin.from('refund_requests').update({ status: 'pending', payout_error: message, ...extra }).eq('id', requestId)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // PayDunya requires a valid callback URL for payouts. We never trust it for
  // state changes (status is re-checked with PayDunya via 'finalize'), so it
  // just acknowledges.
  if (new URL(req.url).searchParams.get('cb') === '1') return new Response('ok', { headers: CORS })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: authData } = jwt ? await admin.auth.getUser(jwt) : { data: { user: null } }
    const user = authData?.user
    if (!user) return json({ error: 'Connexion requise.' }, 401)

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    const body = await req.json()
    const action = body?.action

    // ── request ────────────────────────────────────────────────────
    if (action === 'request') {
      const loaded = await loadRefundableOrder(admin, String(body.orderId ?? ''))
      if ('error' in loaded) return json({ error: loaded.error }, 400)
      const { order, events } = loaded

      // An organizer may only request refunds for orders made up entirely of
      // their own events; anything else needs an admin.
      const ownsAll = events.length > 0 && events.every((e: any) => e.organizer_id === user.id)
      if (!isAdmin && !ownsAll) return json({ error: 'Vous ne pouvez pas rembourser cette commande.' }, 403)

      const { data: pending } = await admin.from('pending_payments').select('payload').eq('order_id', order.id).maybeSingle()
      const payerPhone = pending?.payload?.phone ? String(pending.payload.phone) : null

      const { error } = await admin.from('refund_requests').insert({
        order_id: order.id,
        requested_by: user.id,
        reason: String(body.reason ?? '').slice(0, 500) || null,
        buyer_name: order.buyer_name,
        event_title: events.map((e: any) => e.title).join(', ').slice(0, 200),
        order_total: Number(order.total_cfa),
        payment_method: order.payment_method,
        payout_phone: payerPhone,
      })
      if (error) {
        if (String(error.message).includes('refund_requests_one_open_per_order')) {
          return json({ error: 'Une demande de remboursement est déjà en cours pour cette commande.' }, 409)
        }
        console.error('process-refund request insert:', error)
        return json({ error: 'Impossible d’enregistrer la demande.' }, 500)
      }
      return json({ ok: true })
    }

    // Everything below is admin-only.
    if (!isAdmin) return json({ error: 'Réservé aux administrateurs.' }, 403)
    const requestId = String(body.requestId ?? '')

    // ── reject ─────────────────────────────────────────────────────
    if (action === 'reject') {
      const { data } = await admin.from('refund_requests')
        .update({ status: 'rejected', decided_by: user.id, decided_at: new Date().toISOString() })
        .eq('id', requestId).eq('status', 'pending').select('id')
      if (!data || data.length === 0) return json({ error: 'Demande introuvable ou déjà traitée.' }, 409)
      return json({ ok: true })
    }

    // ── finalize (a payout left 'processing') ───────────────────────
    if (action === 'finalize') {
      const { data: r } = await admin.from('refund_requests').select('*').eq('id', requestId).eq('status', 'processing').maybeSingle()
      if (!r?.payout_token) return json({ error: 'Rien à vérifier pour cette demande.' }, 409)
      const res = await fetch(`${DISBURSE}/check-status`, { method: 'POST', headers: PD_HEADERS, body: JSON.stringify({ disburse_invoice: r.payout_token }) })
      const st = await res.json().catch(() => null)
      if (st?.status === 'success') {
        await completeRefund(admin, requestId, 'paid_out', user.id)
        return json({ ok: true, status: 'success' })
      }
      if (st?.status === 'failed') {
        await revertToPending(admin, requestId, 'Le paiement a échoué chez PayDunya. Vous pouvez réessayer.')
        return json({ ok: false, status: 'failed', error: 'Le paiement a échoué. Vous pouvez réessayer.' })
      }
      return json({ ok: false, status: st?.status ?? 'unknown', error: 'Paiement encore en cours de traitement.' })
    }

    // ── approve ────────────────────────────────────────────────────
    if (action === 'approve') {
      const mode = body.mode === 'payout' ? 'payout' : 'manual'

      // Claim: only one approval can ever run for a request.
      const { data: claimed } = await admin.from('refund_requests')
        .update({ status: 'processing', payout_error: null })
        .eq('id', requestId).eq('status', 'pending').select('*')
      const request = claimed?.[0]
      if (!request) return json({ error: 'Demande introuvable ou déjà traitée.' }, 409)

      // Re-validate: state may have changed since it was requested.
      const loaded = await loadRefundableOrder(admin, request.order_id)
      if ('error' in loaded) {
        await revertToPending(admin, requestId, loaded.error)
        return json({ error: loaded.error }, 400)
      }
      const { order } = loaded

      if (mode === 'manual') {
        await completeRefund(admin, requestId, 'manual', user.id)
        return json({ ok: true, mode: 'manual' })
      }

      // payout
      const withdrawMode = WITHDRAW_MODE[String(order.payment_method)]
      if (!withdrawMode) {
        const msg = 'Cette commande a été payée par carte : marquez-la comme remboursée et payez manuellement.'
        await revertToPending(admin, requestId, msg)
        return json({ error: msg }, 400)
      }
      const phone = normalizeTogoPhone(body.phone ?? request.payout_phone)
      if (!phone) {
        const msg = 'Numéro de téléphone (8 chiffres) requis pour envoyer le remboursement.'
        await revertToPending(admin, requestId, msg)
        return json({ error: msg }, 400)
      }
      if (!IS_LIVE) {
        const msg = 'Le paiement automatique n’est disponible qu’en mode live. Utilisez « paiement manuel ».'
        await revertToPending(admin, requestId, msg)
        return json({ error: msg }, 400)
      }

      let disburseToken: string | null = null
      try {
        const init = await fetch(`${DISBURSE}/get-invoice`, {
          method: 'POST', headers: PD_HEADERS,
          body: JSON.stringify({
            account_alias: phone,
            amount: Number(order.total_cfa),
            withdraw_mode: withdrawMode,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-refund?cb=1`,
          }),
        }).then((r) => r.json())

        if (init?.response_code !== '00' || !init?.disburse_token) {
          const msg = `PayDunya a refusé le paiement : ${init?.response_text || init?.description || 'erreur inconnue'}`
          await revertToPending(admin, requestId, msg)
          return json({ error: msg }, 502)
        }
        disburseToken = init.disburse_token
        // Recorded BEFORE submitting so a crash below can be resolved with 'finalize'.
        await admin.from('refund_requests').update({ payout_token: disburseToken, payout_provider: withdrawMode, payout_phone: phone }).eq('id', requestId)

        const sub = await fetch(`${DISBURSE}/submit-invoice`, {
          method: 'POST', headers: PD_HEADERS,
          body: JSON.stringify({ disburse_invoice: disburseToken, disburse_id: String(Date.now()).slice(-12) }),
        }).then((r) => r.json())

        if (sub?.response_code === '00') {
          await completeRefund(admin, requestId, 'paid_out', user.id, { payout_token: disburseToken, payout_provider: withdrawMode, payout_phone: phone })
          return json({ ok: true, mode: 'payout' })
        }
        const msg = `Le paiement n’a pas abouti : ${sub?.response_text || sub?.description || 'erreur inconnue'}`
        await revertToPending(admin, requestId, msg)
        return json({ error: msg }, 502)
      } catch (err) {
        // The payout may or may not have gone out — leave it 'processing' with
        // its token so the admin can 'finalize' (re-check with PayDunya).
        console.error('process-refund payout error:', err)
        await admin.from('refund_requests').update({ payout_error: 'Statut inconnu — vérifiez le paiement.' }).eq('id', requestId)
        return json({ error: 'Statut du paiement inconnu. Utilisez « Vérifier le statut ».', unknown: !!disburseToken }, 502)
      }
    }

    return json({ error: 'Action inconnue.' }, 400)
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
