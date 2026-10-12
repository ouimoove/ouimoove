import { formatDate, ORGANIZER_FEE_PCT, organizerNet } from '../../../utils/helpers.js'
import { Spinner, ErrorBanner } from './shared.jsx'
import { Icon } from '../../Icon.jsx'
import styles from '../OrganizerModal.module.css'

export function OverviewTab({ organizerStats, loading, errors, onRefresh }) {
  if (loading.stats) return <Spinner />
  if (errors.stats) return <ErrorBanner msg={errors.stats} onRetry={onRefresh} />

  const s = organizerStats || {}
  const gross = s.total_revenue_cfa ?? 0
  const stats = [
    { label: `Net après commission ${ORGANIZER_FEE_PCT}% (FCFA)`, value: organizerNet(gross).toLocaleString('fr-FR'), icon: 'wallet', hero: true },
    { label: 'Ventes brutes (FCFA)', value: gross.toLocaleString('fr-FR'), icon: 'card' },
    { label: 'Billets vendus',       value: s.total_tickets_sold ?? 0,     icon: 'ticket' },
    { label: 'Événements publiés',   value: s.published_events ?? 0,       icon: 'calendar' },
    { label: 'Participants uniques', value: s.unique_attendees ?? 0,       icon: 'users' },
  ]

  return (
    <div>
      <div className={styles.stats}>
        {stats.map((st, i) => (
          <div key={st.label} className={[styles.stat, st.hero ? styles.statHero : ''].join(' ')} style={{ '--i': i }}>
            <div className={styles.statIcon}><Icon name={st.icon} /></div>
            <div className={styles.statVal}>{st.value}</div>
            <div className={styles.statLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {s.events_breakdown?.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>Par événement</h3>
          <div className={styles.breakdown}>
            {s.events_breakdown.map((e) => (
              <div key={e.event_id} className={styles.bRow}>
                <div>
                  <div className={styles.bTitle}>{e.title}</div>
                  <div className={styles.bDate}>{formatDate(e.event_date.slice(0, 10))}</div>
                </div>
                <div className={styles.bNums}>
                  <div className={styles.bNum}><b>{e.tickets_sold}</b><small>billets</small></div>
                  <div className={styles.bNum}>
                    <b>{(e.revenue_cfa || 0).toLocaleString('fr-FR')}</b>
                    <small>FCFA brut · net {organizerNet(e.revenue_cfa).toLocaleString('fr-FR')}</small>
                  </div>
                  <div className={styles.bNum}><b>{e.attendee_count}</b><small>participants</small></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!organizerStats && (
        <div className={styles.state}>
          <div className={styles.stateIcon}><Icon name="plus" /></div>
          Créez votre premier événement depuis l'onglet <b>Créer</b>.
        </div>
      )}
    </div>
  )
}
