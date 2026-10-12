// Small pieces reused across two or more organizer tabs.
import { Icon } from '../../Icon.jsx'
import styles from '../OrganizerModal.module.css'

export function Spinner() {
  return (
    <div className={styles.state}>
      <div className={styles.spinner} aria-hidden="true" />
      Chargement…
    </div>
  )
}

export function ErrorBanner({ msg, onRetry }) {
  return (
    <div className={styles.err} role="alert">
      <span><Icon name="alert" /> {msg}</span>
      {onRetry && <button onClick={onRetry}>Réessayer</button>}
    </div>
  )
}

// ── Shared form styles (EventForm, InvitationsTab, AttendeesTab) ──
export const inputStyle = {
  width: '100%', background: '#fff', border: '2px solid #e4d3df',
  borderRadius: 16, padding: '10px 14px', color: 'var(--text)',
  fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
}
export const labelStyle = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--plum)', marginBottom: 6 }
export const groupStyle = { marginBottom: 16 }
