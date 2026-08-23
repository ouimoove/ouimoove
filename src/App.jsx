import { useState, useEffect } from 'react'
import { useStore } from './hooks/useStore.js'
import { useToast } from './hooks/useToast.js'
import { useCheckoutFlow } from './hooks/actions/useCheckoutFlow.js'
import { useAuthActions } from './hooks/actions/useAuthActions.js'
import { useOrganizerActions } from './hooks/actions/useOrganizerActions.js'
import { useProfileActions } from './hooks/actions/useProfileActions.js'
import { useTicketActions } from './hooks/actions/useTicketActions.js'
import { useInvitationFlow } from './hooks/actions/useInvitationFlow.js'
import { Navbar } from './components/Navbar.jsx'
import { Hero } from './components/Hero.jsx'
import { EventGrid } from './components/EventGrid.jsx'
import { Footer } from './components/Footer.jsx'
import { Toast } from './components/Toast.jsx'
import { OnboardingModal, FaqModal, ContactModal, TermsModal, PrivacyModal } from './components/modals/InfoModals.jsx'
import { DeleteAccountModal } from './components/modals/DeleteAccountModal.jsx'
import { AuthModal } from './components/modals/AuthModal.jsx'
import { EventDetailModal } from './components/modals/EventDetailModal.jsx'
import { CartModal } from './components/modals/CartModal.jsx'
import { CheckoutModal } from './components/modals/CheckoutModal.jsx'
import { MyTicketsModal } from './components/modals/MyTicketsModal.jsx'
import { FavoritesModal } from './components/modals/FavoritesModal.jsx'
import { ProfileModal } from './components/modals/ProfileModal.jsx'
import { OrganizerModal } from './components/modals/OrganizerModal.jsx'
import { ResaleMarketModal } from './components/modals/ResaleMarketModal.jsx'
import { FeedModal } from './components/modals/FeedModal.jsx'
import { RSVPModal } from './components/modals/RSVPModal.jsx'

