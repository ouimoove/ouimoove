import { useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// Contact form. Independent — `user` is optional (anonymous visitors can submit).
export function useContact({ user }) {
  const submitContact = useCallback(async ({ name, email, subject, message }) => {
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return { ok: false, error: 'Veuillez remplir tous les champs requis.' }
    }
    const { error } = await supabase.from('contact_messages').insert({
      name:    name.trim(),
      email:   email.trim(),
      subject: subject?.trim() || null,
      message: message.trim(),
      user_id: user?.id || null,
    })
    if (error) {
      console.error('submitContact:', error)
      return { ok: false, error: "Impossible d'envoyer le message. Réessayez." }
    }
    return { ok: true }
  }, [user])

  return { submitContact }
}
