import { useState } from 'react'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import { dateParts } from '../../utils/helpers.js'
import { Icon } from '../Icon.jsx'
import styles from './ResaleMarketModal.module.css'

const PLATFORM_FEE_PCT = 10

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fcfa = (n) => `${n.toLocaleString('fr-FR')} FCFA`

function ListingCard({ listing, currentUserId, onBuy, index }) {
  const fee   = Math.round(listing.ask_price_cfa * PLATFORM_FEE_PCT / 100)
  const total = listing.ask_price_cfa + fee
  const isOwn = listing.seller_id === currentUserId
  const isPast = listing.event_date && new Date(listing.event_date) < new Date()
  const { day, mon } = dateParts(String(listing.event_date || '').slice(0, 10))

  return (
    <div className={[styles.card, isPast ? styles.past : ''].join(' ')} style={{ '--i': index }}>
      {/* Event banner */}
      <div
        className={styles.banner}
        style={listing.event_image_url ? { backgroundImage: `url(${listing.event_image_url})` } : undefined}
      >
        {!listing.event_image_url && <span className={styles.bannerIcon}><Icon name="ticket" strokeWidth={1.5} /></span>}
        {day && (
          <span className={styles.dateTile} aria-hidden="true"><b>{day}</b><small>{mon}</small></span>
        )}
        {isOwn && <span className={styles.ownTag}>Ma vente</span>}
      </div>

      <div className={styles.cardBody}>
        <div>
          <div className={styles.eventTitle}>{listing.event_title}</div>
          <div className={styles.ticketName}>{listing.ticket_name} <span>×{listing.quantity}</span></div>
          <div className={styles.meta}>
            {listing.event_city && <><Icon name="pin" /> {listing.event_city} · </>}Vendeur particulier
          </div>
        </div>

        {/* Price breakdown */}
        <div className={styles.prices}>
          <div className={styles.priceRow}><span>Prix vendeur</span><span>{fcfa(listing.ask_price_cfa)}</span></div>
          <div className={styles.priceRow}><span>Frais de service ({PLATFORM_FEE_PCT}%)</span><span>+{fcfa(fee)}</span></div>
          <div className={styles.totalRow}><span>Total</span><span>{fcfa(total)}</span></div>
        </div>

        <button
          className={styles.buyBtn}
          onClick={() => onBuy(listing)}
          disabled={isOwn || isPast}
        >
          {isPast ? 'Événement passé' : isOwn ? 'Votre annonce' : <>Acheter <Icon name="arrow" /></>}
        </button>
      </div>
    </div>
  )
}

// ── Buy confirmation panel ─────────────────────────────────────
function BuyPanel({ listing, onConfirm, onCancel, busy }) {
  const [method, setMethod] = useState('simulation')
  const [phone,  setPhone]  = useState('')
  const fee   = Math.round(listing.ask_price_cfa * PLATFORM_FEE_PCT / 100)
  const total = listing.ask_price_cfa + fee

  return (
    <div>
      <div className={styles.summary}>
        <div className={styles.summaryTitle}>{listing.event_title}</div>
        <div className={styles.summarySub}>{listing.ticket_name} · {formatDate(listing.event_date)}</div>
        <div className={styles.priceRow}><span>Prix vendeur</span><span>{fcfa(listing.ask_price_cfa)}</span></div>
        <div className={styles.priceRow}><span>Frais de service</span><span>+{fcfa(fee)}</span></div>
        <div className={styles.totalRow}><span>À payer</span><span>{fcfa(total)}</span></div>
      </div>

      <p className={styles.sectionLabel}>Méthode de paiement</p>
      <div className={styles.methods}>
        {[
          { id: 'simulation', label: 'Carte bancaire', icon: 'card' },
          { id: 'tmoney',     label: 'T-Money',        icon: 'phone' },
          { id: 'flooz',      label: 'Flooz',          icon: 'phone' },
        ].map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={[styles.method, method === m.id ? styles.methodOn : ''].join(' ')}
          >
            <Icon name={m.icon} /> {m.label}
          </button>
        ))}
      </div>

      {method !== 'simulation' && (
        <div className={styles.field}>
          <label className={styles.label}>Numéro de téléphone</label>
          <input
            className={styles.input}
            placeholder="+228 90 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button className={styles.confirmBtn} onClick={() => onConfirm(listing, method, phone)} disabled={busy}>
          {busy ? 'Traitement…' : `Confirmer — ${fcfa(total)}`}
        </button>
      </div>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────
export function ResaleMarketModal({ open, listings, currentUserId, loading, onClose, onBuy }) {
  const [buyingListing, setBuyingListing] = useState(null)
  const [busy,          setBusy]          = useState(false)
  const [search,        setSearch]        = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = listings.filter(l => !l.event_date || l.event_date.slice(0, 10) >= today)

  const filtered = search.trim()
    ? upcoming.filter(l =>
        l.event_title.toLowerCase().includes(search.toLowerCase()) ||
        l.ticket_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.event_city || '').toLowerCase().includes(search.toLowerCase())
      )
    : upcoming

  const handleBuy = async (listing, method, phone) => {
    setBusy(true)
    const result = await onBuy(listing, method, phone)
    setBusy(false)
    if (result?.ok || result?.redirect) {
      setBuyingListing(null)
    }
  }

  return (
    <Modal open={open} onClose={() => { setBuyingListing(null); onClose() }} size="lg">
      <ModalHeader
        title="Marché secondaire"
        subtitle="Billets revendus par d'autres utilisateurs"
      />
      <ModalBody>
        {buyingListing ? (
          <BuyPanel
            listing={buyingListing}
            onConfirm={handleBuy}
            onCancel={() => setBuyingListing(null)}
            busy={busy}
          />
        ) : (
          <>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}><Icon name="search" /></span>
              <input
                className={styles.search}
                placeholder="Rechercher un événement, un type de billet…"
                aria-label="Rechercher une annonce"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className={styles.state}>
                <div className={styles.spinner} aria-hidden="true" />
                Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.state}>
                <div className={styles.stateIcon}><Icon name="store" /></div>
                <p className={styles.stateTitle}>
                  {search ? 'Aucune annonce ne correspond.' : 'Aucune annonce active pour le moment.'}
                </p>
                <p>Les billets mis en vente par d'autres utilisateurs apparaîtront ici.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    index={i}
                    listing={l}
                    currentUserId={currentUserId}
                    onBuy={setBuyingListing}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  )
}
