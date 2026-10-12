import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDate, minPrice, fmtPrice, dateParts } from '../utils/helpers.js'
import { Icon, categoryIcon } from './Icon.jsx'
import styles from './FeaturedRail.module.css'

// "À l'affiche": the next events in a swipeable row (native touch / trackpad
// scrolling with snap points) plus arrow buttons for mouse users.
export function FeaturedRail({ events, onOpen }) {
  const track = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, events.length])

  const page = (dir) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className={styles.rail} aria-label="À l'affiche">
      <div className={styles.head}>
        <div>
          <span className={styles.eyebrow}>À L'AFFICHE</span>
          <h2 className={styles.title}>Les prochains rendez-vous</h2>
        </div>
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} onClick={() => page(-1)} disabled={edge.start} aria-label="Précédents">
            <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button type="button" className={styles.arrow} onClick={() => page(1)} disabled={edge.end} aria-label="Suivants">
            <Icon name="arrow" />
          </button>
        </div>
      </div>

      <div className={styles.track} ref={track} onScroll={measure}>
        {events.map((e) => {
          const { day, mon } = dateParts(e.date)
          const mp = minPrice(e)
          return (
            <button key={e.id} type="button" className={styles.slide} onClick={() => onOpen(e.id)}>
              <span className={styles.art}>
                {e.imageUrl
                  ? <img src={e.imageUrl} alt="" loading="lazy" />
                  : <span className={styles.artIcon}><Icon name={categoryIcon(e.category)} strokeWidth={1.4} /></span>}
                <span className={styles.date}><b>{day}</b><small>{mon}</small></span>
                <span className={styles.cat}>{e.category}</span>
              </span>
              <span className={styles.info}>
                <strong>{e.title}</strong>
                <span className={styles.line}><Icon name="pin" /> {e.city} · {formatDate(e.date)}</span>
                <span className={styles.price}>{mp > 0 ? `Dès ${fmtPrice(mp)}` : 'Gratuit'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
