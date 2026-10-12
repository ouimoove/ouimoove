import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import styles from './CartModal.module.css'
import { Icon } from '../Icon.jsx'

export function CartModal({ open, cart, cartTotal, onClose, onRemove, onCheckout }) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Panier" />
      <ModalBody>
        {cart.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Icon name="cart" /></div>
            <p>Votre panier est vide</p>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {cart.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.info}>
                    <div className={styles.name}>{item.eventTitle}</div>
                    <div className={styles.detail}>{item.ticketName} × {item.qty}</div>
                  </div>
                  <div className={styles.right}>
                    <span className={styles.price}>{(item.price * item.qty).toLocaleString('fr-FR')} FCFA</span>
                    <button className={styles.removeBtn} onClick={() => onRemove(item.id)} aria-label="Retirer du panier"><Icon name="x" size="0.95rem" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.total}>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <button className={styles.checkoutBtn} onClick={onCheckout}>
              Passer à la caisse →
            </button>
          </>
        )}
      </ModalBody>
    </Modal>
  )
}
