import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { edgeErrorMessage } from '../utils/helpers.js'

const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE || 'simulation'

// Resale marketplace. Consumes events/loadEvents/loadMyOrders from other
// domains as plain arguments — one-directional, no cycle.
export function useResale({ user, events, loadEvents, loadMyOrders, setLoad, setErr }) {
  const [resaleListings, setResaleListings] = useState([])

  const loadResaleListings = useCallback(async () => {
    setLoad('resale', true)
    setErr('resale', null)

    const { data, error } = await supabase
      .from('ticket_listings')
      .select('*')
      .eq('status', 'active')
      .order('event_date', { ascending: true })

    setLoad('resale', false)

    if (error) {
      console.error('loadResaleListings:', error)
      setErr('resale', error.message)
      return
    }

    setResaleListings(data || [])
  }, [setLoad, setErr])

  const listTicketForResale = useCallback(async ({
    orderItemId, orderId, eventId, ticketTypeId,
    eventTitle, eventDate, eventCity, eventEmoji, eventImageUrl,
    ticketName, quantity, originalPrice, askPrice,
  }) => {
    if (!user?.id) return null

    // Check not already listed
    const { data: existing } = await supabase
      .from('ticket_listings')
      .select('id')
      .eq('order_item_id', orderItemId)
      .eq('status', 'active')
      .single()
    if (existing) return { error: 'Ce billet est déjà mis en vente.' }

    const { data, error } = await supabase
      .from('ticket_listings')
      .insert({
        seller_id:       user.id,
        order_id:        orderId,
        order_item_id:   orderItemId,
        event_id:        eventId,
        ticket_type_id:  ticketTypeId,
        event_title:     eventTitle,
        event_date:      eventDate,
        event_city:      eventCity  || '',
        event_emoji:     eventEmoji || '🎟️',
        event_image_url: eventImageUrl || null,
        ticket_name:     ticketName,
        quantity:        quantity || 1,
        original_price:  originalPrice || 0,
        ask_price_cfa:   askPrice,
      })
      .select()
      .single()

    if (error) { console.error('listTicketForResale:', error); return null }
    await loadResaleListings()
    await loadMyOrders(user.id, events, user.name)
    return data
  }, [user, events, loadResaleListings, loadMyOrders])

  const cancelResaleListing = useCallback(async (listingId) => {
    const { error } = await supabase
      .from('ticket_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId)
      .eq('seller_id', user?.id)
    if (error) { console.error('cancelResaleListing:', error); return false }
    await loadResaleListings()
    await loadMyOrders(user?.id, events, user?.name)
    return true
  }, [user, events, loadResaleListings, loadMyOrders])

  const buyResaleListing = useCallback(async (listing, method = 'simulation', phone = '') => {
    if (!user?.id) return null
    if (listing.seller_id === user.id) return { error: 'Vous ne pouvez pas acheter votre propre annonce.' }

    const fee    = Math.round(listing.ask_price_cfa * 0.10)
    const total  = listing.ask_price_cfa + fee
    const buyerOrderId = crypto.randomUUID()

    if (PAYMENT_MODE === 'paydunya') {
      const returnUrl = `${window.location.origin}/?paydunya_return=1`
      const cancelUrl = `${window.location.origin}/?paydunya_cancel=1`

      // Only the listing id goes up. The server reads the price from the
      // listing, adds the fee, reserves the listing for this buyer and creates
      // the order + pending payment itself.
      const { data: pdData, error: pdError } = await supabase.functions.invoke('create-paydunya-payment', {
        body: { type: 'resale', listingId: listing.id, returnUrl, cancelUrl, method, phone },
      })

      if (pdError || pdData?.response_code !== '00') {
        console.error('PayDunya resale error:', pdError || pdData)
        const message = await edgeErrorMessage(pdError, pdData)
        return message ? { error: message } : null
      }

      // Kept for the "cancelled at checkout" UI path only — completion itself
      // happens server-side (verify-paydunya-payment / paydunya-webhook).
      sessionStorage.setItem('om_pending', JSON.stringify({
        type: 'resale', orderId: pdData.order_id, token: pdData.token, listingId: listing.id, userId: user.id,
      }))

      return { redirect: pdData.checkout_url }
    }

    // ── Simulation flow ──
    const { error: orderError } = await supabase.from('orders').insert({
      id:             buyerOrderId,
      user_id:        user.id,
      buyer_name:     user.name,
      buyer_email:    user.email,
      total_cfa:      total,
      payment_method: method || 'simulation',
      payment_status: 'paid',
    })
    if (orderError) { console.error('buyResale order:', orderError); return null }

    const { error: itemError } = await supabase.from('order_items').insert({
      order_id:       buyerOrderId,
      event_id:       listing.event_id,
      ticket_type_id: listing.ticket_type_id,
      quantity:       listing.quantity,
      unit_price_cfa: listing.ask_price_cfa,
      is_resale:      true,
    })
    if (itemError) { console.error('buyResale item:', itemError); return null }

    // Mark original item as resold
    await supabase.from('order_items').update({ resold: true }).eq('id', listing.order_item_id)

    // Mark listing as sold
    await supabase.from('ticket_listings').update({
      status:         'sold',
      buyer_id:       user.id,
      buyer_order_id: buyerOrderId,
      sold_at:        new Date().toISOString(),
    }).eq('id', listing.id)

    await loadResaleListings()
    const freshEvents = await loadEvents()
    await loadMyOrders(user.id, freshEvents, user.name)

    return { ok: true, orderId: buyerOrderId }
  }, [user, events, loadResaleListings, loadEvents, loadMyOrders])

  return {
    resaleListings, loadResaleListings,
    listTicketForResale, cancelResaleListing, buyResaleListing,
  }
}
