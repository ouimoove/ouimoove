import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import styles from './MyTicketsModal.module.css'
import { Icon } from '../Icon.jsx'

function TicketCard({ purchase, myListings, toast, onListForResale, onCancelListing }) {
  const [qrDataUrl,  setQrDataUrl]  = useState('')
  const [showResale, setShowResale] = useState(false)
  const [askPrice,   setAskPrice]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Generate QR as data URL — no canvas ref issues
  useEffect(() => {
    const payload = `OUIMOOVE|${purchase.id}|${purchase.items[0]?.eventTitle || ''}|${purchase.total}FCFA`
    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: '#1a0a2e', light: '#ffffff' },
    }).then(setQrDataUrl).catch(console.error)
  }, [purchase.id])

  const submitResale = async (item) => {
    const price = parseInt(askPrice)
    if (!price || price <= 0) { toast('Entrez un prix valide.', 'error'); return }
    setSubmitting(true)
    const result = await onListForResale({
      orderItemId:   item.id,
      orderId:       purchase.id,
      eventId:       item.eventId,
      ticketTypeId:  item.ticketTypeId,
      eventTitle:    item.eventTitle,
      eventDate:     null,
      eventCity:     '',
      eventEmoji:    '🎟️',
      eventImageUrl: null,
      ticketName:    item.ticketName,
      quantity:      item.qty,
      originalPrice: item.price,
      askPrice:      price,
    })
    setSubmitting(false)
    if (!result || result.error) {
      toast(result?.error || 'Impossible de mettre en vente.', 'error')
    } else {
      toast('Billet mis en vente !', 'success')
      setShowResale(false)
      setAskPrice('')
    }
  }

  const isRefunded = purchase.status === 'refunded'
  const ref        = purchase.id.slice(0, 8).toUpperCase()
  const dateStr    = new Date(purchase.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className={[styles.ticket, isRefunded ? styles.ticketRefunded : ''].join(' ')}>

      {/* ── Top branded header ── */}
      <div className={styles.ticketHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.brandOui}>Oui</span><span className={styles.brandMoove}>Moove</span>
          <span className={styles.headerTag}>Billet électronique</span>
        </div>
        <div className={[styles.statusBadge, isRefunded ? styles.badgeRefunded : styles.badgeOk].join(' ')}>
          {isRefunded ? <><Icon name="undo" /> Remboursé</> : <><Icon name="check" /> Confirmé</>}
        </div>
      </div>

      {/* ── Event name ── */}
      <div className={styles.eventName}>
        {purchase.items[0]?.eventTitle || 'Événement'}
      </div>

      {/* ── Ticket types ── */}
      <div className={styles.tagRow}>
        {purchase.items.map((item, i) => (
          <span key={i} className={styles.tag}>
            {item.ticketName} ×{item.qty}
          </span>
        ))}
      </div>

      {/* ── Tear line ── */}
      <div className={styles.tearLine}>
        <div className={styles.notchLeft} />
        <div className={styles.dashes} />
        <span className={styles.scissors}><Icon name="scissors" /></span>
        <div className={styles.dashes} />
        <div className={styles.notchRight} />
      </div>

      {/* ── QR section ── */}
      <div className={styles.qrSection}>
        <div className={styles.qrWrap}>
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code du billet" width={160} height={160} className={styles.qrImg} />}
        </div>
        <div className={styles.qrMeta}>
          <div className={styles.qrLabel}>Scanner à l'entrée</div>
          <div className={styles.qrRef}>Réf · {ref}</div>
          <div className={styles.qrDate}>Acheté le {dateStr}</div>
          <div className={styles.qrTotal}>{purchase.total.toLocaleString('fr-FR')} FCFA</div>
        </div>
      </div>

      {/* ── Items detail ── */}
      <div className={styles.itemsList}>
        {purchase.items.map((item, i) => {
          const listing = myListings?.find(l => l.order_item_id === item.id && l.status === 'active')
          return (
            <div key={i}>
              <div className={styles.itemRow}>
                <span className={item.resold ? styles.struck : undefined}>
                  {item.ticketName}
                  {item.resold && <span className={styles.soldTag}>Revendu</span>}
                </span>
                <span>×{item.qty} · {(item.price * item.qty).toLocaleString('fr-FR')} FCFA</span>
              </div>

              {!isRefunded && !item.resold && !item.checkedIn && !item.isResale && onListForResale && (
                <div className={styles.resaleWrap}>
                  {listing ? (
                    <div className={styles.listingBox}>
                      <span className={styles.listingText}>
                        <Icon name="tag" /> En vente à {listing.ask_price_cfa.toLocaleString('fr-FR')} FCFA
                      </span>
                      <button onClick={() => onCancelListing(listing.id)} className={styles.btnDangerSm}>
                        Retirer
                      </button>
                    </div>
                  ) : showResale === item.id ? (
                    <div className={styles.resaleForm}>
                      <input
                        autoFocus type="number" min="1"
                        placeholder={`Prix (min ${item.price.toLocaleString('fr-FR')} FCFA)`}
                        value={askPrice} onChange={e => setAskPrice(e.target.value)}
                        className={styles.resaleInput}
                      />
                      <button onClick={() => submitResale(item)} disabled={submitting} className={styles.btnSell}>
                        {submitting ? '…' : 'Vendre'}
                      </button>
                      <button onClick={() => { setShowResale(false); setAskPrice('') }} className={styles.btnGhostSm} aria-label="Annuler">
                        <Icon name="x" size="0.9rem" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setShowResale(item.id); setAskPrice(String(item.price)) }} className={styles.btnResale}>
                      <Icon name="tag" /> Revendre
                    </button>
                  )}
                </div>
              )}

              {item.checkedIn && (
                <div className={styles.validated}><Icon name="check" /> Validé à l'entrée</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MyTicketsModal({ open, purchases, myListings, onClose, toast, onListForResale, onCancelListing }) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Mes Billets" />
      <ModalBody>
        {purchases.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Icon name="ticket" /></div>
            <p>Aucun billet pour le moment</p>
            <p className={styles.emptySub}>Parcourez les événements et réservez !</p>
          </div>
        ) : (
          purchases.map(p => (
            <TicketCard
              key={p.id}
              purchase={p}
              myListings={myListings}
              toast={toast}
              onListForResale={onListForResale}
              onCancelListing={onCancelListing}
            />
          ))
        )}
      </ModalBody>
    </Modal>
  )
}
