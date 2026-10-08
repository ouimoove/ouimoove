import { CATEGORIES, CITIES, CATEGORY_EMOJI } from '../data/events.js'
import { clickable } from '../utils/helpers.js'
import styles from './Hero.module.css'

export function Hero({
  search, setSearch,
  filterCity, setFilterCity,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  onCreateEvent,
}) {
  return (
    <section className={styles.hero}>
      {/* Entrance: headline words, then subtitle, search, categories and the
          organizer CTA rise in one after another (--i = order in the sequence). */}
      <h1 className={styles.heading}>
        <span className={styles.word} style={{ '--i': 0 }}>Découvrez</span>{' '}
        <span className={styles.word} style={{ '--i': 1 }}>les</span>{' '}
        <em className={styles.word} style={{ '--i': 2 }}>meilleurs</em><br />
        <span className={styles.word} style={{ '--i': 3 }}>événements</span>
      </h1>
      <p className={[styles.sub, styles.rise].join(" ")} style={{ '--i': 5 }}>
        Concerts, festivals, conférences et plus encore —<br />
        réservez vos billets en quelques secondes.
      </p>

      <div className={[styles.searchBar, styles.rise].join(" ")} style={{ '--i': 6 }}>
        <span>🔍</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Rechercher un événement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.searchSelect}
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        >
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className={[styles.pills, styles.rise].join(" ")} style={{ '--i': 7 }}>
        <button
          className={[styles.pill, filterCategory === '' ? styles.active : ''].join(' ')}
          onClick={() => setFilterCategory('')}
        >✨ Tous</button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={[styles.pill, filterCategory === cat ? styles.active : ''].join(' ')}
            onClick={() => setFilterCategory(cat)}
          >
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      <div className={[styles.createCta, styles.rise, styles.ctaGlow].join(" ")} style={{ '--i': 8 }} {...clickable(onCreateEvent)}>
        <span>🎤 Vous organisez un événement ?</span>
        <span className={styles.ctaLink}>Publiez-le gratuitement →</span>
      </div>

      <div className={[styles.sortBar, styles.rise].join(" ")} style={{ '--i': 9 }}>
        <span>Trier par :</span>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Date</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="name">Nom A–Z</option>
        </select>
      </div>
    </section>
  )
}
