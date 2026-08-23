export function useProfileActions(store, toast, { close }) {
  const onSave = async (name, email, pwd) => {
    const updated = await store.updateProfile(name, email, pwd)
    if (!updated) { toast('Impossible de mettre à jour le profil', 'error'); return }
    toast('Profil mis à jour', 'success')
    close()
  }

  const onSubscribePush = async () => {
    const ok = await store.subscribePush()
    if (ok) toast('Notifications activées 🔔', 'success')
    else toast('Notifications non disponibles', 'error')
    return ok
  }

  const onUnsubscribePush = async () => {
    await store.unsubscribePush()
    toast('Notifications désactivées', 'info')
  }

  const onSubmitVerification = async (file) => {
    const result = await store.submitVerification(file)
    if (result?.ok) toast('Document envoyé ! Vérification en cours.', 'success')
    else toast(result?.error || 'Erreur lors de l\'envoi.', 'error')
    return result
  }

  return { onSave, onSubscribePush, onUnsubscribePush, onSubmitVerification }
}
