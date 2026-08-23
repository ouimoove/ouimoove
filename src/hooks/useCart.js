import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Set VITE_PAYMENT_MODE=paydunya in .env (and Vercel env vars) to use real PayDunya payments.
// Default is 'simulation' (direct DB insert as paid — no redirect).
const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE || 'simulation'

// Cart + checkout. Consumes events/loadEvents/loadMyOrders/loadResaleListings
// as plain arguments from other domains (one-directional — nothing calls
// back into cart), so this has no cycle to resolve.
export function useCart({ user, events, loadEvents, loadMyOrders, loadResaleListings }) {
  const [cart, setCartState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('om_cart')) || [] } catch { return [] }
  })

  const setCart = useCallback((v) => {
    setCartState(v)
    try { localStorage.setItem('om_cart', JSON.stringify(v)) } catch {}
  }, [])

  const addToCart = useCallback((event, selections) => {
    const today = new Date().toISOString().slice(0, 10)
    if (event.date < today) return { error: 'Cet événement est déjà passé.' }
    const items = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => {
        const [, tidx] = key.split('_')
        const t = event.tickets[+tidx]
        return {
          id:           'c' + Date.now() + Math.random(),
          eventId:      event.id,
          eventTitle:   event.title,
          ticketName:   t.name,
          ticketTypeId: t.id,
          price:        t.price,
          qty,
        }
      })
    if (!items.length) return false
    const totalQty = items.reduce((s, i) => s + i.qty, 0)
    if (totalQty > 10) return { error: 'Maximum 10 billets par commande.' }
    setCart([...cart, ...items])
    return true
  }, [cart, setCart])

  const removeFromCart = useCallback((id) => {
    setCart(cart.filter((i) => i.id !== id))
  }, [cart, setCart])

  const clearCart = useCallback(() => setCart([]), [setCart])

  // ── PURCHASE (simulation or PayDunya) ──────────────────────
  const purchase = useCallback(async (method, phone = '', discountAmount = 0) => {
    if (!user || !cart.length) return null

    const today = new Date().toISOString().slice(0, 10)
    const stale = cart.some((item) => {
      const ev = events.find((e) => e.id === item.eventId)
      return ev && ev.date < today
    })
    if (stale) return { error: 'Un des événements de votre panier est déjà passé. Retirez-le pour continuer.' }

    const rawTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const total    = Math.max(0, rawTotal - discountAmount)

    if (PAYMENT_MODE === 'paydunya' && total > 0) {
      // ── PayDunya flow ──
      const returnUrl = `${window.location.origin}/?paydunya_return=1`
      const cancelUrl = `${window.location.origin}/?paydunya_cancel=1`

      const { data: pdData, error: pdError } = await supabase.functions.invoke('create-paydunya-payment', {
        body: { cart, total, userId: user.id, returnUrl, cancelUrl, method, phone },
      })

      if (pdError || pdData?.response_code !== '00') {
        console.error('PayDunya create error:', pdError || pdData)
        return { pdError: pdData?.description || pdData?.response_text || pdError?.message || 'Erreur PayDunya' }
      }

      // Pre-create pending order
      const orderId = crypto.randomUUID()
      const { error: orderError } = await supabase.from('orders').insert({
        id:             orderId,
        user_id:        user.id,
        buyer_name:     user.name,
        buyer_email:    user.email,
        total_cfa:      total,
        payment_method: method,
        payment_status: 'pending',
        paydunya_token: pdData.token,
      })
      if (orderError) { console.error('purchase pending order:', orderError); return null }

      // Persist what's needed to complete the order server-side — either when
      // the browser returns, or via the PayDunya webhook if it never does.
      const cartSnapshot = cart.map((i) => ({
        eventId: i.eventId, ticketTypeId: i.ticketTypeId, qty: i.qty, price: i.price,
        eventTitle: i.eventTitle, ticketName: i.ticketName,
      }))
      const { error: pendingError } = await supabase.from('pending_payments').insert({
        token:   pdData.token,
        order_id: orderId,
        type:    'purchase',
        user_id: user.id,
        payload: { cart: cartSnapshot, total },
      })
      if (pendingError) { console.error('purchase pending_payments:', pendingError); return null }

      // Kept for the "cancelled at checkout" UI path only — completion itself
      // now happens server-side (verify-paydunya-payment / paydunya-webhook).
      sessionStorage.setItem('om_pending', JSON.stringify({
        type: 'purchase', orderId, token: pdData.token, userId: user.id,
      }))

      clearCart()
      return { redirect: pdData.checkout_url }
    }

    // ── Simulation flow ──
    const orderId = crypto.randomUUID()
    const { error: orderError } = await supabase.from('orders').insert({
      id:             orderId,
      user_id:        user.id,
      buyer_name:     user.name,
      buyer_email:    user.email,
      total_cfa:      total,
      payment_method: method,
      payment_status: 'paid',
    })
    if (orderError) { console.error('purchase order:', orderError); return null }

    const orderItems = cart.map((item) => ({
      order_id:       orderId,
      event_id:       item.eventId,
      ticket_type_id: item.ticketTypeId,
      quantity:       item.qty,
      unit_price_cfa: item.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) { console.error('purchase items:', itemsError); return null }

    for (const item of cart) {
      const ev = events.find((e) => e.id === item.eventId)
      const tk = ev?.tickets.find((t) => t.id === item.ticketTypeId)
      if (!tk) continue
      await supabase
        .from('ticket_types')
        .update({ quantity_sold: Math.min((tk.sold || 0) + item.qty, tk.total) })
        .eq('id', item.ticketTypeId)
    }

    clearCart()
    const freshEvents = await loadEvents()
    await loadMyOrders(user.id, freshEvents, user.name)

    // Email + push — fire-and-forget
    const cartSnap = [...cart]
    if (user.email) {
      supabase.functions.invoke('send-ticket-email', { body: { to: user.email, userName: user.name, orderId, items: cartSnap.map(i => ({ eventTitle: i.eventTitle, ticketName: i.ticketName, price: i.price, qty: i.qty })), total, method } }).catch(console.error)
    }
    supabase.from('push_subscriptions').select('endpoint,p256dh,auth_key').eq('user_id', user.id).then(({ data: subs }) => {
      for (const s of subs ?? []) {
        supabase.functions.invoke('send-push', { body: { subscription: { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } }, title: '🎉 Paiement confirmé !', body: `Vos ${cartSnap.reduce((n,i)=>n+i.qty,0)} billet(s) sont prêts.`, url: window.location.origin } }).catch(console.error)
      }
    })

    return { ok: true, orderId }
  }, [user, cart, events, clearCart, loadEvents, loadMyOrders])

  // ── VERIFY PAYDUNYA RETURN ─────────────────────────────────
  // Order completion (order_items, ticket counts, payment_status, resale
  // transfer, email/push) all happens server-side now — in
  // verify-paydunya-payment, which is the same code path the paydunya-webhook
  // hits. This call just asks "is it done yet?" and refreshes the UI; it's
  // safe to call even if the webhook already completed the order.
  const verifyPaydunyaReturn = useCallback(async () => {
    const raw = sessionStorage.getItem('om_pending')
    if (!raw) return { cancelled: true }

    const pending = JSON.parse(raw)
    sessionStorage.removeItem('om_pending')

    const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-paydunya-payment', {
      body: { token: pending.token },
    })

    if (verifyError || verifyData?.status !== 'completed') {
      return { cancelled: true }
    }

    const freshEvents = await loadEvents()
    const uid = pending.userId || user?.id
    if (uid) await loadMyOrders(uid, freshEvents, user?.name || '')
    await loadResaleListings()

    return { ok: true, orderId: pending.orderId }
  }, [user, loadEvents, loadMyOrders, loadResaleListings])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal  = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return {
    cart, cartCount, cartTotal,
    addToCart, removeFromCart, clearCart,
    purchase, verifyPaydunyaReturn,
  }
}
