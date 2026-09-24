import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Auth + profile identity. Independent of every other domain — the only
// thing other hooks need from here is the resulting `user`/`userRole`
// values, passed down as plain arguments by the useStore composition root.
export function useAuth() {
  const [user,       setUserState] = useState(null)
  const [userRole,   setUserRole]  = useState('user')
  const [userNumber, setUserNumber] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [favorites,  setFavoritesState] = useState([])
  const [recoveryMode, setRecoveryMode] = useState(false)

  const loadUserRole = useCallback(async (userId) => {
    if (!userId) return 'user'
    const { data } = await supabase
      .from('profiles')
      .select('role, user_number, is_verified')
      .eq('id', userId)
      .single()
    const role = data?.role || 'user'
    setUserRole(role)
    setUserNumber(data?.user_number || null)
    setIsVerified(data?.is_verified || false)
    return { role, userNumber: data?.user_number, isVerified: data?.is_verified || false }
  }, [])

  const loadFavorites = useCallback(async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', userId)
    setFavoritesState((data || []).map((f) => f.event_id))
  }, [])

  const toggleFavorite = useCallback(async (eventId) => {
    if (!user?.id) return false
    const isFav = favorites.includes(eventId)
    if (isFav) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', eventId)
      if (error) { console.error('toggleFavorite remove:', error); return false }
      setFavoritesState(favorites.filter((f) => f !== eventId))
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, event_id: eventId })
      if (error) { console.error('toggleFavorite add:', error); return false }
      setFavoritesState([...favorites, eventId])
    }
    return true
  }, [user, favorites])

  // Resets everything auth owns. Also called by useStore's auth-state effect
  // (on SIGNED_OUT) and by deleteAccount — both pass in the other domains'
  // reset callbacks so this stays the single source of truth for "what does
  // logging out clear."
  const resetLocalState = useCallback(() => {
    setUserState(null)
    setUserRole('user')
    setIsVerified(false)
    setFavoritesState([])
  }, [])

  const login = useCallback(async (email, password) => {
    if (!email || !password) return { ok: false, error: 'Email et mot de passe requis.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    const u = data.user
    const profile = { id: u.id, name: u.user_metadata?.full_name || u.email, email: u.email }
    setUserState(profile)
    await loadUserRole(u.id)
    await loadFavorites(u.id)
    return { ok: true, user: profile }
  }, [loadUserRole, loadFavorites])

  const signup = useCallback(async (name, email, password, businessInfo = {}) => {
    if (!name || !email || !password) return { ok: false, error: 'Tous les champs sont requis.' }
    if (password.length < 6) return { ok: false, error: 'Mot de passe trop court (6 car. min).' }
    const { accountType = 'personal', businessName = '', phone = '' } = businessInfo
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name,
          account_type: accountType,
          business_name: businessName,
          phone,
        },
      },
    })
    if (error) return { ok: false, error: error.message }
    const u = data.user
    if (!u) return { ok: false, error: 'Création du compte impossible.' }
    const profile = { id: u.id, name, email: u.email }

    // Best-effort: persist the business info on the profile row too, so it's
    // queryable/joinable (e.g. showing "Organisé par <business>" on events)
    // without relying solely on auth metadata. Column may not exist yet on
    // projects that haven't run the events-moderation-era migration — don't
    // let that failure block signup, which has already succeeded above.
    if (accountType === 'business') {
      await supabase.from('profiles')
        .update({ account_type: accountType, business_name: businessName, phone })
        .eq('id', u.id)
        .then(({ error: profErr }) => { if (profErr) console.warn('signup: could not persist business info:', profErr.message) })
    }

    // No session yet means email confirmation is required — don't mark the
    // user as logged in until they actually have a real, authenticated
    // session, otherwise authenticated requests (storage, RLS-protected
    // inserts) fail silently because auth.uid() is null server-side.
    if (!data.session) return { ok: true, user: profile, needsEmailConfirmation: true }
    setUserState(profile)
    await loadFavorites(u.id)
    return { ok: true, user: profile }
  }, [loadFavorites])

  // Password reset: request a link (sent via the send-auth-email hook), then —
  // when the user lands back from that link — Supabase fires PASSWORD_RECOVERY
  // with a temporary session, which flips `recoveryMode` so the UI can ask for
  // the new password.
  const sendPasswordReset = useCallback(async (email) => {
    if (!email) return { ok: false, error: 'Email requis.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) return { ok: false, error: 'Mot de passe trop court (6 car. min).' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }
    setRecoveryMode(false)
    return { ok: true }
  }, [])

  const googleLogin = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    resetLocalState()
  }, [resetLocalState])

  const updateProfile = useCallback(async (name, email, pwd) => {
    if (!user) return null
    const payload = { data: { full_name: name } }
    if (email && email !== user.email) payload.email = email
    if (pwd) payload.password = pwd
    const { error } = await supabase.auth.updateUser(payload)
    if (error) { console.error('updateProfile:', error); return null }
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
    const updated = { ...user, name, email: email || user.email }
    setUserState(updated)
    return updated
  }, [user])

  // Calls the delete-account edge function (service role) which: blocks if
  // the user organizes upcoming events with sold tickets, purges their UGC
  // (feed posts + storage), favorites, listings, push subs, verification
  // docs, marks their past orders buyer_account_deleted=true (kept for
  // admin/accounting, hidden from organizers), then deletes the auth user.
  const deleteAccount = useCallback(async () => {
    if (!user?.id) return { ok: false, error: 'Non connecté' }
    const { data, error } = await supabase.functions.invoke('delete-account', { body: {} })
    if (error || data?.error) return { ok: false, error: data?.error || error?.message || 'Erreur lors de la suppression.' }
    await supabase.auth.signOut()
    resetLocalState()
    return { ok: true }
  }, [user, resetLocalState])

  const applyForOrganizer = useCallback(async (reason) => {
    if (!user) return { ok: false, error: 'Non connecté' }
    const { error } = await supabase.from('organizer_applications').insert({ user_id: user.id, reason })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }, [user])

  const becomeOrganizer = useCallback(async () => {
    if (!user) return false
    const { error } = await supabase.rpc('self_become_organizer')
    if (error) { console.error('becomeOrganizer:', error); return false }
    setUserRole('organizer')
    return true
  }, [user])

  return {
    user, userRole, userNumber, isVerified, favorites, recoveryMode,
    sendPasswordReset, updatePassword,
    setUserState, setUserRole, setIsVerified, setRecoveryMode, // exposed for the auth-state effect in useStore.js
    loadUserRole, loadFavorites, toggleFavorite, resetLocalState,
    login, signup, googleLogin, logout, updateProfile, deleteAccount,
    applyForOrganizer, becomeOrganizer,
  }
}
