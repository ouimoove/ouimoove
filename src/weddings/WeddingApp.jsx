import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../hooks/useToast.js'
import { Toast } from '../components/Toast.jsx'
import { LangProvider, LangToggle, useI18n } from './i18n.jsx'
import { WeddingProvider, useSession, useWedding } from './store/WeddingStore.jsx'
import { UICtx, useUI } from './components/uiContext.js'
import { AuthPanel } from './components/AuthPanel.jsx'
import { Btn, Names, Spinner, cx, styles as s } from './components/ui.jsx'
import { parseWeddingPath, navigate, usePathname } from './router.js'
import { coupleNames } from './lib/basics.js'
import { Landing } from './sections/Landing.jsx'
import { Wizard } from './sections/Wizard.jsx'
import { Dashboard } from './sections/Dashboard.jsx'
import { Tasks } from './sections/Tasks.jsx'
import { Tradition } from './sections/Tradition.jsx'
import { Guests } from './sections/Guests.jsx'
import { Seating } from './sections/Seating.jsx'
import { Budget } from './sections/Budget.jsx'
import { Vendors } from './sections/Vendors.jsx'
import { Website } from './sections/Website.jsx'
import { Hashtags } from './sections/Hashtags.jsx'
import { Honeymoon } from './sections/Honeymoon.jsx'
import { Memoir } from './sections/Memoir.jsx'
import { Settings } from './sections/Settings.jsx'
import { AcceptInvite } from './sections/AcceptInvite.jsx'
import { Icon } from '../components/Icon.jsx'

export const NAV = [
  { id: '', icon: '🏠', fr: 'Accueil', en: 'Home', C: Dashboard },
  { id: 'taches', icon: '✅', fr: 'Tâches', en: 'Checklist', C: Tasks },
  { id: 'tradition', icon: '🎁', fr: 'Tradition & dot', en: 'Tradition & dowry', C: Tradition },
  { id: 'invites', icon: '👥', fr: 'Invités', en: 'Guests', C: Guests },
  { id: 'tables', icon: '🪑', fr: 'Plan de table', en: 'Seating', C: Seating },
  { id: 'budget', icon: '💰', fr: 'Budget & réservations', en: 'Budget & bookings', short: 'Budget', shortEn: 'Budget', C: Budget },
  { id: 'prestataires', icon: '🤝', fr: 'Prestataires', en: 'Vendors', C: Vendors },
  { id: 'site', icon: '🌐', fr: 'Site du mariage', en: 'Wedding website', C: Website },
  { id: 'hashtag', icon: '#️⃣', fr: 'Hashtag & slogan', en: 'Hashtag & slogan', C: Hashtags },
  { id: 'lune-de-miel', icon: '✈️', fr: 'Lune de miel', en: 'Honeymoon', C: Honeymoon },
  { id: 'memoire', icon: '📖', fr: 'Mémoire', en: 'Memoir', C: Memoir },
  { id: 'reglages', icon: '⚙️', fr: 'Réglages', en: 'Settings', C: Settings },
]

// The five fixed phone tabs; everything else lives behind "Plus".
const TAB_IDS = ['', 'taches', 'invites', 'budget']

function useWeddingFonts() {
  useEffect(() => {
    if (document.getElementById('om-wedding-fonts')) return
    const link = document.createElement('link')
    link.id = 'om-wedding-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap'
    document.head.appendChild(link)
  }, [])
}

export default function WeddingApp() {
  return (
    <LangProvider>
      <Root />
    </LangProvider>
  )
}

function Root() {
  const { tx } = useI18n()
  const { toasts, toast } = useToast()
  const session = useSession()
  useWeddingFonts()
  if (!session.ready) return <div className={s.app}><Spinner /></div>
  return (
    <WeddingProvider user={session.user} toast={toast} tx={tx}>
      <Shell toast={toast} />
      <Toast toasts={toasts} />
    </WeddingProvider>
  )
}

