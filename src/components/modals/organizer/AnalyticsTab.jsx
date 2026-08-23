import { Spinner, ErrorBanner } from './shared.jsx'

export function AnalyticsTab({ organizerStats, myEvents, loading, errors, onRefresh }) {
  if (loading.stats) return <Spinner />
  if (errors.stats) return <ErrorBanner msg={errors.stats} onRetry={onRefresh} />

  const s = organizerStats || {}
  const breakdown = s.events_breakdown || []

  const maxRevenue = Math.max(...breakdown.map(e => e.revenue_cfa || 0), 1)
  const maxTickets = Math.max(...breakdown.map(e => e.tickets_sold || 0), 1)

  // Capacity per event from myEvents
  const capacity = (eventId) => {
    const ev = myEvents.find(e => e.id === eventId)
    return ev ? ev.tickets.reduce((s, t) => s + t.total, 0) : 0
  }

  const barStyle = (pct, color) => ({
    height: 8, borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}88)`,
    width: `${Math.max(2, pct)}%`, transition: 'width .5s ease',
  })

  if (!breakdown.length) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>Aucune donnée. Créez un événement et vendez des billets.</p>
  }

  return (
    <div>
      {/* Revenue chart */}
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Revenus par événement (FCFA)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {[...breakdown].sort((a, b) => (b.revenue_cfa || 0) - (a.revenue_cfa || 0)).map(e => (
          <div key={e.event_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{e.title}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>{(e.revenue_cfa || 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={barStyle(((e.revenue_cfa || 0) / maxRevenue) * 100, 'var(--success)')} />
            </div>
          </div>
        ))}
      </div>

      {/* Tickets sold chart */}
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Billets vendus vs capacité</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {breakdown.map(e => {
          const cap = capacity(e.event_id)
          const sold = e.tickets_sold || 0
          const pct = cap > 0 ? Math.round((sold / cap) * 100) : 0
          return (
            <div key={e.event_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{e.title}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', flexShrink: 0 }}>{sold}{cap > 0 ? ` / ${cap}` : ''} · <b style={{ color: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--orange)' : 'var(--success)' }}>{pct}%</b></span>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={barStyle(Math.min(pct, 100), pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--orange)' : 'var(--purple2)')} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Category breakdown */}
      {(() => {
        const byCategory = {}
        breakdown.forEach(e => {
          const ev = myEvents.find(ev => ev.id === e.event_id)
          const cat = ev?.category || 'Autre'
          byCategory[cat] = (byCategory[cat] || 0) + (e.revenue_cfa || 0)
        })
        const cats = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
        if (!cats.length) return null
        const maxCat = Math.max(...cats.map(c => c[1]), 1)
        return (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Revenus par catégorie</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cats.map(([cat, rev]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--orange)', fontWeight: 700 }}>{rev.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={barStyle((rev / maxCat) * 100, 'var(--orange)')} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      })()}
    </div>
  )
}
