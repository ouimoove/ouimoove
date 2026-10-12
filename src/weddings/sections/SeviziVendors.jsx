import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Empty, Field, Input, MoneyInput, Sheet, Spinner, Textarea, styles as s } from '../components/ui.jsx'
import { VENDOR_CAT_BY_ID } from '../data/templates.js'
import { mainDate } from '../lib/plan.js'
import { Icon } from '../../components/Icon.jsx'

// Everything Sèvizi-related goes through the sevizi-bridge edge function:
// the partner key stays on the server.
async function bridge(body) {
  const { data, error } = await supabase.functions.invoke('sevizi-bridge', { body })
  if (error) {
    let code = ''
    try { code = (await error.context?.json?.())?.error || '' } catch { /* not JSON */ }
    throw Object.assign(new Error(code || error.message), { code })
  }
  return data
}

// Categories Sèvizi can serve (see CATEGORY_MAP in its partner-api).
export const SEVIZI_CATEGORIES = ['planner', 'venue', 'catering', 'decor', 'photo', 'video', 'music', 'mc', 'makeup', 'attire', 'cake', 'transport', 'stationery', 'rentals']

function SeviziMark() {
  return <Chip tone="info">Sèvizi</Chip>
}

// Providers suggested by Sèvizi for the category chosen in the directory.
export function SeviziSuggestions({ category }) {
  const { tx, L } = useI18n()
  const { wedding, user } = useWedding()
  const { openAuth } = useUI()
  const [city, setCity] = useState(wedding?.city || '')
  const [state, setState] = useState({ loading: true, vendors: [], error: false })
  const [ask, setAsk] = useState(false)
  const c = VENDOR_CAT_BY_ID[category]

  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: true, error: false }))
    try {
      const out = await bridge({ action: 'vendors', category, city: city.trim() || undefined })
      setState({ loading: false, vendors: out.vendors || [], error: false })
    } catch {
      setState({ loading: false, vendors: [], error: true })
    }
  }, [category, city])
  useEffect(() => {
    const t = setTimeout(load, 350) // wait for typing to pause
    return () => clearTimeout(t)
  }, [load])

  const requestQuotes = () => {
    if (!user) { openAuth('login', tx('Connectez-vous pour demander des devis à Sèvizi.', 'Sign in to request quotes from Sèvizi.')); return }
    setAsk(true)
  }

  return (
    <Card
      title={<span className={s.rowWrap}>{tx('Suggestions Sèvizi', 'Sèvizi suggestions')} <SeviziMark /></span>}
      sub={tx(`${L(c)} près de chez vous, recommandés par le réseau Sèvizi.`, `${L(c)} near you, recommended by the Sèvizi network.`)}
      actions={<Btn size="sm" variant="primary" onClick={requestQuotes}>{tx('Demander des devis', 'Request quotes')}</Btn>}
    >
      <div className={s.stack}>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={tx('Ville (ex. Lomé)', 'City (e.g. Lomé)')} style={{ maxWidth: 260 }} aria-label={tx('Ville', 'City')} />
        {state.loading ? <Spinner /> : state.error ? (
          <Empty icon="⚠️">{tx('Sèvizi est indisponible pour le moment.', 'Sèvizi is not available right now.')}</Empty>
        ) : state.vendors.length === 0 ? (
          <Empty icon="🤝">{tx('Aucun prestataire Sèvizi trouvé ici. Envoyez une demande : ils seront prévenus dès qu’ils en auront.', 'No Sèvizi vendors found here yet. Send a request: they will be notified as they join.')}</Empty>
        ) : (
          <div className={s.vendorGrid}>
            {state.vendors.map((v) => (
              <article key={v.id} className={s.vendorCard}>
                <div className={s.vendorPhoto}>{v.photo_url ? <img src={v.photo_url} alt="" loading="lazy" /> : <span aria-hidden="true"><Icon glyph={c?.icon || '✨'} /></span>}</div>
                <div className={s.vendorBody}>
                  <div className={s.spread}>
                    <span className={s.vendorName}>{v.name}</span>
                    {v.verified && <Chip tone="good">✓ {tx('Vérifié', 'Verified')}</Chip>}
                  </div>
                  <div className={s.tiny + ' ' + s.muted}>
                    <SeviziMark /> {v.city ? ` ${v.city} · ` : ' '}{v.rating > 0 ? `★ ${Number(v.rating).toFixed(1)} (${v.reviews})` : tx('Nouveau', 'New')}
                    {v.missions > 0 ? ` · ${v.missions} ${tx('missions', 'jobs')}` : ''}
                  </div>
                  {v.bio && <p className={s.small + ' ' + s.muted} style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.bio}</p>}
                  {v.profile_url && (
                    <div style={{ marginTop: 'auto' }}>
                      <a className={s.linkBtn} href={v.profile_url} target="_blank" rel="noopener noreferrer">{tx('Voir le profil sur Sèvizi', 'View profile on Sèvizi')} →</a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {ask && <SeviziRequestForm category={category} defaultCity={city} onClose={() => setAsk(false)} />}
    </Card>
  )
}

function SeviziRequestForm({ category, defaultCity, onClose }) {
  const { tx, L } = useI18n()
  const { wedding, rows, isLocal } = useWedding()
  const { toast } = useUI()
  const main = wedding ? mainDate(rows.events) : null
  const [f, setF] = useState({ city: defaultCity || wedding?.city || '', event_date: main || '', guests: wedding?.guest_target || '', budget: 0, message: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (p) => setF((x) => ({ ...x, ...p }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.city.trim()) { toast(tx('Indiquez la ville.', 'Please enter the city.'), 'error'); return }
    setBusy(true)
    try {
      await bridge({
        action: 'request', category, city: f.city.trim(), event_date: f.event_date || undefined,
        guests: Number(f.guests) || undefined, budget: f.budget || undefined, message: f.message,
        wedding_id: wedding && !isLocal ? wedding.id : undefined,
      })
      setDone(true)
    } catch (err) {
      toast(err.code === 'too_many_requests'
        ? tx('Trop de demandes aujourd’hui. Réessayez demain.', 'Too many requests today. Try again tomorrow.')
        : tx("La demande n'a pas pu être envoyée. Réessayez dans un instant.", "The request couldn't be sent. Please try again shortly."), 'error')
    }
    setBusy(false)
  }

  return (
    <Sheet open onClose={onClose} title={`${tx('Devis Sèvizi', 'Sèvizi quotes')} · ${L(VENDOR_CAT_BY_ID[category])}`}
      sub={tx('Les prestataires Sèvizi de votre ville reçoivent votre demande et vous répondent avec une offre.', 'Sèvizi vendors in your city receive your request and reply with an offer.')}>
      {done ? (
        <div className={s.stack}>
          <p>{tx('Demande envoyée ✓ Les offres apparaîtront dans « Mes demandes ».', 'Request sent ✓ Offers will appear under “My requests”.')}</p>
          <Btn variant="primary" onClick={onClose}>{tx('Fermer', 'Close')}</Btn>
        </div>
      ) : (
        <form className={s.stack} onSubmit={submit}>
          <div className={s.formGrid}>
            <Field label={tx('Ville', 'City')}><Input value={f.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} /></Field>
            <Field label={tx('Date du mariage', 'Wedding date')}><Input type="date" value={f.event_date} onChange={(e) => set({ event_date: e.target.value })} /></Field>
            <Field label={tx('Invités', 'Guests')}><Input type="number" min={0} value={f.guests} onChange={(e) => set({ guests: e.target.value })} /></Field>
          </div>
          <Field label={tx('Budget pour ce poste (facultatif)', 'Budget for this (optional)')}><MoneyInput value={f.budget} onChange={(n) => set({ budget: n })} /></Field>
          <Field label={tx('Message', 'Message')}><Textarea value={f.message} maxLength={800} onChange={(e) => set({ message: e.target.value })} placeholder={tx('Ce dont vous avez besoin, vos goûts, vos questions…', 'What you need, your style, your questions…')} /></Field>
          <p className={s.tiny + ' ' + s.muted}>{tx('Votre numéro et votre e-mail ne sont pas partagés : Sèvizi protège les coordonnées.', 'Your phone and e-mail are not shared: Sèvizi keeps contact details private.')}</p>
          <Btn type="submit" variant="primary" disabled={busy}>{busy ? '…' : tx('Envoyer à Sèvizi', 'Send to Sèvizi')}</Btn>
        </form>
      )}
    </Sheet>
  )
}

// The couple's Sèvizi requests with the offers received so far.
export function SeviziRequests() {
  const { tx, L, date, money } = useI18n()
  const { user, wedding } = useWedding()
  const [state, setState] = useState({ loading: true, requests: [], error: false })

  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: true, error: false }))
    try {
      const out = await bridge({ action: 'offers' })
      setState({ loading: false, requests: out.requests || [], error: false })
    } catch {
      setState({ loading: false, requests: [], error: true })
    }
  }, [])
  useEffect(() => { if (user) load() }, [user, load])

  if (!user) return null
  if (state.loading) return <Card tight><Spinner /></Card>
  if (state.error) return <Card tight><Empty icon="⚠️" action={<Btn size="sm" variant="ghost" onClick={load}>{tx('Réessayer', 'Retry')}</Btn>}>{tx('Les offres Sèvizi ne se chargent pas pour le moment.', 'Sèvizi offers could not be loaded right now.')}</Empty></Card>
  if (!state.requests.length) return null

  return (
    <Card
      title={<span className={s.rowWrap}>{tx('Demandes envoyées à Sèvizi', 'Requests sent to Sèvizi')} <SeviziMark /></span>}
      actions={<Btn size="sm" variant="subtle" onClick={load}><Icon name="undo" /> {tx('Actualiser', 'Refresh')}</Btn>}
    >
      <div className={s.stack}>
        {state.requests.map((r) => (
          <div key={r.id} className={s.stackSm}>
            <div className={s.spread}>
              <div>
                <div className={s.strong}><Icon glyph={VENDOR_CAT_BY_ID[r.category]?.icon} /> {L(VENDOR_CAT_BY_ID[r.category])} · {r.city}</div>
                <div className={s.tiny + ' ' + s.muted}>{date(String(r.created_at).slice(0, 10))}{r.event_date ? ` · ${tx('mariage le', 'wedding on')} ${date(r.event_date)}` : ''}</div>
              </div>
              <Chip tone={r.offers.length ? 'good' : 'info'}>
                {r.offers.length ? `${r.offers.length} ${tx(r.offers.length > 1 ? 'offres' : 'offre', r.offers.length > 1 ? 'offers' : 'offer')}` : tx('En attente d’offres', 'Waiting for offers')}
              </Chip>
            </div>
            {r.offers.map((o) => (
              <div key={o.id} className={s.card + ' ' + s.cardTight}>
                <div className={s.spread}>
                  <span className={s.strong}>{o.provider?.name || 'Sèvizi'} {o.provider?.verified && <Chip tone="good">✓</Chip>}</span>
                  <span className={s.strong}>
                    {o.visit_required ? `${tx('dès', 'from')} ` : ''}{money(o.price, wedding?.currency || 'XOF')}
                    {o.price_max ? ` – ${money(o.price_max, wedding?.currency || 'XOF')}` : ''}
                  </span>
                </div>
                {o.visit_required && <div className={s.tiny + ' ' + s.muted}>{tx('Prix définitif après une visite sur place.', 'Final price after an on-site visit.')}</div>}
                {o.availability && <div className={s.small}>{o.availability}</div>}
                {o.message && <p className={s.small + ' ' + s.muted} style={{ lineHeight: 1.5 }}>{o.message}</p>}
                {o.provider?.profile_url && (
                  <a className={s.linkBtn} style={{ fontSize: '.82rem' }} href={o.provider.profile_url} target="_blank" rel="noopener noreferrer">
                    {tx('Voir le profil et échanger sur Sèvizi', 'View profile and chat on Sèvizi')} →
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