function Shell({ toast }) {
  const { tx, L } = useI18n()
  const path = usePathname()
  const { base, section, params } = parseWeddingPath(path)
  const store = useWedding()
  const [auth, setAuth] = useState(null)

  const ui = useMemo(() => ({
    toast,
    base,
    openAuth: (mode = 'login', reason) => setAuth({ mode, reason }),
    go: (sec = '', ...rest) => navigate([base, sec, ...rest].filter(Boolean).join('/')),
  }), [toast, base])

  // Signing in from this screen with a plan started on the device moves
  // that plan into the account straight away (that is why they signed in).
  const prevUser = useRef(store.user?.id || null)
  useEffect(() => {
    const was = prevUser.current
    prevUser.current = store.user?.id || null
    if (store.user) setAuth(null)
    if (!was && store.user && store.localCount > 0) store.importLocal()
  }, [store.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const nav = NAV.find((n) => n.id === section)
  useEffect(() => {
    const names = store.wedding ? coupleNames(store.wedding) : ''
    document.title = [nav && nav.id ? L(nav) : null, names || null, 'Ouimoove Weddings'].filter(Boolean).join(' · ')
  }, [nav, store.wedding, L])

  let content
  if (section === 'invitation') content = <AcceptInvite token={params[0]} />
  else if (section === 'nouveau') content = <Wizard />
  else if (store.listState === 'loading' && !store.weddings.length) content = <Spinner label={tx('Chargement…', 'Loading…')} />
  else if (!store.wedding) content = section === 'prestataires' ? <div className={s.layoutWide}><Vendors /></div> : <Landing />
  else content = <Workspace section={nav ? section : ''} />

  return (
    <UICtx.Provider value={ui}>
      <div className={s.app}>
        <TopBar />
        {content}
      </div>
      {auth && (
        <AuthPanel
          mode={auth.mode}
          reason={auth.reason}
          onMode={(mode) => setAuth((a) => ({ ...a, mode }))}
          onClose={() => setAuth(null)}
        />
      )}
    </UICtx.Provider>
  )
}

function TopBar() {
  const { tx } = useI18n()
  const { user, weddings, wedding, select } = useWedding()
  const { openAuth, go } = useUI()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menu) return
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menu])

  return (
    <header className={s.topbar}>
      <button type="button" className={s.brand} onClick={() => go('')} aria-label="Ouimoove Weddings">
        <img src="/ouimoove-logo.png" alt="" />
        <span className={s.brandTag}>Weddings</span>
      </button>
      <div className={s.switcher}>
        {weddings.length > 1 && wedding && (
          <select
            value={wedding.id}
            aria-label={tx('Changer de mariage', 'Switch wedding')}
            onChange={(e) => (e.target.value === '__new' ? go('nouveau') : (select(e.target.value), go('')))}
          >
            {weddings.map((w) => <option key={w.id} value={w.id}>{coupleNames(w) || tx('Mariage', 'Wedding')}</option>)}
            <option value="__new">{tx('+ Nouveau mariage', '+ New wedding')}</option>
          </select>
        )}
      </div>
      <div className={s.topRight}>
        <LangToggle className={s.langToggle} />
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button type="button" className={s.avatar} style={{ border: 0, cursor: 'pointer' }} onClick={() => setMenu((m) => !m)} aria-label={tx('Mon compte', 'My account')}>
              {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
            </button>
            {menu && (
              <div className={s.card} style={{ position: 'absolute', right: 0, top: 44, width: 240, padding: 12, zIndex: 120 }}>
                <div className={s.strong + ' ' + s.ellipsis}>{user.name}</div>
                <div className={s.tiny + ' ' + s.muted + ' ' + s.ellipsis} style={{ marginBottom: 10 }}>{user.email}</div>
                <div className={s.stackSm}>
                  <Btn size="sm" variant="subtle" onClick={() => { setMenu(false); navigate('/') }}>{tx('← Événements Ouimoove', '← Ouimoove events')}</Btn>
                  <Btn size="sm" variant="ghost" onClick={async () => { setMenu(false); await supabase.auth.signOut() }}>{tx('Se déconnecter', 'Sign out')}</Btn>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Btn size="sm" variant="primary" onClick={() => openAuth('login')}>{tx('Se connecter', 'Sign in')}</Btn>
        )}
      </div>
    </header>
  )
}

