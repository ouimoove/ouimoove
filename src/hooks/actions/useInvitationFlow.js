import { useState } from 'react'

// Private-event invitation flow: loading an invite's details to show the
// RSVP prompt, and recording the accept/decline response. State + logic
// live here; App.jsx's effects still own *when* this fires (on the
// ?invite=<token> URL param, and again once a logged-out visitor signs in),
// since that timing is routing, not invitation logic.
export function useInvitationFlow(store, toast, { open, close }) {
  const [pendingInvite, setPendingInvite] = useState(null)

  const loadInviteAndOpenRsvp = async (token) => {
    const result = await store.getInvitationDetails(token)
    if (result?.ok) {
      setPendingInvite({ token, ...result })
      open('rsvp')
    } else if (result?.error === 'email_mismatch') {
      toast(`Cette invitation est destinée à ${result.invited_email}. Connectez-vous avec ce compte.`, 'error')
    } else {
      toast(result?.error || 'Lien d\'invitation invalide.', 'error')
    }
  }

  const respondToInvite = async (token, decision) => {
    const result = await store.respondInvitation(token, decision)
    if (result?.ok) {
      toast(
        decision === 'accepted'
          ? '🎉 Présence confirmée ! Vous pouvez maintenant voir et réserver cet événement.'
          : 'Réponse envoyée. Merci de nous avoir prévenus.',
        'success'
      )
      close()
      if (decision === 'accepted') await store.loadEvents()
    } else {
      toast(result?.error || 'Une erreur est survenue.', 'error')
    }
  }

  return { pendingInvite, loadInviteAndOpenRsvp, respondToInvite }
}
