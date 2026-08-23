import { formatDate } from '../../../utils/helpers.js'
import { Spinner, ErrorBanner } from './shared.jsx'

export function MyEventsTab({ myEvents, onDelete, onEdit, loading, errors }) {
  if (loading.orgOrders) return <Spinner />
  if (errors.orgOrders) return <ErrorBanner msg={errors.orgOrders} />
  if (!myEvents.length) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
      Aucun événement créé. Utilisez l'onglet <b>Créer</b>.
    </p>
  )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {myEvents.map(e => {
        const isPast = e.date < today
        return (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '14px 16px', opacity: isPast ? 0.65 : 1,
        }}>
          <span style={{ fontSize: '1.8rem', flexShrink: 0, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', borderRadius: 8 }}>{e.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
              {e.status === 'pending' && (
                <span style={{ flexShrink: 0, background: 'rgba(244,154,14,.15)', color: 'var(--orange)', fontSize: '0.65rem', fontWeight: 700, borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  En attente de validation
                </span>
              )}
              {isPast && (
                <span style={{ flexShrink: 0, background: 'var(--bg2)', color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 700, borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Terminé
                </span>
              )}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatDate(e.date)} · {e.city} · {e.tickets.map(t => `${t.name}: ${t.sold}/${t.total}`).join(' · ')}
            </div>
          </div>
          <button
            onClick={() => onEdit(e)}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}
          >✏️</button>
          <button
            onClick={() => { if (window.confirm('Supprimer cet événement ?')) onDelete(e.id) }}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--danger)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}
          >🗑️</button>
        </div>
        )
      })}
    </div>
  )
}
