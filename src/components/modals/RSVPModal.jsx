import { useState } from 'react'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import { formatDate } from '../../utils/helpers.js'

const primaryBtn = {
  background: 'linear-gradient(135deg, var(--orange1), var(--orange2))',
  color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px',
  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%',
}
const declineBtn = {
  background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)',
  borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontSize: '0.95rem',
  cursor: 'pointer', width: '100%',
}

export function RSVPModal({ open, onClose, invite, onRespond }) {
  const [loading, setLoading] = useState(null)

  if (!invite) return null

  const respond = async (decision) => {
    setLoading(decision)
    await onRespond(invite.token, decision)
    setLoading(null)
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader
        title={`${invite.event_emoji || '🎉'} Vous êtes invité(e)`}
        subtitle="Confirmez votre présence à cet événement privé"
      />
      <ModalBody>
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{invite.event_title}</div>
          <div style={{ color: 'var(--purple3)', fontSize: '0.88rem' }}>
            📅 {invite.event_date ? formatDate(invite.event_date) : ''} &nbsp;·&nbsp; 📍 {invite.event_city}
          </div>
        </div>

        {invite.status === 'accepted' && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 14 }}>
            Vous avez déjà confirmé votre présence. Vous pouvez changer votre réponse ci-dessous.
          </p>
        )}
        {invite.status === 'declined' && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 14 }}>
            Vous aviez indiqué ne pas pouvoir venir. Vous pouvez changer votre réponse ci-dessous.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }} disabled={!!loading} onClick={() => respond('accepted')}>
            {loading === 'accepted' ? 'Confirmation…' : '🎉 J\'y serai'}
          </button>
          <button style={{ ...declineBtn, opacity: loading ? 0.6 : 1 }} disabled={!!loading} onClick={() => respond('declined')}>
            {loading === 'declined' ? 'Envoi…' : 'Je ne pourrai pas venir'}
          </button>
        </div>
      </ModalBody>
    </Modal>
  )
}
