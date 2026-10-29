import { useMemo } from 'react'
import { CATEGORIES, CITIES } from '../data/events.js'
import { Icon, categoryIcon } from './Icon.jsx'
import { clickable, formatDate, minPrice, fmtPrice } from '../utils/helpers.js'
import styles from './Hero.module.css'

const PRICE_STEP = 500

export function Hero({
  events = [],
  search, setSearch,
  filterCity, setFilterCity,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  maxPrice, setMaxPrice,
  onOpenEvent,
  onCreateEvent,
  onWeddings,
}) {
  // Everything shown about "what's on" comes from the real upcoming events.
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  }, [events])
  const next = upcoming[0]
  const cityCount = useMemo(() => new Set(upcoming.map((e) => e.city).filter(Boolean)).size, [upcoming])

  // Price slider: from free up to the dearest "from" price on sale, in 500 FCFA steps.
  const ceiling = useMemo(() => {
    const top = Math.max(0, ...upcoming.map(minPrice))
    return top > 0 ? Math.ceil(top / PRICE_STEP) * PRICE_STEP : 0
  }, [upcoming])
  const sliderValue = maxPrice == null ? ceiling : Math.min(maxPrice, ceiling)

  const scrollToEvents = () => document.getElementById('evenements')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const archInner = next?.imageUrl ? (
    <img src={next.imageUrl} alt="" className={styles.archImg} />
  ) : (
    <span className={styles.archArt} aria-hidden="true">
      <Icon name={next ? categoryIcon(next.category) : 'ticket'} size="1em" strokeWidth={1.4} />
    </span>
  )

  return (
    <section className={styles.hero}>
      <div className={styles.top}>
        {/* ── Left: message + calls to action ── */}
        <div className={styles.copy}>
          <span className={[styles.badge, styles.rise].join(' ')} style={{ '--i': 0 }}>
            BILLETTERIE
          </span>

          {/* Entrance: headline words rise in one after another (--i = order). */}
          <h1 className={styles.heading}>
            <span className={styles.word} style={{ '--i': 1 }}>Découvrez</span>{' '}
            <span className={styles.word} style={{ '--i': 2 }}>les</span>{' '}
            <em className={styles.word} style={{ '--i': 3 }}>meilleurs</em><br />
            <span className={styles.word} style={{ '--i': 4 }}>événements</span>
          </h1>

          <p className={[styles.sub, styles.rise].join(' ')} style={{ '--i': 6 }}>
            Concerts, festivals, conférences et plus encore — réservez vos billets en quelques secondes,
            payez par Tmoney, Flooz ou carte, et entrez avec votre QR code.
          </p>

          <div className={[styles.actions, styles.rise].join(' ')} style={{ '--i': 7 }}>
            <button type="button" className={[styles.btnPrimary, styles.pulse].join(' ')} onClick={scrollToEvents}>
              Voir les événements <Icon name="arrow" />
            </button>
            <button type="button" className={styles.btnGhost} onClick={onCreateEvent}>
              <Icon name="mic" /> Publier un événement
            </button>
          </div>

          <div className={[styles.stats, styles.rise].join(' ')} style={{ '--i': 8 }}>
            {upcoming.length > 0 ? (
              <>
                <span><b>{upcoming.length}</b> événement{upcoming.length > 1 ? 's' : ''} à venir</span>
                <span><b>{cityCount}</b> ville{cityCount > 1 ? 's' : ''}</span>
              </>
            ) : null}
            <span>Tmoney · Flooz · Carte</span>
          </div>
        </div>

        {/* ── Right: arch visual with floating chips ── */}
        <div className={[styles.visual, styles.rise].join(' ')} style={{ '--i': 5 }}>
          {next ? (
            <button type="button" className={styles.arch} onClick={() => onOpenEvent?.(next.id)} aria-label={`Voir ${next.title}`}>
              {archInner}
              <span className={styles.archCaption}>
                <small>À venir</small>
                <strong>{next.title}</strong>
              </span>
            </button>
          ) : (
            <div className={styles.arch}>{archInner}</div>
          )}

          {next ? (
            <>
              <span className={[styles.chip, styles.chipA].join(' ')}><Icon name="calendar" /> {formatDate(next.date)}</span>
              <span className={[styles.chip, styles.chipB].join(' ')}><Icon name="pin" /> {next.city}</span>
              <span className={[styles.chip, styles.chipC, styles.dark].join(' ')}>
                <Icon name="ticket" /> {minPrice(next) > 0 ? `Dès ${fmtPrice(minPrice(next))}` : 'Gratuit'}
              </span>
            </>
          ) : (
            <>
              <span className={[styles.chip, styles.chipA].join(' ')}><Icon name="ticket" /> Billets par QR code</span>
              <span className={[styles.chip, styles.chipB].join(' ')}><Icon name="phone" /> Tmoney · Flooz</span>
              <span className={[styles.chip, styles.chipC, styles.dark].join(' ')}><Icon name="shield" /> Paiement sécurisé</span>
            </>
          )}
        </div>
      </div>

      {/* ── Finder: search, categories, price slider, sort ── */}
      <div className={[styles.finder, styles.rise].join(' ')} style={{ '--i': 9 }}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}><Icon name="search" /></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Rechercher un événement..."
            aria-label="Rechercher un événement"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.searchSelect}
            aria-label="Ville"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.pills}>
          <button
            className={[styles.pill, filterCategory === '' ? styles.active : ''].join(' ')}
            onClick={() => setFilterCategory('')}
          ><Icon name="sparkles" /> Tous</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={[styles.pill, filterCategory === cat ? styles.active : ''].join(' ')}
              onClick={() => setFilterCategory(cat)}
            >
              <Icon name={categoryIcon(cat)} /> {cat}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          {ceiling > 0 && (
            <label className={styles.price}>
              <span className={styles.priceHead}>
                <span>Budget</span>
                <b>{maxPrice == null || sliderValue >= ceiling ? 'Tous les prix' : `Jusqu'à ${fmtPrice(sliderValue)}`}</b>
              </span>
              <input
                type="range"
                className={styles.range}
                min={0}
                max={ceiling}
                step={PRICE_STEP}
                value={sliderValue}
                aria-label="Budget maximum par billet"
                style={{ '--pct': `${ceiling ? (sliderValue / ceiling) * 100 : 100}%` }}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setMaxPrice(v >= ceiling ? null : v)
                }}
              />
            </label>
          )}

          <div className={styles.sort}>
            <span>Trier par</span>
            <select
              className={styles.sortSelect}
              aria-label="Trier par"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Two quiet entry points: organizers and weddings ── */}
      <div className={[styles.tiles, styles.rise].join(' ')} style={{ '--i': 10 }}>
        <div className={styles.tile} {...clickable(onCreateEvent)}>
          <span className={styles.tileIcon}><Icon name="mic" /></span>
          <span className={styles.tileText}>
            <strong>Vous organisez un événement ?</strong>
            <small>Publiez-le gratuitement, vous ne payez que sur les billets vendus.</small>
          </span>
          <span className={styles.tileGo}><Icon name="arrow" /></span>
        </div>
        {onWeddings && (
          <div className={styles.tile} {...clickable(onWeddings)}>
            <span className={styles.tileIcon}><Icon name="ring" /></span>
            <span className={styles.tileText}>
              <strong>Vous préparez votre mariage ?</strong>
              <small>Ouimoove Weddings : invités, budget, plan de table et site.</small>
            </span>
            <span className={styles.tileGo}><Icon name="arrow" /></span>
          </div>
        )}
      </div>
    </section>
  )
}
