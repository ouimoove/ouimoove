import { useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Private-event invitations. Independent — only needs `user`.
export function useInvitations({ user }) {
  const inviteToEvent = useCallback(async (eventId, email, eventTitle, eventDate, eventCity) => {
    if (!user) return { ok: false, error: 'Non connecté' }
    const { data, error } = await supabase
      .from('event_invitations')
      .upsert({ event_id: eventId, email: email.trim().toLowerCase(), invited_by: user.id, organizer_id: user.id }, { onConflict: 'event_id,email' })
      .select('token')
      .single()
    if (error) { console.error('inviteToEvent:', error); return { ok: false, error: error.message } }
    const inviteUrl = `${window.location.origin}/?invite=${data.token}`
    // Send email (fire-and-forget)
    supabase.functions.invoke('send-invitation', {
      body: { to: email.trim(), inviterName: user.name, eventTitle, eventDate, eventCity, inviteUrl }
    }).catch(console.error)
    return { ok: true, token: data.token, inviteUrl }
  }, [user])

  const loadInvitations = useCallback(async (eventId) => {
    const { data, error } = await supabase
      .from('event_invitations')
      .select('id,email,status,token,created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) return []
    return data
  }, [])

  const getInvitationDetails = useCallback(async (token) => {
    const { data, error } = await supabase.rpc('get_invitation_details', { invite_token: token })
    if (error) return { ok: false, error: error.message }
    return data
  }, [])

  const respondInvitation = useCallback(async (token, decision) => {
    const { data, error } = await supabase.rpc('respond_invitation', { invite_token: token, decision })
    if (error) return { ok: false, error: error.message }
    return data
  }, [])

  return { inviteToEvent, loadInvitations, getInvitationDetails, respondInvitation }
}
