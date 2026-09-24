import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAsyncStatus } from './useAsyncStatus.js'
import { useAuth } from './useAuth.js'
import { useEvents } from './useEvents.js'
import { useOrders } from './useOrders.js'
import { useResale } from './useResale.js'
import { useCart } from './useCart.js'
import { useFeed } from './useFeed.js'
import { usePush } from './usePush.js'
import { useInvitations } from './useInvitations.js'
import { useOrganizerAdmin } from './useOrganizerAdmin.js'
import { useContact } from './useContact.js'

// ─────────────────────────────────────────────────────────────────────────
// Composition root. Each domain below owns one slice of state and has no
// knowledge of the others — dependencies flow one way, top to bottom
// (auth → events → orders → resale → cart → feed/push/invitations/admin).
// The one place a real cycle exists in the original single-file version —
// event mutations needing to refresh organizer stats/orders afterward — is
// resolved here explicitly instead of being hidden inside either domain.
// This file's only job is wiring; every return value/behavior below is
// unchanged from the pre-split version.
// ─────────────────────────────────────────────────────────────────────────
export function useStore() {
  const { loading, errors, setLoad, setErr } = useAsyncStatus()
  const auth = useAuth()

  const events = useEvents({ user: auth.user, userRole: auth.userRole, setLoad, setErr })

  const orders = useOrders({
    user: auth.user, events: events.events,
    loadEvents: events.loadEvents, loadMyEvents: events.loadMyEvents,
    setLoad, setErr,
  })

  const resale = useResale({
    user: auth.user, events: events.events,
    loadEvents: events.loadEvents, loadMyOrders: orders.loadMyOrders,
    setLoad, setErr,
  })

  const cart = useCart({
    user: auth.user, events: events.events,
    loadEvents: events.loadEvents, loadMyOrders: orders.loadMyOrders,
    loadResaleListings: resale.loadResaleListings,
  })

  const feed = useFeed({ user: auth.user, eventsRef: events.eventsRef, setLoad, setErr })
  const push = usePush({ user: auth.user })
  const invitations = useInvitations({ user: auth.user })
  const admin = useOrganizerAdmin({ user: auth.user })
  const contact = useContact({ user: auth.user })

  const [justPaidOrder, setJustPaidOrder] = useState(null)

  // ── Cross-domain orchestration for event mutations ──────────────────
  // Same conditions/order the original inline createEvent/deleteEvent used:
  // refresh organizer stats + orders only when the acting user is an
  // organizer/admin, using the fresh events array the mutation just produced.
  const createEvent = useCallback(async (ev) => {
    const result = await events.createEvent(ev)
    if (!result) return null
    const { created, freshEvents } = result
    if (auth.userRole === 'organizer' || auth.userRole === 'admin' || auth.userRole === 'super_admin') {
      await orders.loadOrganizerStats(auth.user.id)
      await orders.loadOrganizerOrders(auth.user.id, freshEvents)
    }
    return created
  }, [events, orders, auth.userRole, auth.user])

  const deleteEvent = useCallback(async (id) => {
    const result = await events.deleteEvent(id)
    if (!result) return false
    const { freshEvents } = result
    if (auth.userRole === 'organizer' || auth.userRole === 'admin' || auth.userRole === 'super_admin') {
      await orders.loadOrganizerOrders(auth.user?.id, freshEvents)
      await orders.loadOrganizerStats(auth.user?.id)
    }
    return true
  }, [events, orders, auth.userRole, auth.user])

  // ── REALTIME: notify when one of my orders gets marked paid ────────
  // Order completion can happen via the browser's own return-flow call OR
  // independently via the paydunya-webhook (e.g. if the browser never made
  // it back to the return URL). This subscription is what lets the "here
  // are your tickets" celebration fire in the second case too — it reacts
  // to the actual DB transition rather than relying solely on the redirect.
  useEffect(() => {
    if (!auth.user?.id) return
    const channel = supabase
      .channel(`my_orders_${auth.user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${auth.user.id}`,
      }, (payload) => {
        if (payload.new.payment_status === 'paid' && payload.old?.payment_status !== 'paid') {
          setJustPaidOrder({ orderId: payload.new.id, at: Date.now() })
          events.loadEvents(true)
          orders.loadMyOrders(auth.user.id, events.eventsRef.current, auth.user.name)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [auth.user?.id, auth.user?.name, events.loadEvents, orders.loadMyOrders]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── AUTH STATE ───────────────────────────────────────────────────
  useEffect(() => {
    events.loadEvents()
    resale.loadResaleListings()

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        const profile = { id: u.id, name: u.user_metadata?.full_name || u.email, email: u.email }
        auth.setUserState(profile)
        auth.loadUserRole(u.id)
        auth.loadFavorites(u.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      // Landing from a password-reset email link: ask for the new password.
      if (_evt === 'PASSWORD_RECOVERY') auth.setRecoveryMode(true)
      const u = session?.user
      if (u) {
        const profile = { id: u.id, name: u.user_metadata?.full_name || u.email, email: u.email }
        auth.setUserState(profile)
        auth.loadUserRole(u.id)
        auth.loadFavorites(u.id)
      } else {
        auth.resetLocalState()
        orders.resetLocalState()
        admin.resetLocalState()
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth.user?.id || events.events.length === 0) return
    orders.loadMyOrders(auth.user.id, events.events, auth.user.name)
    orders.loadOrganizerOrders(auth.user.id, events.events)
    if (auth.userRole === 'organizer' || auth.userRole === 'admin' || auth.userRole === 'super_admin') {
      orders.loadOrganizerStats(auth.user.id)
      events.loadMyEvents(auth.user.id)
    }
    if (auth.userRole === 'admin' || auth.userRole === 'super_admin') {
      admin.loadApplications()
    }
  }, [auth.user?.id, auth.userRole, events.events.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // deleteAccount also needs to clear orders/admin local state — the
  // original single-file version did this inline; auth.deleteAccount only
  // knows how to reset what it owns, so the composition root finishes the
  // job the same way the auth-state effect above does for a normal sign-out.
  const deleteAccount = useCallback(async () => {
    const result = await auth.deleteAccount()
    if (result.ok) {
      orders.resetLocalState()
      admin.resetLocalState()
    }
    return result
  }, [auth, orders, admin])

  const logout = useCallback(async () => {
    await auth.logout()
    orders.resetLocalState()
    admin.resetLocalState()
  }, [auth, orders, admin])

  const isOrganizer  = auth.userRole === 'organizer' || auth.userRole === 'admin' || auth.userRole === 'super_admin'
  const isAdmin      = auth.userRole === 'admin' || auth.userRole === 'super_admin'
  const isSuperAdmin = auth.userRole === 'super_admin'

  return {
    user: auth.user, userRole: auth.userRole, userNumber: auth.userNumber, isVerified: auth.isVerified,
    isOrganizer, isAdmin, isSuperAdmin,
    recoveryMode: auth.recoveryMode,
    sendPasswordReset: auth.sendPasswordReset,
    updatePassword: auth.updatePassword,
    events: events.events, cart: cart.cart, favorites: auth.favorites,
    myPurchases:    orders.myOrders,
    organizerOrders: orders.organizerOrders,
    organizerStats:  orders.organizerStats,
    purchases:      orders.organizerOrders,
    myOrders:       orders.myOrders,
    myEvents:       events.myEvents,
    cartCount: cart.cartCount, cartTotal: cart.cartTotal,
    loading, errors,
    resaleListings: resale.resaleListings,

    login: auth.login, signup: auth.signup, googleLogin: auth.googleLogin, logout, updateProfile: auth.updateProfile, deleteAccount,
    applyForOrganizer: auth.applyForOrganizer,

    addToCart: cart.addToCart, removeFromCart: cart.removeFromCart, clearCart: cart.clearCart,

    purchase: cart.purchase,
    verifyPaydunyaReturn: cart.verifyPaydunyaReturn,

    toggleFavorite: auth.toggleFavorite,

    createEvent, updateEvent: events.updateEvent, deleteEvent,

    listTicketForResale: resale.listTicketForResale,
    cancelResaleListing: resale.cancelResaleListing,
    buyResaleListing:    resale.buyResaleListing,
    loadResaleListings:  resale.loadResaleListings,

    checkinPurchase: orders.checkinPurchase, checkinByRef: orders.checkinByRef,
    checkinPartial:  orders.checkinPartial,  lookupByRef:  orders.lookupByRef,
    refundOrder:     orders.refundOrder,

    applications: admin.applications,
    loadApplications: admin.loadApplications,
    becomeOrganizer: auth.becomeOrganizer,
    promoteToOrganizer: admin.promoteToOrganizer,
    rejectApplication:  admin.rejectApplication,

    loadAdmins: admin.loadAdmins,
    promoteToAdmin: admin.promoteToAdmin,
    demoteAdmin: admin.demoteAdmin,

    uploadEventImage: events.uploadEventImage,
    subscribePush:   push.subscribePush,
    unsubscribePush: push.unsubscribePush,

    loadCities: admin.loadCities,
    requestCity: admin.requestCity,
    loadCityRequests: admin.loadCityRequests,
    approveCityRequest: admin.approveCityRequest,
    denyCityRequest: admin.denyCityRequest,

    loadMyEvents: events.loadMyEvents,
    loadPendingEvents: events.loadPendingEvents,
    approveEvent: events.approveEvent,

    inviteToEvent: invitations.inviteToEvent,
    loadInvitations: invitations.loadInvitations,
    getInvitationDetails: invitations.getInvitationDetails,
    respondInvitation: invitations.respondInvitation,

    submitVerification: admin.submitVerification,
    loadVerificationStatus: admin.loadVerificationStatus,
    loadVerificationRequests: admin.loadVerificationRequests,
    approveVerification: admin.approveVerification,
    denyVerification: admin.denyVerification,

    submitContact: contact.submitContact,

    feedPosts: feed.feedPosts,
    loadFeedPosts: feed.loadFeedPosts,
    createFeedPost: feed.createFeedPost,
    deleteFeedPost: feed.deleteFeedPost,

    justPaidOrder,

    refreshOrganizerData: orders.refreshOrganizerData,
    loadEvents: events.loadEvents,
    loadOrganizerStats: orders.loadOrganizerStats,
  }
}
