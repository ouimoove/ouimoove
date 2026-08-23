import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const shapeFeedPost = (p) => ({
  id:         p.id,
  userId:     p.user_id,
  userName:   p.user_name,
  eventId:    p.event_id,
  eventTitle: p.events?.title  || 'Événement',
  eventVenue: p.events?.venue  || '',
  eventCity:  p.events?.city   || '',
  eventEmoji: p.events?.emoji  || '🎟️',
  mediaUrl:   p.media_url,
  mediaType:  p.media_type,
  caption:    p.caption || '',
  createdAt:  p.created_at,
})

// Event feed (crowd photos/videos). Only reads `eventsRef` (a ref, not
// reactive state) to enrich realtime INSERT payloads — passed in from the
// events domain, one-directional.
export function useFeed({ user, eventsRef, setLoad, setErr }) {
  const [feedPosts, setFeedPosts] = useState([])

  const loadFeedPosts = useCallback(async () => {
    setLoad('feed', true)
    setErr('feed', null)
    const { data, error } = await supabase
      .from('event_posts')
      .select('*, events(title, venue, city, emoji)')
      .order('created_at', { ascending: false })
      .limit(100)
    setLoad('feed', false)
    if (error) {
      console.error('loadFeedPosts:', error)
      setErr('feed', error.message)
      return
    }
    setFeedPosts((data || []).map(shapeFeedPost))
  }, [setLoad, setErr])

  const createFeedPost = useCallback(async ({ eventId, file, caption }) => {
    if (!user?.id) return { ok: false, error: 'Non connecté' }
    if (!eventId || !file) return { ok: false, error: 'Choisissez un événement et un fichier.' }

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return { ok: false, error: 'Formats acceptés : photo ou vidéo.' }
    if (file.size > 50 * 1024 * 1024) return { ok: false, error: 'Fichier trop volumineux (max 50 Mo).' }

    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('event-posts')
      .upload(path, file, { contentType: file.type })
    if (upErr) {
      console.error('createFeedPost upload:', upErr)
      return { ok: false, error: "Impossible d'envoyer le fichier." }
    }
    const { data: { publicUrl } } = supabase.storage.from('event-posts').getPublicUrl(path)

    const { data, error } = await supabase.from('event_posts').insert({
      user_id:    user.id,
      user_name:  user.name,
      event_id:   eventId,
      media_url:  publicUrl,
      media_type: isVideo ? 'video' : 'image',
      caption:    caption?.trim() || null,
    }).select('*, events(title, venue, city, emoji)').single()

    if (error) {
      console.error('createFeedPost insert:', error)
      return { ok: false, error: "Impossible de publier ce moment." }
    }
    setFeedPosts((prev) => [shapeFeedPost(data), ...prev])
    return { ok: true }
  }, [user])

  const deleteFeedPost = useCallback(async (postId) => {
    const post = feedPosts.find((p) => p.id === postId)
    const { error } = await supabase.from('event_posts').delete().eq('id', postId)
    if (error) { console.error('deleteFeedPost:', error); return false }
    if (post) {
      const marker = '/object/public/event-posts/'
      const idx = post.mediaUrl.indexOf(marker)
      if (idx !== -1) {
        const path = post.mediaUrl.slice(idx + marker.length)
        supabase.storage.from('event-posts').remove([path]).then(({ error: rmErr }) => {
          if (rmErr) console.error('deleteFeedPost storage cleanup:', rmErr)
        })
      }
    }
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId))
    return true
  }, [feedPosts])

  // Realtime: new posts appear for everyone without a refresh.
  // Subscribes once — reads eventsRef instead of depending on `events`
  // directly, since loadEvents() produces a new array on every background
  // refresh (e.g. the ticket-count realtime callback) and would otherwise
  // force this channel to unsubscribe/resubscribe constantly.
  useEffect(() => {
    const channel = supabase
      .channel('event_posts_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_posts' }, (payload) => {
        setFeedPosts((prev) => {
          if (prev.some((p) => p.id === payload.new.id)) return prev
          const ev = eventsRef.current.find((e) => e.id === payload.new.event_id)
          return [shapeFeedPost({
            ...payload.new,
            events: ev ? { title: ev.title, venue: ev.location, city: ev.city, emoji: ev.emoji } : null,
          }), ...prev]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { feedPosts, loadFeedPosts, createFeedPost, deleteFeedPost }
}
