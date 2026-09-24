import { useMemo } from 'react'
import { EventCard } from './EventCard.jsx'
import { minPrice } from '../utils/helpers.js'
import styles from './EventGrid.module.css'

export function EventGrid({
  events, favorites, search, filterCity, filterCategory, sortBy,
  onOpenEvent, onToggleFav, loading, error, onRetry,
}) {
  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let evs = events.filter((e) => {
      if (e.date < today) return false
      const q = search.toLowerCase()
      const matchQ = !q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)
      const matchCat  = !filterCategory || e.category === filterCategory
      const matchCity = !filterCity || e.city === filterCity
      return matchQ && matchCat && matchCity
    })
    if (sortBy === 'price-asc')  evs = [...evs].sort((a, b) => minPrice(a) - minPrice(b))
    else if (sortBy === 'price-desc') evs = [...evs].sort((a, b) => minPrice(b) - minPrice(a))
    else if (sortBy === 'name')  evs = [...evs].sort((a, b) => a.title.localeCompare(b.title))
    else evs = [...evs].sort((a, b) => new Date(a.date) - new Date(b.date))
    return evs
  }, [events, search, filterCity, filterCategory, sortBy])

  if (loading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner}>⟳</div>
        <p>Chargement des événements…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.state}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>⚠️</div>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{ marginTop: 14, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >↻ Réessayer</button>
        )}
      </div>
    )
  }

  if (!filtered.length) {
    return (
      <div className={styles.state}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
        <p>Aucun événement trouvé</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {filtered.map((e) => (
        <EventCard
          key={e.id}
          event={e}
          isFav={favorites.includes(e.id)}
          onOpen={onOpenEvent}
          onToggleFav={onToggleFav}
        />
      ))}
    </div>
  )
}
