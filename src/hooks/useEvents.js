import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

function shapeEvent(event) {
  const d = new Date(event.event_date)
  return {
    id:        event.id,
    title:     event.title,
    category:  event.category || '',
    date:      d.toISOString().slice(0, 10),
    time:      d.toISOString().slice(11, 16),
    location:  event.venue || '',
    city:      event.city  || '',
    desc:      event.description || '',
    emoji:     event.emoji || '🎟️',
    imageUrl:  event.image_url || null,
    isPrivate: event.is_private || false,
    status:    event.status,
    tickets:   (event.ticket_types || []).map((t) => ({
      id:    t.id,
      name:  t.name,
      price: t.price_cfa,
      total: t.quantity_total,
      sold:  t.quantity_sold,
    })),
    organizer:     event.organizer_id,
    // Business accounts show their business name; personal accounts show
    // their name. Falls back gracefully if the organizer_type/business_name
    // columns aren't present yet on older profile rows.
    organizerName: event.profiles?.account_type === 'business'
      ? (event.profiles?.business_name || event.profiles?.full_name || 'Organisateur')
      : (event.profiles?.full_name || 'Organisateur'),
  }
}

// Public catalog (published-only), an organizer's own events at any status,
// the admin moderation queue, and event CRUD. Deliberately does NOT call
// into the orders domain (loadOrganizerStats/loadOrganizerOrders) even
// though the original single-file version did — that cross-domain refresh
// is orchestrated by useStore.js's composition root instead, since this
// hook has no business knowing the orders domain exists. Behavior is
// identical; only *where* the orchestration lives has moved.
export function useEvents({ user, userRole, setLoad, setErr }) {
  const [events, setEventsState] = useState([])
  const eventsRef = useRef(events)
  useEffect(() => { eventsRef.current = events }, [events])

  const [myEventsAll, setMyEventsAll] = useState([])

  // `silent` skips the loading flag — used by the realtime subscription below
  // so a background ticket-count refresh doesn't flash the whole grid to a
  // spinner for every visitor whenever anyone's purchase completes.
  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setLoad('events', true)
    setErr('events', null)

    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, description, city, venue, category,
        event_date, emoji, image_url, status, organizer_id,
        profiles:organizer_id (full_name, business_name, account_type),
        ticket_types (id, name, price_cfa, quantity_total, quantity_sold)
      `)
      .eq('status', 'published')
      .order('event_date', { ascending: true })

    if (!silent) setLoad('events', false)

    if (error) {
      console.error('loadEvents:', error)
      setErr('events', 'Impossible de charger les événements. Vérifiez votre connexion et réessayez.')
      // Keep whatever was already loaded — never substitute made-up demo
      // events, which have no real tickets and would look purchasable.
      return eventsRef.current
    }

    const shaped = (data || []).map(shapeEvent)
    setEventsState(shaped)
    return shaped
  }, [])

  // Separate from `loadEvents` (public, published-only) so an organizer
  // still sees their own pending/cancelled events in "Mes Événements" while
  // those stay hidden from the public listing until an admin approves them.
  const loadMyEvents = useCallback(async (userId) => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, description, city, venue, category,
        event_date, emoji, image_url, status, organizer_id,
        ticket_types (id, name, price_cfa, quantity_total, quantity_sold)
      `)
      .eq('organizer_id', userId)
      .order('event_date', { ascending: true })

    if (error) { console.error('loadMyEvents:', error); return [] }
    const shaped = (data || []).map(shapeEvent)
    setMyEventsAll(shaped)
    return shaped
  }, [])

  const loadPendingEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, description, city, venue, category,
        event_date, emoji, image_url, status, organizer_id,
        profiles:organizer_id (full_name, business_name, account_type, email),
        ticket_types (id, name, price_cfa, quantity_total, quantity_sold)
      `)
      .eq('status', 'pending')
      .order('event_date', { ascending: true })

    if (error) { console.error('loadPendingEvents:', error); return [] }
    return (data || []).map((e) => ({ ...shapeEvent(e), organizerEmail: e.profiles?.email }))
  }, [])

  const approveEvent = useCallback(async (eventId) => {
    const { error } = await supabase.from('events').update({ status: 'published' }).eq('id', eventId)
    if (error) { console.error('approveEvent:', error); return false }
    await loadEvents()
    return true
  }, [loadEvents])

  // ── REALTIME: live ticket sold count ───────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('ticket_types_sold')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ticket_types' }, () => {
        loadEvents(true)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadEvents])

  // ── EVENT MANAGEMENT ───────────────────────────────────────
  // Returns { created, freshEvents } — the composition root uses freshEvents
  // to drive the orders-domain refresh that the original inline version did
  // internally (only when userRole is organizer/admin, exactly as before).
  const createEvent = useCallback(async (ev) => {
    if (!user?.id) return null

    const { data: created, error } = await supabase
      .from('events')
      .insert({
        organizer_id: user.id,
        title:        ev.title,
        description:  ev.desc || '',
        city:         ev.city || '',
        venue:        ev.location || '',
        category:     ev.category || '',
        event_date:   `${ev.date}T${ev.time || '20:00'}:00`,
        emoji:        ev.emoji || '🎟️',
        image_url:    ev.imageUrl || null,
        is_private:   ev.isPrivate || false,
        // New events wait for admin review before they're publicly visible —
        // loadEvents() only ever selects status='published'.
        status:       'pending',
      })
      .select()
      .single()

    if (error) { console.error('createEvent:', error); return null }

    if (ev.tickets?.length) {
      const { error: tkErr } = await supabase.from('ticket_types').insert(
        ev.tickets.map((t) => ({
          event_id:       created.id,
          name:           t.name,
          price_cfa:      t.price,
          quantity_total: t.total,
          quantity_sold:  0,
        }))
      )
      if (tkErr) { console.error('createEvent tickets:', tkErr); return null }
    }

    const freshEvents = await loadEvents()
    await loadMyEvents(user.id)
    return { created, freshEvents }
  }, [user, loadEvents, loadMyEvents])

  const deleteEvent = useCallback(async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) { console.error('deleteEvent:', error); return false }
    const freshEvents = await loadEvents()
    if (user?.id) await loadMyEvents(user.id)
    return { ok: true, freshEvents }
  }, [user, loadEvents, loadMyEvents])

  const updateEvent = useCallback(async (eventId, ev) => {
    const { error } = await supabase
      .from('events')
      .update({
        title:       ev.title,
        description: ev.desc,
        city:        ev.city,
        venue:       ev.location,
        category:    ev.category,
        event_date:  `${ev.date}T${ev.time || '20:00'}:00`,
        emoji:       ev.emoji || '🎟️',
        image_url:   ev.imageUrl || null,
        is_private:  ev.isPrivate || false,
      })
      .eq('id', eventId)
    if (error) { console.error('updateEvent:', error); return false }

    // Re-sync ticket types: update existing (preserving IDs/sold counts), add new, remove deleted
    if (ev.tickets?.length) {
      const { data: existing } = await supabase
        .from('ticket_types')
        .select('id, name, quantity_sold')
        .eq('event_id', eventId)

      const existingByName = {}
      for (const t of existing || []) existingByName[t.name] = t

      const newNames = new Set(ev.tickets.map(t => t.name))

      // Delete removed ticket types
      const toDelete = (existing || []).filter(t => !newNames.has(t.name)).map(t => t.id)
      if (toDelete.length) await supabase.from('ticket_types').delete().in('id', toDelete)

      for (const t of ev.tickets) {
        if (existingByName[t.name]) {
          // Update existing — preserve ID and sold count
          await supabase.from('ticket_types')
            .update({ price_cfa: t.price, quantity_total: t.total })
            .eq('id', existingByName[t.name].id)
        } else {
          // Insert new
          await supabase.from('ticket_types').insert({
            event_id: eventId, name: t.name,
            price_cfa: t.price, quantity_total: t.total, quantity_sold: 0,
          })
        }
      }
    }

    await loadEvents()
    if (user?.id) await loadMyEvents(user.id)
    return true
  }, [user, loadEvents, loadMyEvents])

  const uploadEventImage = useCallback(async (file) => {
    if (!user?.id || !file) return null
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('event-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) { console.error('uploadEventImage:', error); return null }
    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path)
    return publicUrl
  }, [user])

  const myEvents = myEventsAll

  return {
    events, eventsRef, myEvents,
    loadEvents, loadMyEvents, loadPendingEvents, approveEvent,
    createEvent, updateEvent, deleteEvent, uploadEventImage,
  }
}
