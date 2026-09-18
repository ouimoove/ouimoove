import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Organizer applications, account verification, and city requests — the
// admin-moderation-adjacent flows that only ever need `user`. Fully
// independent of every other domain.
export function useOrganizerAdmin({ user }) {
  const [applications, setApplications] = useState([])

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from('organizer_applications')
      .select('id, user_id, reason, status, created_at, profiles:user_id (full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) { console.error('loadApplications:', error); return }
    setApplications(
      (data || []).map((a) => ({
        id:        a.id,
        userId:    a.user_id,
        userName:  a.profiles?.full_name || a.profiles?.email || 'Inconnu',
        userEmail: a.profiles?.email || '',
        reason:    a.reason,
        status:    a.status,
        date:      a.created_at,
      }))
    )
  }, [])

  const promoteToOrganizer = useCallback(async (targetUserId, applicationId) => {
    const { error } = await supabase.rpc('promote_to_organizer', { target_user_id: targetUserId })
    if (error) { console.error('promoteToOrganizer:', error); return false }
    if (applicationId) {
      await supabase.from('organizer_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', applicationId)
    }
    await loadApplications()
    return true
  }, [user, loadApplications])

  const rejectApplication = useCallback(async (applicationId) => {
    const { error } = await supabase.from('organizer_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq('id', applicationId)
    if (error) { console.error('rejectApplication:', error); return false }
    await loadApplications()
    return true
  }, [user, loadApplications])

  const resetLocalState = useCallback(() => {
    setApplications([])
  }, [])

  // ── VERIFICATION ───────────────────────────────────────────
  const submitVerification = useCallback(async (file) => {
    if (!user) return { ok: false, error: 'Non connecté' }
    const ext = file.name.split('.').pop()
    const path = `${user.id}/id-card.${ext}`
    const { error: upErr } = await supabase.storage
      .from('verification-docs')
      .upload(path, file, { upsert: true })
    if (upErr) return { ok: false, error: upErr.message }
    const { data: urlData } = supabase.storage.from('verification-docs').getPublicUrl(path)
    const url = urlData?.publicUrl || path
    const { error } = await supabase
      .from('verification_requests')
      .upsert({ user_id: user.id, id_card_url: url, status: 'pending', denial_reason: null }, { onConflict: 'user_id' })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [user])

  const loadVerificationStatus = useCallback(async () => {
    if (!user) return null
    const { data } = await supabase
      .from('verification_requests')
      .select('status, denial_reason, created_at')
      .eq('user_id', user.id)
      .single()
    return data
  }, [user])

  const loadVerificationRequests = useCallback(async () => {
    const { data } = await supabase
      .from('verification_requests')
      .select('id, user_id, id_card_url, status, denial_reason, created_at, profiles(name, email, user_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    return data || []
  }, [])

  const approveVerification = useCallback(async (targetUserId) => {
    const { error } = await supabase.rpc('approve_verification', { target_user_id: targetUserId })
    if (error) { console.error('approveVerification:', error); return false }
    return true
  }, [])

  const denyVerification = useCallback(async (targetUserId, reason) => {
    const { error } = await supabase.rpc('deny_verification', { target_user_id: targetUserId, reason })
    if (error) { console.error('denyVerification:', error); return false }
    return true
  }, [])

  // ── CITIES ─────────────────────────────────────────────────
  const loadCities = useCallback(async () => {
    const { data } = await supabase.from('cities').select('name').order('name')
    return (data || []).map(r => r.name)
  }, [])

  const requestCity = useCallback(async (name) => {
    if (!user) return { ok: false, error: 'Non connecté' }
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Nom de ville requis' }
    const { error } = await supabase.from('city_requests').insert({ name: trimmed, requested_by: user.id })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [user])

  const loadCityRequests = useCallback(async () => {
    const { data } = await supabase
      .from('city_requests')
      .select('id, name, status, created_at, profiles:requested_by(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    return data || []
  }, [])

  const approveCityRequest = useCallback(async (requestId, cityName) => {
    const { error: insertErr } = await supabase.from('cities').insert({ name: cityName }).select().single()
    if (insertErr && !insertErr.message.includes('duplicate')) {
      console.error('approveCityRequest insert:', insertErr); return false
    }
    const { error } = await supabase.from('city_requests').update({ status: 'approved' }).eq('id', requestId)
    if (error) { console.error('approveCityRequest update:', error); return false }
    return true
  }, [])

  const denyCityRequest = useCallback(async (requestId) => {
    const { error } = await supabase.from('city_requests').update({ status: 'denied' }).eq('id', requestId)
    if (error) { console.error('denyCityRequest:', error); return false }
    return true
  }, [])

  // ── ADMIN MANAGEMENT (super_admin only) ────────────────────
  // Every admin keeps their own separate login here — promoteToAdmin only
  // elevates a profile that already exists (created via normal signup);
  // it never creates credentials. RLS/RPCs enforce the super_admin check
  // server-side too, this is just the client-side wiring.
  const loadAdmins = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'super_admin'])
      .order('role', { ascending: false })
    if (error) { console.error('loadAdmins:', error); return [] }
    return data || []
  }, [])

  const promoteToAdmin = useCallback(async (email) => {
    const { data, error } = await supabase.rpc('promote_to_admin', { target_email: email })
    if (error) return { ok: false, error: error.message }
    return data
  }, [])

  const demoteAdmin = useCallback(async (targetUserId) => {
    const { data, error } = await supabase.rpc('demote_admin', { target_user_id: targetUserId })
    if (error) return { ok: false, error: error.message }
    return data
  }, [])

  return {
    applications, loadApplications, promoteToOrganizer, rejectApplication, resetLocalState,
    submitVerification, loadVerificationStatus, loadVerificationRequests, approveVerification, denyVerification,
    loadCities, requestCity, loadCityRequests, approveCityRequest, denyCityRequest,
    loadAdmins, promoteToAdmin, demoteAdmin,
  }
}
