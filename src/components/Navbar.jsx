import { useState } from 'react'
import { clickable } from '../utils/helpers.js'
import styles from './Navbar.module.css'
import { Icon } from './Icon.jsx'

export function Navbar({
  user, cartCount, isOrganizer,
  onLogin, onSignup, onCart, onTickets,
  onFavorites, onProfile, onOrganizer, onLogout, onLogoClick, onMarket, onCreateEvent, onFeed, onWeddings,
}) {
  const [logoErr, setLogoErr] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const close = (fn) => () => { setMenuOpen(false); fn?.() }

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.logo} {...(onLogoClick ? clickable(onLogoClick) : {})} aria-label={onLogoClick ? 'OuiMoove — retour en haut' : undefined} style={{ cursor: onLogoClick ? 'pointer' : 'default' }}>
          {!logoErr ? (
            <img
              src="/ouimoove-logo.png"
              alt="OuiMoove"
              onError={() => setLogoErr(true)}
            />
          ) : (
            <span className={styles.logoText}>Oui<span>Moove</span></span>
          )}
        </div>

        {/* Desktop nav */}
        <div className={styles.right}>
          {!user ? (
            <>
              <button className={styles.btnPrimary} onClick={onCreateEvent}>✚ Créer un événement</button>
              <button className={styles.btnGhost} onClick={onWeddings}><Icon name="ring" /> Mariages</button>
              <button className={styles.btnGhost} onClick={onLogin}>Connexion</button>
              <button className={styles.btnGhost} onClick={onSignup}>Inscription</button>
            </>
          ) : (
            <>
              <button className={styles.btnPrimary} onClick={onCreateEvent}>✚ <span className={styles.label}>Créer</span></button>
              <button className={styles.btnGhost} onClick={onFavorites}><Icon name="heart" /> <span className={styles.label}>Favoris</span></button>
              <button className={styles.btnGhost} onClick={onCart} style={{ position: 'relative' }}>
                <Icon name="cart" /> <span className={styles.label}>Panier</span>
                {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
              </button>
              <button className={styles.btnGhost} onClick={onTickets}><Icon name="ticket" /> <span className={styles.label}>Mes Billets</span></button>
              <button className={styles.btnGhost} onClick={onFeed}><Icon name="camera" /> <span className={styles.label}>Feed</span></button>
              <button className={styles.btnGhost} onClick={onMarket}><Icon name="store" /> <span className={styles.label}>Marché</span></button>
              <button className={styles.btnGhost} onClick={onWeddings}><Icon name="ring" /> <span className={styles.label}>Mariages</span></button>
              {isOrganizer && (
                <button className={styles.btnPurple} onClick={onOrganizer}><Icon name="chart" /> <span className={styles.label}>Dashboard</span></button>
              )}
              <button className={styles.btnGhost} onClick={onProfile}><Icon name="user" /> <span className={styles.label}>{user.name.split(' ')[0]}</span></button>
              <button className={styles.btnGhost} onClick={onLogout}>Sortir</button>
            </>
          )}
        </div>

        {/* Mobile: cart badge + hamburger */}
        <div className={styles.mobileRight}>
          {user && (
            <button className={styles.btnGhost} onClick={onCart} style={{ position: 'relative' }}>
              <Icon name="cart" />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </button>
          )}
          <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span className={menuOpen ? styles.barOpen1 : styles.bar} />
            <span className={menuOpen ? styles.barOpen2 : styles.bar} />
            <span className={menuOpen ? styles.barOpen3 : styles.bar} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.drawer}>
          {!user ? (
            <>
              <button className={styles.drawerBtn} onClick={close(onCreateEvent)}>✚ Créer un événement</button>
              <button className={styles.drawerBtn} onClick={close(onWeddings)}><Icon name="ring" /> Ouimoove Weddings</button>
              <button className={styles.drawerBtn} onClick={close(onLogin)}><Icon name="key" /> Connexion</button>
              <button className={styles.drawerBtn} onClick={close(onSignup)}><Icon name="pencil" /> Inscription</button>
            </>
          ) : (
            <>
              <button className={styles.drawerBtnPrimary} onClick={close(onCreateEvent)}>✚ Créer un événement</button>
              <button className={styles.drawerBtn} onClick={close(onFavorites)}><Icon name="heart" /> Favoris</button>
              <button className={styles.drawerBtn} onClick={close(onTickets)}><Icon name="ticket" /> Mes Billets</button>
              <button className={styles.drawerBtn} onClick={close(onFeed)}><Icon name="camera" /> Feed</button>
              <button className={styles.drawerBtn} onClick={close(onMarket)}><Icon name="store" /> Marché de revente</button>
              <button className={styles.drawerBtn} onClick={close(onWeddings)}><Icon name="ring" /> Ouimoove Weddings</button>
              {isOrganizer && (
                <button className={styles.drawerBtnPurple} onClick={close(onOrganizer)}><Icon name="chart" /> Dashboard organisateur</button>
              )}
              <button className={styles.drawerBtn} onClick={close(onProfile)}><Icon name="user" /> Mon Profil</button>
              <button className={styles.drawerBtnDanger} onClick={close(onLogout)}><Icon name="door" /> Se déconnecter</button>
            </>
          )}
        </div>
      )}
    </>
  )
}