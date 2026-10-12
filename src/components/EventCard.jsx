import { formatDate, minPrice, fmtPrice, dateParts } from '../utils/helpers.js'
import { useReveal } from '../hooks/useReveal.js'
import styles from './EventCard.module.css'
import { Icon, categoryIcon } from './Icon.jsx'

export function EventCard({ event, isFav, onOpen, onToggleFav, index = 0 }) {
  const mp = minPrice(event)
  const { day, mon } = dateParts(event.date)
  const [ref, shown] = useReveal()

  return (
    <article
      ref={ref}
      className={[styles.card, shown ? styles.in : ''].join(' ')}
      style={{ '--d': `${(index % 3) * 90}ms` }}
      onClick={() => onOpen(event.id)}
    >
      <div className={styles.imgWrap}>
        <div className={styles.media}>
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              loading="lazy"
              className={styles.coverImg}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
            />
          ) : null}
          <div className={styles.placeholder} style={event.imageUrl ? { display: 'none' } : {}}><Icon name={categoryIcon(event.category)} strokeWidth={1.5} /></div>
        </div>
        <span className={styles.badge}>{event.category}</span>
        <button
          className={[styles.favBtn, isFav ? styles.favActive : ''].join(' ')}
          onClick={(e) => { e.stopPropagation(); onToggleFav(event.id) }}
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Icon name="heart" size="1.05rem" style={isFav ? { fill: 'currentColor' } : undefined} />
        </button>
        {day && (
          <div className={styles.dateTile} aria-hidden="true">
            <b>{day}</b>
            <small>{mon}</small>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>
        <p className={styles.desc}>{event.desc}</p>
        <div className={styles.meta}>
          <span><Icon name="calendar" /> {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
          <span><Icon name="pin" /> {event.city}</span>
        </div>
        <div className={styles.footer}>
          <div className={styles.price}>
            {fmtPrice(mp)}{mp > 0 && <small> / billet</small>}
          </div>
          <button className={styles.viewBtn}>Voir <Icon name="arrow" /></button>
        </div>
      </div>
    </article>
  )
}
