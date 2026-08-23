// Small pieces reused across two or more organizer tabs.
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
      <div style={{ fontSize: '0.85rem' }}>Chargement…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
      borderRadius: 12, padding: '14px 16px', marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>⚠️ {msg}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'transparent', border: '1px solid var(--danger)',
          color: 'var(--danger)', borderRadius: 8, padding: '4px 12px',
          cursor: 'pointer', fontSize: '0.78rem',
        }}>Réessayer</button>
      )}
    </div>
  )
}

// ── Shared form styles (EventForm, InvitationsTab, AttendeesTab) ──
export const inputStyle = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '9px 13px', color: 'var(--text)',
  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
}
export const labelStyle = { display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 6 }
export const groupStyle = { marginBottom: 14 }
