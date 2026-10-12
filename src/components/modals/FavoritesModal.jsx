import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import { formatDate } from '../../utils/helpers.js'
import styles from './FavoritesModal.module.css'
import { Icon, categoryIcon } from '../Icon.jsx'

export function FavoritesModal({ open, events, favorites, onClose, onOpenEvent, onToggleFav }) {
  const favEvents = events.filter((e) => favorites.includes(e.id))

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="Favoris"
        subtitle={favEvents.length ? `${favEvents.length} événement${favEvents.length > 1 ? 's' : ''} sauvegardé${favEvents.length > 1 ? 's' : ''}` : undefined}
      />
      <ModalBody>
        {favEvents.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Icon name="heart" /></div>
            <p>Aucun favori pour le moment</p>
            <p className={styles.emptySub}>Cliquez sur <Icon name="heart" /> sur un événement pour le sauvegarder</p>
          </div>
        ) : (
          <div className={styles.list}>
            {favEvents.map((e, i) => (
              <div key={e.id} className={styles.row} style={{ '--i': i }}>
                <div className={styles.emoji}><Icon name={categoryIcon(e.category)} /></div>
                <div className={styles.info}>
                  <div className={styles.title}>{e.title}</div>
                  <div className={styles.meta}>
                    <span><Icon name="calendar" /> {formatDate(e.date)}</span>
                    <span><Icon name="pin" /> {e.city}</span>
                    <span className={styles.cat}>{e.category}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={styles.viewBtn} onClick={() => { onClose(); onOpenEvent(e.id) }}>Voir <Icon name="arrow" /></button>
                  <button className={styles.removeBtn} onClick={() => onToggleFav(e.id)} aria-label="Retirer des favoris"><Icon name="x" size="0.95rem" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}
