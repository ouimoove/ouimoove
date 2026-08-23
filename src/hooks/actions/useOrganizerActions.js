// OrganizerModal's full handler set — by far the largest single block of
// inline closures App.jsx carried (~90 lines). Every one of these just
// wraps a store call with the toast-then-branch pattern; kept together
// since they're all specific to the one OrganizerModal instance and none
// are reused elsewhere.
export function useOrganizerActions(store, toast, { setCities }) {
  const onCreate = async (ev) => {
    const created = await store.createEvent(ev)
    if (!created) { toast("Impossible de créer l'événement", 'error'); return null }
    toast('Événement envoyé pour validation ⏳', 'success')
    return created
  }

  const onUpdate = async (eventId, data) => {
    const ok = await store.updateEvent(eventId, data)
    if (!ok) toast("Impossible de mettre à jour l'événement", 'error')
    return ok
  }

  const onDelete = async (id) => {
    const ok = await store.deleteEvent(id)
    if (!ok) { toast("Impossible de supprimer l'événement", 'error'); return }
    toast('Événement supprimé', 'info')
  }

  const onRefund = async (orderId) => {
    const ok = await store.refundOrder(orderId)
    if (!ok) { toast('Impossible de rembourser la commande', 'error'); return }
    toast('Commande remboursée ↩', 'info')
  }

  const onCheckin = async (purchaseId, eventId) => {
    const ok = await store.checkinPurchase(purchaseId, eventId)
    if (!ok) { toast('Impossible de valider ce billet', 'error'); return }
    toast('Check-in mis à jour ✓', 'success')
  }

  const onPromote = async (userId, appId) => {
    const ok = await store.promoteToOrganizer(userId, appId)
    if (!ok) { toast('Impossible de promouvoir cet utilisateur', 'error'); return }
    toast('Utilisateur promu organisateur ✓', 'success')
  }

  const onReject = async (appId) => {
    const ok = await store.rejectApplication(appId)
    if (!ok) { toast('Impossible de refuser la demande', 'error'); return }
    toast('Demande refusée', 'info')
  }

  const onRequestCity = async (name) => {
    const result = await store.requestCity(name)
    if (!result?.ok) toast(result?.error || 'Erreur lors de la demande', 'error')
    return result
  }

  const onApproveCityRequest = async (id, name) => {
    const ok = await store.approveCityRequest(id, name)
    if (ok) { toast(`Ville "${name}" ajoutée ✓`, 'success'); store.loadCities().then(l => { if (l?.length) setCities(l) }) }
    else toast('Impossible d\'approuver', 'error')
    return ok
  }

  const onDenyCityRequest = async (id) => {
    const ok = await store.denyCityRequest(id)
    if (ok) toast('Demande refusée.', 'info')
    else toast('Impossible de refuser', 'error')
    return ok
  }

  const onApproveVerif = async (userId) => {
    const ok = await store.approveVerification(userId)
    if (ok) toast('Compte vérifié ✓', 'success')
    else toast('Impossible d\'approuver', 'error')
    return ok
  }

  const onDenyVerif = async (userId, reason) => {
    const ok = await store.denyVerification(userId, reason)
    if (ok) toast('Demande refusée.', 'info')
    else toast('Impossible de refuser', 'error')
    return ok
  }

  const onApproveEvent = async (id) => {
    const ok = await store.approveEvent(id)
    if (ok) toast('Événement approuvé et publié ✓', 'success')
    else toast("Impossible d'approuver", 'error')
    return ok
  }

  const onRejectEvent = async (id) => {
    const ok = await store.deleteEvent(id)
    if (ok) toast('Événement refusé et supprimé', 'info')
    else toast('Impossible de refuser', 'error')
    return ok
  }

  return {
    onCreate, onUpdate, onDelete, onRefund, onCheckin,
    onPromote, onReject,
    onRequestCity, onApproveCityRequest, onDenyCityRequest,
    onApproveVerif, onDenyVerif,
    onApproveEvent, onRejectEvent,
  }
}
