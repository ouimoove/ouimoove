import { formatDate } from '../../../utils/helpers.js'
import { Spinner, ErrorBanner } from './shared.jsx'

export function OverviewTab({ organizerStats, loading, errors, onRefresh }) {
  if (loading.stats) return <Spinner />
  if (errors.stats) return <ErrorBanner msg={errors.stats} onRetry={onRefresh} />

  const s = organizerStats || {}
  const stats = [
    { label: 'Événements publiés',  value: s.published_events   ?? 0,                          color: 'var(--orange)'  },
    { label: 'Billets vendus',      value: s.total_tickets_sold ?? 0,                          color: 'var(--purple2)' },
    { label: 'Revenus (FCFA)',      value: (s.total_revenue_cfa ?? 0).toLocaleString('fr-FR'), color: 'var(--success)' },
    { label: 'Participants uniques',value: s.unique_attendees   ?? 0,                          color: 'var(--orange2)' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 14px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.76rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {s.events_breakdown?.length > 0 && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Par événement</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.events_breakdown.map((e) => (
              <div key={e.event_id} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{formatDate(e.event_date.slice(0, 10))}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--purple2)', fontSize: '0.95rem' }}>{e.tickets_sold}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>billets</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--orange)', fontSize: '0.95rem' }}>{(e.revenue_cfa || 0).toLocaleString('fr-FR')}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>FCFA</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>{e.attendee_count}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>participants</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!organizerStats && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
          Créez votre premier événement depuis l'onglet <b>Créer</b>.
        </p>
      )}
    </div>
  )
}
