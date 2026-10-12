import { formatDate } from '../../../utils/helpers.js'
import { Spinner, ErrorBanner } from './shared.jsx'
import { Icon, categoryIcon } from '../../Icon.jsx'
import styles from '../OrganizerModal.module.css'

export function MyEventsTab({ myEvents, onDelete, onEdit, loading, errors }) {
  if (loading.orgOrders) return <Spinner />
  if (errors.orgOrders) return <ErrorBanner msg={errors.orgOrders} />
  if (!myEvents.length) return (
    <div className={styles.state}>
      <div className={styles.stateIcon}><Icon name="calendar" /></div>
      Aucun événement créé. Utilisez l'onglet <b>Créer</b>.
    </div>
  )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className={styles.eventList}>
      {myEvents.map((e, i) => {
        const isPast = e.date < today
        const total = e.tickets.reduce((a, t) => a + (t.total || 0), 0)
        const sold = e.tickets.reduce((a, t) => a + (t.sold || 0), 0)
        const pct = total ? Math.min(100, Math.round((sold / total) * 100)) : 0
        return (
          <div key={e.id} className={[styles.eventRow, isPast ? styles.eventPast : ''].join(' ')} style={{ '--i': i }}>
            <div className={styles.eventTile}><Icon name={categoryIcon(e.category)} /></div>
            <div className={styles.eventInfo}>
              <div className={styles.eventTop}>
                <span className={styles.eventTitle}>{e.title}</span>
                {e.status === 'pending' && <span className={`${styles.pill} ${styles.pillPending}`}>En attente de validation</span>}
                {isPast && <span className={`${styles.pill} ${styles.pillDone}`}>Terminé</span>}
              </div>
              <div className={styles.eventMeta}>
                {formatDate(e.date)} · {e.city} · {e.tickets.map(t => `${t.name}: ${t.sold}/${t.total}`).join(' · ')}
              </div>
              <div className={styles.sold} title={`${pct}% vendus`}><i style={{ width: `${pct}%` }} /></div>
            </div>
            <button className={styles.iconBtn} onClick={() => onEdit(e)} aria-label={`Modifier ${e.title}`}><Icon name="pencil" /></button>
            <button
              className={`${styles.iconBtn} ${styles.iconDanger}`}
              onClick={() => { if (window.confirm('Supprimer cet événement ?')) onDelete(e.id) }}
              aria-label={`Supprimer ${e.title}`}
            ><Icon name="trash" /></button>
          </div>
        )
      })}
    </div>
  )
}
