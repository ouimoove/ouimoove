import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { SITE_THEMES, STEPS, RELIGIOUS_VARIANTS } from './data/templates.js'
import { stepTitle, mainDate } from './lib/plan.js'
import { daysUntil, formatDate, formatLongDate, firstWord, mapsLink, todayISO } from './lib/basics.js'
import { navigate } from './router.js'
import st from './site.module.css'
import { Icon } from '../components/Icon.jsx'

const T = (lang) => (fr, en) => (lang === 'en' ? en : fr)

function useFonts() {
  useEffect(() => {
    if (document.getElementById('om-wedding-fonts')) return
    const link = document.createElement('link')
    link.id = 'om-wedding-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// The couple's public page at ouimoove.app/w/<slug>: no account needed to
// read it or to answer.
export default function WeddingSite({ slug }) {
  useFonts()
  const [state, setState] = useState({ loading: true, data: null })
  const [lang, setLang] = useState(null)
  useEffect(() => {
    let alive = true
    supabase.rpc('get_wedding_site', { p_slug: slug })
      .then(({ data, error }) => { if (alive) setState({ loading: false, data: error ? null : data, error }) })
      .catch((error) => { if (alive) setState({ loading: false, data: null, error }) })
    return () => { alive = false }
  }, [slug])

  const data = state.data
  const l = lang || data?.lang || ((navigator.language || '').startsWith('en') ? 'en' : 'fr')
  const tx = T(l)
  const theme = SITE_THEMES[data?.site?.theme] || SITE_THEMES.plum
  const vars = { '--s-bg': theme.bg, '--s-ink': theme.ink, '--s-accent': theme.accent, '--s-soft': theme.soft, '--s-gold': theme.gold }

  useEffect(() => {
    if (!data) return
    document.title = `${firstWord(data.groom_name)} & ${firstWord(data.bride_name)} · ${tx('Notre mariage', 'Our wedding')}`
    document.documentElement.lang = l
  }, [data, l]) // eslint-disable-line react-hooks/exhaustive-deps

  if (state.loading) return <div className={st.page} style={vars}><div className={st.center}><span className={st.muted}>…</span></div></div>
  if (!data) {
    return (
      <div className={st.page} style={vars}>
        <div className={st.center}>
          <div>
            <h1 className={st.sectionTitle}>{tx('Site introuvable', 'Website not found')}</h1>
            <p className={st.muted} style={{ maxWidth: 420, margin: '0 auto 20px' }}>
              {state.error
                ? tx('Impossible de charger la page. Vérifiez votre connexion et réessayez.', "Couldn't load the page. Check your connection and try again.")
                : tx("Ce site de mariage n'existe pas ou n'est pas encore publié.", "This wedding website doesn't exist or isn't published yet.")}
            </p>
            <button type="button" className={st.cta} onClick={() => navigate('/mariage')}>Ouimoove Weddings</button>
          </div>
        </div>
      </div>
    )
  }

  const site = data.site || {}
  const events = (data.events || []).map((e) => ({ ...e, event_date: e.date, included: true }))
  const main = mainDate(events)
  const mainEvent = events.find((e) => e.event_date === main)
  const days = main ? daysUntil(main) : null
  const photo = /^https:\/\//.test(site.cover_url || '') ? site.cover_url : null

  return (
    <div className={st.page} style={vars}>
      <div className={`${st.bar} ${photo ? st.onPhoto : ''}`}>
        <a className={st.mark} href="/mariage" onClick={(e) => { e.preventDefault(); navigate('/mariage') }}>Ouimoove Weddings</a>
        <div className={st.lang} role="group" aria-label="Langue / Language">
          {['fr', 'en'].map((x) => <button key={x} type="button" aria-pressed={l === x} onClick={() => setLang(x)}><span>{x.toUpperCase()}</span></button>)}
        </div>
      </div>

      <header className={`${st.hero} ${photo ? st.heroPhoto : st.heroPlain}`} style={photo ? { backgroundImage: `url("${photo.replace(/"/g, '%22')}")` } : undefined}>
        <div className={st.heroInner}>
          <div className={st.kicker}>{tx('Nous nous marions', "We're getting married")}</div>
          <h1 className={st.names}>{firstWord(data.groom_name)}<span className={st.amp}>&amp;</span>{firstWord(data.bride_name)}</h1>
          {main && <div className={st.when}>{formatLongDate(main, l)}</div>}
          {(mainEvent?.city || mainEvent?.venue) && <div className={st.where}>{[mainEvent.venue, mainEvent.city].filter(Boolean).join(' · ')}</div>}
          {days != null && days > 0 && <div className={st.count}><b>{days}</b> {tx(days > 1 ? 'jours' : 'jour', days > 1 ? 'days to go' : 'day to go')}</div>}
          {site.show_hashtag !== false && data.hashtag && <div className={st.tag}>{data.hashtag}</div>}
          {site.show_hashtag !== false && data.slogan && <div className={st.slogan}>{data.slogan}</div>}
          {site.rsvp_open !== false && <div><a href="#rsvp" className={st.cta}>{tx('Répondre à l’invitation', 'RSVP')}</a></div>}
        </div>
      </header>

      {site.welcome && <section className={st.section}><p className={st.welcome}>{site.welcome}</p></section>}

      {events.length > 0 && (
        <section className={st.section}>
          <h2 className={st.sectionTitle}>{tx('Le programme', 'The schedule')}</h2>
          <div className={st.rule} />
          <div className={st.timeline}>
            {events.map((e, i) => (
              <article key={i} className={st.event}>
                <div className={st.eventIcon} aria-hidden="true"><Icon glyph={e.kind === 'religious' ? RELIGIOUS_VARIANTS[e.variant]?.icon || '⛪' : (STEPS[e.kind] || STEPS.custom).icon} /></div>
                <div>
                  <div className={st.eventTitle}>{stepTitle(e, l, null)}</div>
                  <div className={st.eventWhen}>
                    {e.date ? formatLongDate(e.date, l) : tx('Date à venir', 'Date to come')}
                    {e.time ? ` · ${e.time.replace(':', 'h')}` : ''}
                    {e.kind === 'honeymoon' && e.end_date ? ` → ${formatDate(e.end_date, l)}` : ''}
                  </div>
                  {(e.venue || e.city) && <div className={st.eventWhere}>{[e.venue, e.city].filter(Boolean).join(', ')}</div>}
                  <div className={st.eventLinks}>
                    {(e.map_url || e.venue) && e.kind !== 'honeymoon' && (
                      <a className={st.pill} href={e.map_url || mapsLink([e.venue, e.city].filter(Boolean).join(', '))} target="_blank" rel="noopener noreferrer"><Icon name="pin" /> {tx('Itinéraire', 'Directions')}</a>
                    )}
                    {e.dress_code && <span className={st.pill}><Icon name="shirt" /> {e.dress_code}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {site.story && (
        <section className={st.section}>
          <h2 className={st.sectionTitle}>{tx('Notre histoire', 'Our story')}</h2>
          <div className={st.rule} />
          <p className={st.story}>{site.story}</p>
        </section>
      )}

      {(site.dress_code || site.gifts || site.contact) && (
        <section className={st.section}>
          <h2 className={st.sectionTitle}>{tx('Bon à savoir', 'Good to know')}</h2>
          <div className={st.rule} />
          <div className={st.info}>
            {site.dress_code && <div className={st.infoCard}><div className={st.infoTitle}>{tx('Tenue', 'Dress code')}</div><div className={st.infoText}>{site.dress_code}</div></div>}
            {site.gifts && <div className={st.infoCard}><div className={st.infoTitle}>{tx('Cadeaux', 'Gifts')}</div><div className={st.infoText}>{site.gifts}</div></div>}
            {site.contact && <div className={st.infoCard}><div className={st.infoTitle}>{tx('Une question ?', 'Questions?')}</div><div className={st.infoText}>{site.contact}</div></div>}
          </div>
        </section>
      )}

      {site.rsvp_open !== false && (
        <section className={st.section} id="rsvp">
          <h2 className={st.sectionTitle}>{tx('Serez-vous des nôtres ?', 'Will you join us?')}</h2>
          <div className={st.rule} />
          <Rsvp slug={data.slug} lang={l} deadline={site.rsvp_deadline} />
        </section>
      )}

      <footer className={st.footer}>
        {tx('Site créé avec', 'Website made with')} <a href="/mariage" onClick={(e) => { e.preventDefault(); navigate('/mariage') }}>Ouimoove Weddings</a> <Icon name="ring" />
      </footer>
    </div>
  )
}

function Rsvp({ slug, lang, deadline }) {
  const tx = T(lang)
  const key = `om_rsvp_${slug}`
  const [sent, setSent] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } })
  const [f, setF] = useState({ name: '', phone: '', attending: null, size: 1, message: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const late = useMemo(() => deadline && deadline < todayISO(), [deadline])

  const submit = async (e) => {
    e.preventDefault()
    if (f.name.trim().length < 2) { setError(tx('Indiquez votre nom.', 'Please enter your name.')); return }
    if (f.attending == null) { setError(tx('Dites-nous si vous venez.', 'Let us know if you are coming.')); return }
    setBusy(true); setError('')
    const { data, error: err } = await supabase.rpc('submit_wedding_rsvp', {
      p_slug: slug, p_name: f.name.trim(), p_phone: f.phone.trim(), p_attending: f.attending,
      p_party_size: f.attending ? Number(f.size) || 1 : 1, p_message: f.message.trim(),
    })
    setBusy(false)
    if (err || !data?.ok) {
      const code = data?.error
      setError(code === 'rate_limited' ? tx('Trop de réponses envoyées depuis cet appareil. Réessayez plus tard.', 'Too many replies from this device. Please try again later.')
        : code === 'closed' ? tx('Les réponses sont fermées. Contactez directement les mariés.', 'Replies are closed. Please contact the couple directly.')
          : tx("Votre réponse n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.", "Your reply couldn't be sent. Check your connection and try again."))
      return
    }
    const record = { name: f.name.trim(), attending: f.attending }
    try { localStorage.setItem(key, JSON.stringify(record)) } catch { /* ignore */ }
    setSent(record)
  }

  if (sent) {
    return (
      <div className={`${st.form} ${st.thanks}`}>
        <b>{sent.attending ? tx('Merci, à bientôt !', 'Thank you, see you soon!') : tx('Merci de nous avoir prévenus', 'Thank you for letting us know')}</b>
        <p className={st.muted}>{tx(`Réponse enregistrée pour ${sent.name}.`, `Reply saved for ${sent.name}.`)}</p>
        <button type="button" className={st.pill} style={{ margin: '14px auto 0', cursor: 'pointer' }} onClick={() => { setSent(null); try { localStorage.removeItem(key) } catch { /* ignore */ } }}>
          {tx('Envoyer une autre réponse', 'Send another reply')}
        </button>
      </div>
    )
  }

  return (
    <form className={st.form} onSubmit={submit}>
      {deadline && <p className={st.muted} style={{ textAlign: 'center' }}>{late ? tx('La date de réponse est passée, mais vous pouvez encore nous écrire.', 'The reply date has passed, but you can still let us know.') : tx(`Merci de répondre avant le ${formatDate(deadline, lang)}.`, `Please reply by ${formatDate(deadline, lang)}.`)}</p>}
      <label><span className={st.label}>{tx('Votre nom', 'Your name')}</span><input className={st.input} value={f.name} maxLength={120} autoComplete="name" onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label><span className={st.label}>{tx('Téléphone (WhatsApp)', 'Phone (WhatsApp)')}</span><input className={st.input} type="tel" value={f.phone} maxLength={40} autoComplete="tel" onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+228 90 00 00 00" /></label>
      <div>
        <span className={st.label}>{tx('Serez-vous présent·e ?', 'Will you attend?')}</span>
        <div className={st.choice}>
          <button type="button" aria-pressed={f.attending === true} onClick={() => setF({ ...f, attending: true })}>{tx('Oui, avec joie', 'Yes, with joy')}</button>
          <button type="button" aria-pressed={f.attending === false} onClick={() => setF({ ...f, attending: false })}>{tx('Non, désolé·e', 'Sorry, no')}</button>
        </div>
      </div>
      {f.attending && (
        <label><span className={st.label}>{tx('Nombre de personnes (vous compris)', 'Number of people (including you)')}</span>
          <select className={st.input} value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      <label><span className={st.label}>{tx('Un mot pour les mariés (facultatif)', 'A note for the couple (optional)')}</span><textarea className={st.input} rows={3} value={f.message} maxLength={1000} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
      {error && <p className={st.error} role="alert">{error}</p>}
      <button type="submit" className={st.submit} disabled={busy}>{busy ? '…' : tx('Envoyer ma réponse', 'Send my reply')}</button>
    </form>
  )
}
