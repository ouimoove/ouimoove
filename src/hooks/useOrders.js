import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

function shapeMyOrder(order, eventsRef, userName = '') {
  const items = (order.order_items || []).map((item) => {
    const ev = eventsRef.find((e) => e.id === item.event_id)
    const tk = ev?.tickets.find((t) => t.id === item.ticket_type_id)
    return {
      id:         item.id,
      eventId:    item.event_id,
      eventTitle: ev?.title ?? 'Événement',
      ticketName: tk?.name  ?? 'Billet',
      price:      item.unit_price_cfa,
      qty:        item.quantity,
      checkedIn:      item.checked_in,
      checkedInCount: item.checked_in_count || 0,
      isResale:       item.is_resale || false,
      resold:         item.resold    || false,
    }
  })
  return {
    id:       order.id,
    userId:   order.user_id,
    userName: userName,
    date:     order.created_at,
    items,
    total:    order.total_cfa,
    method:   order.payment_method,
    status:   order.payment_status,
  }
}

// Buyer order history, organizer-facing order/attendee views, refunds, and
// check-in. Reads `events` as plain data (never a function) from the events
// domain — one-directional, no cycle.
export function useOrders({ user, events, loadEvents, loadMyEvents, setLoad, setErr }) {
  const [myOrders,        setMyOrders]        = useState([])
  const [organizerOrders, setOrganizerOrders] = useState([])
  const [organizerStats,  setOrganizerStats]  = useState(null)

  const resetLocalState = useCallback(() => {
    setMyOrders([])
    setOrganizerOrders([])
    setOrganizerStats(null)
  }, [])

  const loadMyOrders = useCallback(async (userId, eventsData, userName = '') => {
    if (!userId) return
    setLoad('orders', true)
    setErr('orders', null)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, user_id, total_cfa, payment_method, payment_status, created_at,
        order_items (id, event_id, ticket_type_id, quantity, unit_price_cfa, checked_in, is_resale, resold)
      `)
      .eq('user_id', userId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })

    setLoad('orders', false)

    if (error) {
      console.error('loadMyOrders:', error)
      setErr('orders', error.message)
      return
    }

    const src = eventsData || events
    setMyOrders((data || []).map((o) => shapeMyOrder(o, src, userName)))
  }, [events, setLoad, setErr])

  const loadOrganizerOrders = useCallback(async (userId, eventsData) => {
    if (!userId) return
    setLoad('orgOrders', true)
    setErr('orgOrders', null)

    const src = eventsData || events
    const myEventIds = src.filter((e) => e.organizer === userId).map((e) => e.id)

    if (!myEventIds.length) {
      setOrganizerOrders([])
      setLoad('orgOrders', false)
      return
    }

    const { data, error } = await supabase
      .from('organizer_attendees')
      .select('*')
      .in('event_id', myEventIds)
      .order('purchased_at', { ascending: false })

    setLoad('orgOrders', false)

    if (error) {
      console.error('loadOrganizerOrders:', error)
      setErr('orgOrders', error.message)
      return
    }

    const grouped = {}
    for (const row of data || []) {
      if (!grouped[row.order_id]) {
        grouped[row.order_id] = {
          id:        row.order_id,
          userId:    row.attendee_id,
          userName:  row.attendee_name  || 'Anonyme',
          userEmail: row.attendee_email || '',
          userPhone: row.attendee_phone || '',
          date:      row.purchased_at,
          method:    row.payment_method,
          status:    row.payment_status || 'paid',
          total:     0,
          items:     [],
        }
      }
      grouped[row.order_id].items.push({
        id:          row.item_id,
        eventId:     row.event_id,
        eventTitle:  row.event_title,
        ticketName:  row.ticket_type_name,
        price:       row.unit_price_cfa,
        qty:         row.quantity,
        checkedIn:      row.checked_in,
        checkedInCount: row.checked_in_count || 0,
        checkedInAt:    row.checked_in_at,
        isResale:       row.is_resale || false,
        resold:         row.resold    || false,
      })
      grouped[row.order_id].total += row.unit_price_cfa * row.quantity
    }

    setOrganizerOrders(Object.values(grouped))
  }, [events, setLoad, setErr])

  const loadOrganizerStats = useCallback(async (userId) => {
    if (!userId) return
    setLoad('stats', true)
    setErr('stats', null)

    const { data, error } = await supabase.rpc('organizer_stats', { org_id: userId })

    setLoad('stats', false)

    if (error) {
      console.error('loadOrganizerStats:', error)
      setErr('stats', error.message)
      return
    }

    setOrganizerStats(data)
  }, [setLoad, setErr])

  const refundOrder = useCallback(async (orderId) => {
    const { error } = await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', orderId)
    if (error) { console.error('refundOrder:', error); return false }

    const { data: items } = await supabase.from('order_items').select('ticket_type_id, quantity, is_resale').eq('order_id', orderId)
    for (const item of items || []) {
      if (item.is_resale) continue // resale tickets don't affect quantity_sold
      const tk = events.flatMap(e => e.tickets).find(t => t.id === item.ticket_type_id)
      if (!tk) continue
      await supabase.from('ticket_types')
        .update({ quantity_sold: Math.max(0, (tk.sold || 0) - item.quantity) })
        .eq('id', item.ticket_type_id)
    }

    await loadEvents()
    await loadOrganizerOrders(user?.id)
    return true
  }, [user, events, loadEvents, loadOrganizerOrders])

  // ── CHECK-IN ───────────────────────────────────────────────
  const checkinPurchase = useCallback(async (purchaseId, eventId = null) => {
    const order = organizerOrders.find((p) => p.id === purchaseId)
    if (!order) return false

    const relevantItems = eventId
      ? order.items.filter((i) => i.eventId === eventId && !i.resold)
      : order.items.filter((i) => !i.resold)

    if (!relevantItems.length) return false

    const shouldCheckIn = !relevantItems.every((i) => i.checkedIn)
    const ids = relevantItems.map((i) => i.id)

    const { error } = await supabase.from('order_items').update({
      checked_in:       shouldCheckIn,
      checked_in_count: shouldCheckIn ? relevantItems.map(i => i.qty) : 0,
      checked_in_at:    shouldCheckIn ? new Date().toISOString() : null,
      checked_in_by:    user?.id,
    }).in('id', ids)

    if (error) { console.error('checkin:', error); return false }

    await loadOrganizerOrders(user?.id)
    await loadMyOrders(user?.id, undefined, user?.name)
    return true
  }, [organizerOrders, user, loadOrganizerOrders, loadMyOrders])

  // Partial check-in: validate `count` tickets for a specific order item
  const checkinPartial = useCallback(async (orderItemId, count) => {
    const order = organizerOrders.find(p => p.items.some(i => i.id === orderItemId))
    if (!order) return { error: 'Commande introuvable.' }
    const item = order.items.find(i => i.id === orderItemId)
    if (!item) return { error: 'Billet introuvable.' }

    const newCount = Math.min((item.checkedInCount || 0) + count, item.qty)
    const fullyIn  = newCount >= item.qty

    const { error } = await supabase.from('order_items').update({
      checked_in_count: newCount,
      checked_in:       fullyIn,
      checked_in_at:    new Date().toISOString(),
      checked_in_by:    user?.id,
    }).eq('id', orderItemId)

    if (error) return { error: error.message }
    await loadOrganizerOrders(user?.id)
    await loadMyOrders(user?.id, undefined, user?.name)
    return { ok: true, validated: count, total: item.qty, newCount }
  }, [organizerOrders, user, loadOrganizerOrders, loadMyOrders])

  // Lookup by QR payload or short ref, return order info without checking in
  const lookupByRef = useCallback((ref) => {
    // QR payload format: OUIMOOVE|<uuid>|<title>|<total>
    const clean = ref.includes('|') ? ref.split('|')[1] : ref.trim()
    const lower = clean.toLowerCase()
    const order = organizerOrders.find(p => p.id.toLowerCase().startsWith(lower) || p.id.toLowerCase() === lower)
    if (!order) return null
    return order
  }, [organizerOrders])

  // lookup order by short ref (first 8 chars of UUID) and check in (all at once)
  const checkinByRef = useCallback(async (ref, eventId = null) => {
    const lower = ref.trim().toLowerCase()
    const order = organizerOrders.find(p => p.id.toLowerCase().startsWith(lower))
    if (!order) return { error: 'Référence introuvable.' }

    const relevantItems = eventId
      ? order.items.filter(i => i.eventId === eventId && !i.resold)
      : order.items.filter(i => !i.resold)

    if (!relevantItems.length) return { error: 'Aucun billet valide pour cet événement.' }

    const alreadyIn = relevantItems.every(i => i.checkedIn)
    if (alreadyIn) return { already: true, order }

    const { error } = await supabase.from('order_items').update({
      checked_in:       true,
      checked_in_count: null, // will be set per item below
      checked_in_at:    new Date().toISOString(),
      checked_in_by:    user?.id,
    }).in('id', relevantItems.map(i => i.id))

    if (error) return { error: error.message }
    // set count = qty for each
    for (const item of relevantItems) {
      await supabase.from('order_items').update({ checked_in_count: item.qty }).eq('id', item.id)
    }
    await loadOrganizerOrders(user?.id)
    await loadMyOrders(user?.id, undefined, user?.name)
    return { ok: true, order }
  }, [organizerOrders, user, loadOrganizerOrders, loadMyOrders])

  const refreshOrganizerData = useCallback(async () => {
    if (!user?.id) return
    await loadOrganizerOrders(user.id)
    await loadOrganizerStats(user.id)
    await loadMyEvents(user.id)
  }, [user, loadOrganizerOrders, loadOrganizerStats, loadMyEvents])

  return {
    myOrders, organizerOrders, organizerStats,
    resetLocalState,
    loadMyOrders, loadOrganizerOrders, loadOrganizerStats,
    refundOrder,
    checkinPurchase, checkinPartial, checkinByRef, lookupByRef,
    refreshOrganizerData,
  }
}