function App() {
  const store = useStore()
  const { toasts, toast } = useToast()

  const [modal,           setModal]           = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [search,          setSearch]          = useState('')
  const [filterCity,      setFilterCity]      = useState('')
  const [filterCategory,  setFilterCategory]  = useState('')
  const [sortBy,          setSortBy]          = useState('date')
  const [cities,          setCities]          = useState([])

  const open  = (m) => setModal(m)
  const close = () => setModal(null)

  // ── Action hooks — each owns the toast-then-branch wiring for one modal
  // (or a small cluster of closely related modals) instead of it living
  // inline here. App.jsx's own job is routing: which modal is open, and
  // wiring URL/lifecycle events to the right handler below.
  const checkout   = useCheckoutFlow(store, toast, { open, close })
  const authActions = useAuthActions(store, toast, { close })
  const organizerActions = useOrganizerActions(store, toast, { setCities })
  const profileActions   = useProfileActions(store, toast, { close })
  const ticketActions    = useTicketActions(store, toast)
  const invitation = useInvitationFlow(store, toast, { open, close })

  // Fires "here are your tickets" the moment any of my orders gets marked
  // paid — including when it happens via the webhook, independent of
  // whether the browser ever made it back to the PayDunya return URL.
  useEffect(() => {
    if (!store.justPaidOrder) return
    checkout.celebrateOrder(store.justPaidOrder.orderId)
  }, [store.justPaidOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Service worker + cities ────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
    store.loadCities().then(list => { if (list?.length) setCities(list) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── PayDunya return handling ───────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('paydunya_return') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      ;(async () => {
        toast('Vérification du paiement…', 'info')
        const result = await store.verifyPaydunyaReturn()
        if (result?.ok) {
          checkout.celebrateOrder(result.orderId)
        } else {
          toast('Paiement annulé ou échoué.', 'error')
        }
      })()
    } else if (params.get('paydunya_cancel') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      toast('Paiement annulé.', 'info')
    } else if (params.get('invite')) {
      const token = params.get('invite')
      window.history.replaceState({}, '', window.location.pathname)
      if (!store.user) {
        sessionStorage.setItem('pending_invite', token)
        toast('Connectez-vous pour répondre à cette invitation.', 'info')
        open('login')
        return
      }
      invitation.loadInviteAndOpenRsvp(token)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show the RSVP prompt for a pending invite once the user is logged in
  useEffect(() => {
    if (!store.user) return
    const token = sessionStorage.getItem('pending_invite')
    if (!token) return
    sessionStorage.removeItem('pending_invite')
    invitation.loadInviteAndOpenRsvp(token)
  }, [store.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared event link (?event=<id>) ────────────────────────
  // Auto-opens the event detail modal once events have loaded, so links
  // shared to WhatsApp/Facebook/etc. land straight on the right event.
  useEffect(() => {
    if (modal) return
    const id = new URLSearchParams(window.location.search).get('event')
    if (!id || !store.events.length) return
    if (!store.events.some((e) => e.id === id)) return
    setSelectedEventId(id)
    open('event')
  }, [store.events.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── First-visit onboarding ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasFlow = params.get('paydunya_return') || params.get('paydunya_cancel') || params.get('invite') || params.get('event')
    if (hasFlow) return
    if (!localStorage.getItem('om_onboarded')) {
      const t = setTimeout(() => setModal(m => m ?? 'onboarding'), 600)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const closeOnboarding = () => {
    localStorage.setItem('om_onboarded', '1')
    close()
  }

  const requireAuth = (then) => {
    if (!store.user) { open('login'); return false }
    then()
    return true
  }

  const openFeed = () => requireAuth(() => { store.loadFeedPosts(); open('feed') })

  const openEvent = (id) => {
    setSelectedEventId(id)
    open('event')
    const url = new URL(window.location.href)
    url.searchParams.set('event', id)
    window.history.pushState({}, '', url)
  }

  const closeEvent = () => {
    close()
    const url = new URL(window.location.href)
    url.searchParams.delete('event')
    window.history.replaceState({}, '', url)
  }

  const handleToggleFav = async (eventId) => {
    if (!requireAuth(() => {})) return
    const wasFav = store.favorites.includes(eventId)
    const ok = await store.toggleFavorite(eventId)
    if (!ok) { toast('Impossible de mettre à jour les favoris', 'error'); return }
    toast(wasFav ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️', wasFav ? 'info' : 'success')
  }

  const handleCreateEvent = async () => {
    if (!store.user) { open('login'); return }
    if (!store.isOrganizer) {
      const ok = await store.becomeOrganizer()
      if (!ok) { toast('Impossible d\'activer le mode organisateur. Réessayez.', 'error'); return }
    }
    open('organizer')
  }

  const handleLogoClick = () => {
    setSearch('')
    setFilterCity('')
    setFilterCategory('')
    setSortBy('date')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // My listings (to show "en vente" badge on tickets)
  const myListings = store.resaleListings.filter(l => l.seller_id === store.user?.id)

  const selectedEvent = store.events.find((e) => e.id === selectedEventId)

  return (
    <>
      <Navbar
        user={store.user}
        cartCount={store.cartCount}
        isOrganizer={store.isOrganizer}
        onLogin={() => open('login')}
        onSignup={() => open('signup')}
        onCart={() => open('cart')}
        onTickets={() => requireAuth(() => open('tickets'))}
        onFeed={openFeed}
        onFavorites={() => requireAuth(() => open('favorites'))}
        onProfile={() => requireAuth(() => open('profile'))}
        onOrganizer={() => requireAuth(() => open('organizer'))}
        onLogout={authActions.logoutFromNavbar}
        onLogoClick={handleLogoClick}
        onMarket={() => open('market')}
        onCreateEvent={handleCreateEvent}
      />

      <Hero
        search={search}           setSearch={setSearch}
        filterCity={filterCity}   setFilterCity={setFilterCity}
        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
        sortBy={sortBy}           setSortBy={setSortBy}
        onCreateEvent={handleCreateEvent}
      />

      <EventGrid
        events={store.events}
        favorites={store.favorites}
        loading={store.loading.events}
        error={store.errors.events}
        search={search}
        filterCity={filterCity}
        filterCategory={filterCategory}
        sortBy={sortBy}
        onOpenEvent={openEvent}
        onToggleFav={handleToggleFav}
      />

      {/* ── Auth ── */}
      <AuthModal
        mode={modal === 'login' ? 'login' : modal === 'signup' ? 'signup' : null}
        onClose={close}
        onSwitch={(m) => open(m)}
        onLogin={authActions.onLogin}
        onSignup={authActions.onSignup}
        onGoogle={authActions.onGoogle}
      />

      {/* ── Event detail ── */}
      <EventDetailModal
        open={modal === 'event'}
        event={selectedEvent}
        onClose={closeEvent}
        onAddToCart={(selections) => requireAuth(() => checkout.handleAddToCart(selectedEvent, selections))}
        toast={toast}
      />

      {/* ── Cart ── */}
      <CartModal
        open={modal === 'cart'}
        cart={store.cart}
        cartTotal={store.cartTotal}
        onClose={close}
        onRemove={(id) => { store.removeFromCart(id); toast('Retiré du panier', 'info') }}
        onCheckout={() => open('checkout')}
      />

      {/* ── Checkout ── */}
      <CheckoutModal
        open={modal === 'checkout'}
        cart={store.cart}
        cartTotal={store.cartTotal}
        onClose={close}
        onConfirm={checkout.handlePurchase}
      />

      {/* ── My Tickets ── */}
      <MyTicketsModal
        open={modal === 'tickets'}
        purchases={store.myPurchases}
        myListings={myListings}
        onClose={close}
        toast={toast}
        onListForResale={ticketActions.onListForResale}
        onCancelListing={ticketActions.onCancelListing}
      />

      {/* ── Favorites ── */}
      <FavoritesModal
        open={modal === 'favorites'}
        events={store.events}
        favorites={store.favorites}
        onClose={close}
        onOpenEvent={openEvent}
        onToggleFav={handleToggleFav}
      />

      {/* ── Profile ── */}
      <ProfileModal
        open={modal === 'profile'}
        user={store.user}
        userNumber={store.userNumber}
        isVerified={store.isVerified}
        isOrganizer={store.isOrganizer}
        onClose={close}
        onSave={profileActions.onSave}
        onLogout={authActions.logoutFromProfile}
        onDeleteAccount={() => open('deleteAccount')}
        onApply={store.applyForOrganizer}
        onSubscribePush={profileActions.onSubscribePush}
        onUnsubscribePush={profileActions.onUnsubscribePush}
        onSubmitVerification={profileActions.onSubmitVerification}
        onLoadVerificationStatus={store.loadVerificationStatus}
      />

      {/* ── Organizer Dashboard ── */}
      <OrganizerModal
        open={modal === 'organizer'}
        user={store.user}
        isAdmin={store.isAdmin}
        myEvents={store.myEvents}
        purchases={store.purchases}
        organizerOrders={store.organizerOrders}
        organizerStats={store.organizerStats}
        applications={store.applications}
        loading={store.loading}
        errors={store.errors}
        onClose={close}
        onCreate={organizerActions.onCreate}
        onUpdate={organizerActions.onUpdate}
        onDelete={organizerActions.onDelete}
        onRefund={organizerActions.onRefund}
        onCheckin={organizerActions.onCheckin}
        onCheckinByRef={store.checkinByRef}
        onCheckinPartial={store.checkinPartial}
        onLookupByRef={store.lookupByRef}
        onRefresh={store.refreshOrganizerData}
        onPromote={organizerActions.onPromote}
        onReject={organizerActions.onReject}
        onLoadApplications={store.loadApplications}
        onUploadImage={store.uploadEventImage}
        onInvite={store.inviteToEvent}
        onLoadInvitations={store.loadInvitations}
        cities={cities}
        onRequestCity={organizerActions.onRequestCity}
        onLoadCityRequests={store.loadCityRequests}
        onApproveCityRequest={organizerActions.onApproveCityRequest}
        onDenyCityRequest={organizerActions.onDenyCityRequest}
        onLoadVerifRequests={store.loadVerificationRequests}
        onApproveVerif={organizerActions.onApproveVerif}
        onDenyVerif={organizerActions.onDenyVerif}
        onLoadPendingEvents={store.loadPendingEvents}
        onApproveEvent={organizerActions.onApproveEvent}
        onRejectEvent={organizerActions.onRejectEvent}
        toast={toast}
      />

      {/* ── Resale Market ── */}
      <ResaleMarketModal
        open={modal === 'market'}
        listings={store.resaleListings}
        currentUserId={store.user?.id}
        loading={store.loading.resale}
        onClose={close}
        onBuy={async (listing, method, phone) => {
          if (!store.user) { open('login'); return null }
          return await checkout.handleBuyResale(listing, method, phone)
        }}
      />

      {/* ── Feed ── */}
      <FeedModal
        open={modal === 'feed'}
        posts={store.feedPosts}
        events={store.events}
        loading={store.loading.feed}
        currentUserId={store.user?.id}
        onClose={close}
        onCreate={store.createFeedPost}
        onDelete={async (postId) => {
          const ok = await store.deleteFeedPost(postId)
          if (ok) toast('Moment supprimé', 'info')
          else toast('Impossible de supprimer ce moment', 'error')
        }}
        toast={toast}
      />

      <Footer
        onHowItWorks={() => open('onboarding')}
        onFaq={() => open('faq')}
        onContact={() => open('contact')}
        onTerms={() => open('terms')}
        onPrivacy={() => open('privacy')}
        onMarket={() => open('market')}
        onCreateEvent={handleCreateEvent}
      />

      {/* ── Onboarding / How it works ── */}
      <OnboardingModal open={modal === 'onboarding'} onClose={closeOnboarding} />

      {/* ── FAQ ── */}
      <FaqModal
        open={modal === 'faq'}
        onClose={close}
        onContact={() => open('contact')}
      />

      {/* ── Contact ── */}
      <ContactModal
        open={modal === 'contact'}
        onClose={close}
        user={store.user}
        toast={toast}
        onSubmit={store.submitContact}
      />

      {/* ── Terms ── */}
      <TermsModal open={modal === 'terms'} onClose={close} />

      {/* ── Privacy Policy ── */}
      <PrivacyModal
        open={modal === 'privacy'}
        onClose={close}
        onDeleteAccount={store.user ? () => open('deleteAccount') : null}
      />

      {/* ── Delete Account ── */}
      <DeleteAccountModal
        open={modal === 'deleteAccount'}
        onClose={close}
        onConfirm={store.deleteAccount}
        toast={toast}
      />

      {/* ── Event invitation RSVP ── */}
      <RSVPModal
        open={modal === 'rsvp'}
        onClose={close}
        invite={invitation.pendingInvite}
        onRespond={invitation.respondToInvite}
      />

      <Toast toasts={toasts} />
    </>
  )
}

export default App