function Workspace({ section }) {
  const { tx, L } = useI18n()
  const { wedding, isLocal, user, localCount, importLocal, role, rows } = useWedding()
  const { go, openAuth } = useUI()
  const [importing, setImporting] = useState(false)
  const [more, setMore] = useState(false)
  const current = NAV.find((n) => n.id === section) || NAV[0]
  const Section = current.C
  const todo = rows.tasks.filter((t) => !t.done).length
  const newRsvps = rows.rsvps.filter((r) => !r.guest_id).length

  return (
    <div className={s.layout}>
      <nav className={s.nav} aria-label={tx('Sections du mariage', 'Wedding sections')}>
        <div className={s.navCouple}>
          <Names wedding={wedding} size="1.45rem" />
          <div className={s.tiny + ' ' + s.muted} style={{ marginTop: 4 }}>
            {role === 'owner' ? (isLocal ? tx('Sur cet appareil', 'On this device') : tx('Votre mariage', 'Your wedding'))
              : role === 'viewer' ? tx('Lecture seule', 'Read only') : tx('Vous aidez ce couple', "You're helping this couple")}
          </div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.id || 'home'}
            type="button"
            className={cx(s.navItem, n.id === current.id && s.navItemActive)}
            aria-current={n.id === current.id ? 'page' : undefined}
            onClick={() => go(n.id)}
          >
            <span className={s.navIcon} aria-hidden="true"><Icon glyph={n.icon} /></span>
            {L(n)}
            {n.id === 'taches' && todo > 0 && <span className={s.navBadge}>{todo}</span>}
            {n.id === 'invites' && newRsvps > 0 && <span className={s.navBadge}>{newRsvps}</span>}
          </button>
        ))}
      </nav>
      <main className={s.main}>
        {isLocal && (
          <div className={cx(s.banner, s.bannerWarn)}>
            <span>{tx('Ce plan est enregistré sur cet appareil uniquement. Créez un compte gratuit pour le sauvegarder, le partager avec votre partenaire et publier votre site.', 'This plan is saved on this device only. Create a free account to save it, share it with your partner and publish your website.')}</span>
            <Btn size="sm" variant="primary" onClick={() => openAuth('signup', tx('Votre plan sera ajouté à votre compte.', 'Your plan will be added to your account.'))}>{tx('Créer un compte', 'Create an account')}</Btn>
          </div>
        )}
        {user && localCount > 0 && (
          <div className={cx(s.banner, s.bannerInfo)}>
            <span>{tx('Vous avez commencé un plan sur cet appareil avant de vous connecter.', 'You started a plan on this device before signing in.')}</span>
            <Btn size="sm" variant="primary" disabled={importing} onClick={async () => { setImporting(true); await importLocal(); setImporting(false) }}>
              {importing ? '…' : tx('Ajouter à mon compte', 'Add it to my account')}
            </Btn>
          </div>
        )}
        {role === 'viewer' && (
          <div className={cx(s.banner, s.bannerInfo)}>{tx('Vous consultez ce mariage en lecture seule.', 'You are viewing this wedding in read-only mode.')}</div>
        )}
        <Section />
      </main>

      {/* Phone: bottom tab bar (the sidebar above becomes unnecessary) */}
      <nav className={s.tabbar} aria-label={tx('Navigation', 'Navigation')}>
        {TAB_IDS.map((id) => {
          const n = NAV.find((x) => x.id === id)
          const badge = (id === 'taches' && todo) || (id === 'invites' && newRsvps) || 0
          return (
            <button key={id || 'home'} type="button" className={cx(s.tabItem, current.id === id && s.tabItemOn)} aria-current={current.id === id ? 'page' : undefined} onClick={() => { setMore(false); go(id) }}>
              <span className={s.tabIcon}><Icon glyph={n.icon} />{badge > 0 && <i className={s.tabDot}>{badge}</i>}</span>
              <span>{L({ fr: n.short || n.fr, en: n.shortEn || n.en })}</span>
            </button>
          )
        })}
        <button type="button" className={cx(s.tabItem, (more || !TAB_IDS.includes(current.id)) && s.tabItemOn)} aria-expanded={more} onClick={() => setMore((m) => !m)}>
          <span className={s.tabIcon}><Icon name="menu" /></span>
          <span>{tx('Plus', 'More')}</span>
        </button>
      </nav>
      {more && (
        <div className={s.sheetWrap} onClick={() => setMore(false)}>
          <div className={s.sheet} role="dialog" aria-label={tx('Plus', 'More')} onClick={(e) => e.stopPropagation()}>
            <div className={s.sheetGrip} aria-hidden="true" />
            {NAV.filter((n) => !TAB_IDS.includes(n.id)).map((n) => (
              <button key={n.id} type="button" className={cx(s.sheetItem, current.id === n.id && s.sheetItemOn)} onClick={() => { setMore(false); go(n.id) }}>
                <span className={s.sheetIcon}><Icon glyph={n.icon} /></span>{L(n)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
