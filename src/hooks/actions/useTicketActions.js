export function useTicketActions(store, toast) {
  const onListForResale = async (params) => {
    if (!store.user) return null
    return await store.listTicketForResale(params)
  }

  const onCancelListing = async (listingId) => {
    const ok = await store.cancelResaleListing(listingId)
    if (ok) toast('Annonce retirée.', 'info')
    else toast('Impossible de retirer l\'annonce.', 'error')
  }

  return { onListForResale, onCancelListing }
}
