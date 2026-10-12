import { useMemo } from 'react'
import { EventCard } from './EventCard.jsx'
import { FeaturedRail } from './FeaturedRail.jsx'
import { minPrice } from '../utils/helpers.js'
import styles from './EventGrid.module.css'
import { Icon } from './Icon.jsx'

export function EventGrid({
  events, favorites, search, filterCity, filterCategory, sortBy, maxPrice,
  onOpenEvent, onToggleFav, loading, error, onRetry,
}) {
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  }, [events])

  const filtered = useMemo(() => {
    let evs = upcoming.filter((e) => {
      const q = search.toLowerCase()
      const matchQ = !q || e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)
      const matchCat  = !filterCategory || e.category === filterCategory
      const matchCity = !filterCity || e.city === filterCity
      const matchPrice = maxPrice == null || minPrice(e) <= maxPrice
      return matchQ && matchCat && matchCity && matchPrice
    })
    if (sortBy === 'price-asc')  evs = [...evs].sort((a, b) => minPrice(a) - minPrice(b))
    else if (sortBy === 'price-desc') evs = [...evs].sort((a, b) => minPrice(b) - minPrice(a))
    else if (sortBy === 'name')  evs = [...evs].sort((a, b) => a.title.localeCompare(b.title))
    return evs   // already ordered by date otherwise
  }, [upcoming, search, filterCity, filterCategory, sortBy, maxPrice])

  const filtersActive = !!(search || filterCity || filterCategory || maxPrice != null)

  if (loading) {
    return (
      <div className={styles.state} id="evenements">
        <div className={styles.spinner} aria-hidden="true" />
        <p>Chargement des événements…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.state} id="evenements">
        <div className={styles.stateIcon}><Icon name="alert" /></div>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retry}>
            <Icon name="undo" /> Réessayer
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {!filtersActive && upcoming.length >= 3 && (
        <FeaturedRail events={upcoming.slice(0, 8)} onOpen={onOpenEvent} />
      )}

      <section className={styles.section} id="evenements">
        <div className={styles.head}>
          <div>
            <span className={styles.eyebrow}>ÉVÉNEMENTS</span>
            <h2 className={styles.title}>{filtersActive ? 'Résultats' : 'Tous les événements'}</h2>
          </div>
          <span className={styles.count}>
            {filtered.length} événement{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {!filtered.length ? (
          <div className={styles.empty}>
            <div className={styles.stateIcon}><Icon name="search" /></div>
            <p>Aucun événement trouvé</p>
            {filtersActive && <small>Essayez d'élargir votre recherche, votre ville ou votre budget.</small>}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((e, i) => (
              <EventCard
                key={e.id}
                index={i}
                event={e}
                isFav={favorites.includes(e.id)}
                onOpen={onOpenEvent}
                onToggleFav={onToggleFav}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
