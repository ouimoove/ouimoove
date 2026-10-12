import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Empty, Field, Input, MoneyInput, PageHead, Select, Seg, Sheet, Spinner, Textarea, cx, styles as s } from '../components/ui.jsx'
import { VENDOR_CATEGORIES, VENDOR_CAT_BY_ID, VENDOR_TO_BUDGET, COUNTRIES, COUNTRY_BY_CODE, CURRENCIES } from '../data/templates.js'
import { mainDate } from '../lib/plan.js'
import { waLink } from '../lib/basics.js'
import { resizeImage } from './Website.jsx'
import { Icon } from '../../components/Icon.jsx'
import { SeviziSuggestions, SeviziRequests, SEVIZI_CATEGORIES } from './SeviziVendors.jsx'

const LEAD_STATUSES = { new: { fr: 'Nouvelle', en: 'New' }, contacted: { fr: 'Contactée', en: 'Contacted' }, closed: { fr: 'Terminée', en: 'Closed' } }
const VENDOR_STATUSES = { pending: { fr: 'En vérification', en: 'Under review' }, approved: { fr: 'En ligne', en: 'Live' }, rejected: { fr: 'Refusée', en: 'Rejected' } }

export function Vendors() {
  const { tx } = useI18n()
  const { user } = useWedding()
  const [tab, setTab] = useState('directory')
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin'))
      .catch(() => setIsAdmin(false))
  }, [user])

  return (
    <>
      <PageHead
        title={tx('Prestataires Ouimoove', 'Ouimoove vendors')}
        sub={tx('Wedding planners, traiteurs, photographes, décorateurs, location de chaises… Contactez-les sur WhatsApp ou demandez un devis.', 'Planners, caterers, photographers, decorators, chair rental… Reach them on WhatsApp or request a quote.')}
      />
      <Seg label={tx('Rubrique', 'Section')} value={tab} onChange={setTab} options={[
        { value: 'directory', label: tx('Annuaire', 'Directory') },
        ...(user ? [{ value: 'mine', label: tx('Mes demandes', 'My requests') }] : []),
        { value: 'pro', label: tx('Espace prestataire', 'Vendor space') },
        ...(isAdmin ? [{ value: 'admin', label: 'Admin' }] : []),
      ]} />
      {tab === 'directory' && <Directory />}
      {tab === 'mine' && user && <MyRequests />}
      {tab === 'pro' && <VendorSpace />}
      {tab === 'admin' && isAdmin && <AdminQueue />}
    </>
  )
}

function useLoad(fn, deps) {
  const [state, setState] = useState({ loading: true, data: [], error: null })
  const load = useCallback(async () => {
    setState((x) => ({ ...x, loading: true }))
    try {
      const { data, error } = await fn()
      setState({ loading: false, data: data || [], error })
    } catch (error) {
      setState({ loading: false, data: [], error })
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

function Directory() {
  const { tx, L } = useI18n()
  const { wedding, user, isLocal, add, rows } = useWedding()
  const { openAuth, toast, go } = useUI()
  const [cat, setCat] = useState('all')
  const [country, setCountry] = useState(wedding?.country || 'TG')
  const [q, setQ] = useState('')
  const [lead, setLead] = useState(null)
  const list = useLoad(() => supabase.from('wedding_vendors').select('*').eq('status', 'approved')
    .order('verified', { ascending: false }).order('created_at', { ascending: false }).limit(500), [])

  const shown = useMemo(() => list.data.filter((v) =>
    (cat === 'all' || v.category === cat)
    && (!country || !v.country || v.country === country)
    && (!q || `${v.name} ${v.city || ''} ${v.description || ''}`.toLowerCase().includes(q.toLowerCase()))), [list.data, cat, country, q])
  const counts = useMemo(() => {
    const c = {}
    list.data.forEach((v) => { if (!country || !v.country || v.country === country) c[v.category] = (c[v.category] || 0) + 1 })
    return c
  }, [list.data, country])

  const book = async (v) => {
    if (!wedding) { go('nouveau'); return }
    if (rows.budget.some((i) => i.vendor_id === v.id || (i.vendor_name && i.vendor_name === v.name))) { toast(tx('Déjà dans vos réservations.', 'Already in your bookings.'), 'info'); return }
    const saved = await add('budget', {
      label: L(VENDOR_CAT_BY_ID[v.category]) || v.name, category: VENDOR_TO_BUDGET[v.category] || 'other',
      vendor_id: isLocal ? null : v.id, vendor_name: v.name, vendor_phone: v.whatsapp || v.phone || null,
      status: 'contacted', estimated: v.price_from || 0, paid: 0,
    })
    if (saved) toast(tx('Ajouté à vos réservations ✓', 'Added to your bookings ✓'), 'success')
  }
  const askQuote = (v) => {
    if (!user) { openAuth('login', tx('Connectez-vous pour envoyer une demande de devis.', 'Sign in to send a quote request.')); return }
    setLead(v)
  }

  return (
    <>
      <Card tight>
        <div className={s.stack}>
          <div className={s.rowWrap}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('Rechercher (nom, ville…)', 'Search (name, city…)')} style={{ maxWidth: 280 }} aria-label={tx('Rechercher', 'Search')} />
            <Select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 'auto' }} aria-label={tx('Pays', 'Country')}>
              <option value="">{tx('Tous les pays', 'All countries')}</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{L(c)}</option>)}
            </Select>
          </div>
          <div className={s.catPills}>
            <Chip tone={cat === 'all' ? 'plum' : undefined} onClick={() => setCat('all')}>{tx('Tous', 'All')}</Chip>
            {VENDOR_CATEGORIES.map((c) => (
              <Chip key={c.id} tone={cat === c.id ? 'plum' : undefined} onClick={() => setCat(c.id)}><Icon glyph={c.icon} /> {L(c)}{counts[c.id] ? ` · ${counts[c.id]}` : ''}</Chip>
            ))}
          </div>
        </div>
      </Card>

      <div className={cx(s.banner, s.bannerInfo)}>
        <span>{tx("Pas trouvé ? Dites-nous ce qu'il vous faut : l'équipe Ouimoove vous met en relation avec des prestataires de confiance.", "Can't find it? Tell us what you need: the Ouimoove team will connect you with trusted vendors.")}</span>
        <Btn size="sm" variant="primary" onClick={() => askQuote({ id: null, category: cat === 'all' ? 'planner' : cat, name: 'Ouimoove' })}>{tx("Demander à l'équipe", 'Ask the team')}</Btn>
      </div>

      {list.loading ? <Spinner /> : list.error ? (
        <Card><Empty icon="⚠️">{tx("L'annuaire n'est pas disponible pour le moment.", 'The directory is not available right now.')}</Empty></Card>
      ) : shown.length === 0 ? (
        <Card><Empty icon="🤝">{list.data.length ? tx('Aucun prestataire pour ces filtres.', 'No vendors for these filters.') : tx("Le réseau démarre : les premiers prestataires sont en cours de vérification. Demandez à l'équipe, nous vous mettons en relation.", 'The network is just starting: the first vendors are being verified. Ask the team and we will connect you.')}</Empty></Card>
      ) : (
        <div className={s.vendorGrid}>
          {shown.map((v) => <VendorCard key={v.id} v={v} onQuote={() => askQuote(v)} onBook={() => book(v)} />)}
        </div>
      )}
      {SEVIZI_CATEGORIES.includes(cat) && <SeviziSuggestions key={cat} category={cat} />}
      {lead && <LeadForm vendor={lead} onClose={() => setLead(null)} />}
    </>
  )
}

function VendorCard({ v, onQuote, onBook }) {
  const { tx, L, money } = useI18n()
  const { wedding } = useWedding()
  const c = VENDOR_CAT_BY_ID[v.category]
  const wa = v.whatsapp || v.phone
  return (
    <article className={s.vendorCard}>
      <div className={s.vendorPhoto}>{v.photo_url ? <img src={v.photo_url} alt="" loading="lazy" /> : <span aria-hidden="true"><Icon glyph={c?.icon || '✨'} /></span>}</div>
      <div className={s.vendorBody}>
        <div className={s.spread}>
          <span className={s.vendorName}>{v.name}</span>
          {v.verified && <Chip tone="good" title={tx('Vérifié par Ouimoove', 'Verified by Ouimoove')}>✓ {tx('Vérifié', 'Verified')}</Chip>}
        </div>
        <div className={s.tiny + ' ' + s.muted}><Icon glyph={c?.icon} /> {L(c)}{v.city ? ` · ${v.city}` : ''}{v.country ? ` · ${L(COUNTRY_BY_CODE[v.country]) || v.country}` : ''}</div>
        {v.price_from > 0 && <div className={s.small}><b>{tx('À partir de', 'From')} {money(v.price_from, v.currency)}</b></div>}
        {v.description && <p className={s.small + ' ' + s.muted} style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.description}</p>}
        <div className={s.rowWrap} style={{ marginTop: 'auto' }}>
          <Btn size="sm" variant="primary" onClick={onQuote}>{tx('Demander un devis', 'Request a quote')}</Btn>
          {wa && <Btn size="sm" variant="ghost" onClick={() => window.open(waLink(wa, tx('Bonjour, je vous ai trouvé sur Ouimoove Weddings pour notre mariage.', 'Hello, I found you on Ouimoove Weddings for our wedding.'), v.country || 'TG'), '_blank', 'noopener')}><Icon name="chat" /> WhatsApp</Btn>}
          {wedding && <Btn size="sm" variant="subtle" onClick={onBook}>+ {tx('Réservations', 'Bookings')}</Btn>}
          {v.instagram && <a className={s.linkBtn} style={{ fontSize: '.8rem' }} href={`https://instagram.com/${v.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {v.website && <a className={s.linkBtn} style={{ fontSize: '.8rem' }} href={v.website} target="_blank" rel="noopener noreferrer">{tx('Site', 'Website')}</a>}
        </div>
      </div>
    </article>
  )
}

function LeadForm({ vendor, onClose }) {
  const { tx, L } = useI18n()
  const { user, wedding, rows, isLocal } = useWedding()
  const { toast } = useUI()
  const main = wedding ? mainDate(rows.events) : null
  const [f, setF] = useState({
    name: user?.name || '', phone: '', email: user?.email || '', event_date: main || '',
    city: wedding?.city || '', guests: wedding?.guest_target || '', budget: 0, category: vendor.category || 'planner', message: '',
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const team = !vendor.id
  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim() || (!f.phone.trim() && !f.email.trim())) { toast(tx('Indiquez votre nom et un moyen de vous joindre.', 'Add your name and a way to reach you.'), 'error'); return }
    setBusy(true)
    const { error } = await supabase.from('wedding_vendor_leads').insert({
      vendor_id: vendor.id || null, wedding_id: wedding && !isLocal ? wedding.id : null, category: f.category,
      name: f.name.trim(), phone: f.phone.trim() || null, email: f.email.trim() || null, event_date: f.event_date || null,
      city: f.city.trim() || null, guests: Number(f.guests) || null, budget: f.budget || null, currency: wedding?.currency || 'XOF',
      message: f.message.trim() || null,
    })
    setBusy(false)
    if (error) { toast(/too_many/.test(error.message) ? tx('Trop de demandes aujourd’hui. Réessayez demain.', 'Too many requests today. Try again tomorrow.') : tx("La demande n'a pas pu être envoyée.", "The request couldn't be sent.") + ` (${error.message})`, 'error'); return }
    setDone(true)
  }
  return (
    <Sheet open onClose={onClose} title={team ? tx("Demander à l'équipe Ouimoove", 'Ask the Ouimoove team') : `${tx('Devis', 'Quote')} · ${vendor.name}`} sub={team ? tx('Nous vous recontactons avec des prestataires adaptés.', 'We will get back to you with suitable vendors.') : tx('Le prestataire reçoit votre demande et vous recontacte.', 'The vendor receives your request and gets back to you.')}>
      {done ? (
        <div className={s.stack}>
          <p>{tx('Demande envoyée ✓', 'Request sent ✓')}</p>
          {!team && (vendor.whatsapp || vendor.phone) && (
            <Btn variant="ghost" onClick={() => window.open(waLink(vendor.whatsapp || vendor.phone, tx(`Bonjour, je viens de vous envoyer une demande de devis sur Ouimoove Weddings (${f.name}).`, `Hello, I just sent you a quote request on Ouimoove Weddings (${f.name}).`), vendor.country || 'TG'), '_blank', 'noopener')}><Icon name="chat" /> {tx('Prévenir aussi sur WhatsApp', 'Also tell them on WhatsApp')}</Btn>
          )}
          <Btn variant="primary" onClick={onClose}>{tx('Fermer', 'Close')}</Btn>
        </div>
      ) : (
        <form className={s.stack} onSubmit={submit}>
          {team && (
            <Field label={tx('Ce que vous cherchez', 'What you are looking for')}>
              <Select value={f.category} onChange={(e) => set({ category: e.target.value })}>{VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c)}</option>)}</Select>
            </Field>
          )}
          <div className={s.formGrid}>
            <Field label={tx('Votre nom', 'Your name')}><Input value={f.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label={tx('Téléphone / WhatsApp', 'Phone / WhatsApp')}><Input type="tel" value={f.phone} maxLength={40} onChange={(e) => set({ phone: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={f.email} maxLength={200} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label={tx('Date du mariage', 'Wedding date')}><Input type="date" value={f.event_date} onChange={(e) => set({ event_date: e.target.value })} /></Field>
            <Field label={tx('Ville', 'City')}><Input value={f.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} /></Field>
            <Field label={tx('Invités', 'Guests')}><Input type="number" min={0} value={f.guests} onChange={(e) => set({ guests: e.target.value })} /></Field>
          </div>
          <Field label={tx('Budget pour ce poste (facultatif)', 'Budget for this (optional)')}><MoneyInput value={f.budget} onChange={(n) => set({ budget: n })} /></Field>
          <Field label={tx('Message', 'Message')}><Textarea value={f.message} maxLength={2000} onChange={(e) => set({ message: e.target.value })} placeholder={tx('Ce dont vous avez besoin, vos goûts, vos questions…', 'What you need, your style, your questions…')} /></Field>
          <Btn type="submit" variant="primary" disabled={busy}>{busy ? '…' : tx('Envoyer la demande', 'Send request')}</Btn>
        </form>
      )}
    </Sheet>
  )
}

function MyRequests() {
  const { tx, L, date } = useI18n()
  const { user } = useWedding()
  const leads = useLoad(() => supabase.from('wedding_vendor_leads').select('*, wedding_vendors(name, category, whatsapp, phone, country)').eq('user_id', user.id).order('created_at', { ascending: false }), [user.id])
  if (leads.loading) return <Spinner />
  if (!leads.data.length) return <div className={s.stack}><SeviziRequests /><Card><Empty icon="📨">{tx('Vous n’avez pas encore envoyé de demande.', 'You have not sent any requests yet.')}</Empty></Card></div>
  return (
    <div className={s.stack}>
    <SeviziRequests />
    <Card>
      <div className={s.list}>
        {leads.data.map((l) => (
          <div key={l.id} className={s.listItem}>
            <span aria-hidden="true"><Icon glyph={VENDOR_CAT_BY_ID[l.wedding_vendors?.category || l.category]?.icon || '📨'} /></span>
            <div className={s.grow}>
              <div className={s.strong}>{l.wedding_vendors?.name || tx('Équipe Ouimoove', 'Ouimoove team')}</div>
              <div className={s.tiny + ' ' + s.muted}>{date(String(l.created_at).slice(0, 10))}{l.message ? ` · ${l.message.slice(0, 80)}` : ''}</div>
            </div>
            <Chip tone={l.status === 'new' ? 'info' : l.status === 'contacted' ? 'good' : undefined}>{L(LEAD_STATUSES[l.status])}</Chip>
          </div>
        ))}
      </div>
    </Card>
    </div>
  )
}

const EMPTY_VENDOR = { name: '', category: 'planner', city: '', country: 'TG', description: '', phone: '', whatsapp: '', email: '', website: '', instagram: '', price_from: 0, currency: 'XOF', photo_url: '' }

function VendorSpace() {
  const { tx, L } = useI18n()
  const { user } = useWedding()
  const { openAuth, toast } = useUI()
  const [editing, setEditing] = useState(null)
  const mine = useLoad(() => (user ? supabase.from('wedding_vendors').select('*').eq('owner_id', user.id).order('created_at') : Promise.resolve({ data: [] })), [user?.id])
  const ids = mine.data.map((v) => v.id)
  const leads = useLoad(() => (ids.length ? supabase.from('wedding_vendor_leads').select('*').in('vendor_id', ids).order('created_at', { ascending: false }) : Promise.resolve({ data: [] })), [ids.join(',')])

  if (!user) {
    return (
      <Card>
        <Empty icon="🤝" action={<Btn variant="primary" onClick={() => openAuth('signup', tx('Créez votre compte pour inscrire votre activité.', 'Create your account to list your business.'))}>{tx('Créer mon compte', 'Create my account')}</Btn>}>
          {tx('Inscrivez votre activité pour apparaître dans l’annuaire Ouimoove Weddings et recevoir des demandes de devis. Chaque fiche est vérifiée par notre équipe avant d’être publiée.', 'List your business to appear in the Ouimoove Weddings directory and receive quote requests. Every listing is checked by our team before it goes live.')}
        </Empty>
      </Card>
    )
  }
  const setLeadStatus = async (l, status) => {
    const { error } = await supabase.from('wedding_vendor_leads').update({ status }).eq('id', l.id)
    if (error) toast(error.message, 'error'); else leads.reload()
  }
  return (
    <>
      <Card title={tx('Mes fiches', 'My listings')} actions={<Btn size="sm" variant="primary" onClick={() => setEditing({ ...EMPTY_VENDOR })}>+ {tx('Inscrire une activité', 'List a business')}</Btn>}>
        {mine.loading ? <Spinner /> : mine.data.length === 0 ? <p className={s.small + ' ' + s.muted}>{tx('Aucune fiche pour le moment.', 'No listings yet.')}</p> : (
          <div className={s.list}>
            {mine.data.map((v) => (
              <div key={v.id} className={s.listItem}>
                <span aria-hidden="true"><Icon glyph={VENDOR_CAT_BY_ID[v.category]?.icon} /></span>
                <div className={s.grow}><div className={s.strong}>{v.name}</div><div className={s.tiny + ' ' + s.muted}>{L(VENDOR_CAT_BY_ID[v.category])}{v.city ? ` · ${v.city}` : ''}</div></div>
                <Chip tone={v.status === 'approved' ? 'good' : v.status === 'rejected' ? 'bad' : 'info'}>{L(VENDOR_STATUSES[v.status])}</Chip>
                <Btn size="sm" variant="subtle" onClick={() => setEditing(v)}>{tx('Modifier', 'Edit')}</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
      {mine.data.length > 0 && (
        <Card title={tx('Demandes reçues', 'Requests received')}>
          {leads.loading ? <Spinner /> : leads.data.length === 0 ? <p className={s.small + ' ' + s.muted}>{tx('Pas encore de demande.', 'No requests yet.')}</p> : (
            <div className={s.list}>
              {leads.data.map((l) => <LeadRow key={l.id} l={l} onStatus={setLeadStatus} />)}
            </div>
          )}
        </Card>
      )}
      {editing && <VendorForm vendor={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); mine.reload() }} />}
    </>
  )
}

function LeadRow({ l, onStatus, extra }) {
  const { tx, L, date, money } = useI18n()
  return (
    <div className={s.listItem} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div className={s.grow} style={{ minWidth: 220 }}>
        <div className={s.row}><span className={s.strong}>{l.name}</span><Chip tone={l.status === 'new' ? 'info' : l.status === 'contacted' ? 'good' : undefined}>{L(LEAD_STATUSES[l.status])}</Chip></div>
        <div className={s.tiny + ' ' + s.muted}>
          {[l.phone, l.email, l.event_date && `${tx('mariage le', 'wedding on')} ${date(l.event_date)}`, l.city, l.guests && `${l.guests} ${tx('invités', 'guests')}`, l.budget && money(l.budget, l.currency || 'XOF')].filter(Boolean).join(' · ')}
        </div>
        {extra}
        {l.message && <p className={s.small} style={{ marginTop: 6 }}>{l.message}</p>}
      </div>
      <div className={s.rowWrap}>
        {l.phone && <Btn size="sm" variant="ghost" onClick={() => window.open(waLink(l.phone, tx(`Bonjour ${l.name}, merci pour votre demande sur Ouimoove Weddings.`, `Hello ${l.name}, thanks for your request on Ouimoove Weddings.`)), '_blank', 'noopener')}><Icon name="chat" /></Btn>}
        <Select value={l.status} onChange={(e) => onStatus(l, e.target.value)} style={{ width: 140, padding: '6px 8px' }} aria-label={tx('Statut', 'Status')}>
          {Object.entries(LEAD_STATUSES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
        </Select>
      </div>
    </div>
  )
}

function VendorForm({ vendor, onClose, onSaved }) {
  const { tx, L } = useI18n()
  const { user } = useWedding()
  const { toast } = useUI()
  const [f, setF] = useState({ ...EMPTY_VENDOR, ...vendor })
  const [busy, setBusy] = useState(false)
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const upload = async (file) => {
    if (!file || !/^image\//.test(file.type)) return
    setBusy(true)
    try {
      const blob = await resizeImage(file, 1200)
      const path = `${user.id}/vendor-${Date.now()}.jpg`
      const { error } = await supabase.storage.from('wedding-photos').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      set({ photo_url: supabase.storage.from('wedding-photos').getPublicUrl(path).data.publicUrl })
    } catch (e) {
      toast(tx("La photo n'a pas pu être envoyée.", "The photo couldn't be uploaded.") + (e?.message ? ` (${e.message})` : ''), 'error')
    }
    setBusy(false)
  }
  const save = async (e) => {
    e.preventDefault()
    if (f.name.trim().length < 2 || !(f.phone.trim() || f.whatsapp.trim() || f.email.trim())) { toast(tx('Nom et au moins un contact sont requis.', 'A name and at least one contact are required.'), 'error'); return }
    const site = f.website.trim()
    const row = {
      name: f.name.trim(), category: f.category, city: f.city.trim() || null, country: f.country || null, description: f.description.trim() || null,
      phone: f.phone.trim() || null, whatsapp: f.whatsapp.trim() || null, email: f.email.trim() || null,
      website: site ? (/^https?:\/\//.test(site) ? site : `https://${site}`) : null, instagram: f.instagram.trim().replace(/^@/, '') || null,
      price_from: f.price_from || null, currency: f.currency, photo_url: /^https:\/\//.test(f.photo_url) ? f.photo_url : null,
    }
    setBusy(true)
    const { error } = vendor.id ? await supabase.from('wedding_vendors').update(row).eq('id', vendor.id) : await supabase.from('wedding_vendors').insert(row)
    setBusy(false)
    if (error) { toast(error.message, 'error'); return }
    toast(vendor.id ? tx('Fiche mise à jour ✓', 'Listing updated ✓') : tx('Fiche envoyée : notre équipe la vérifie avant publication.', 'Listing sent: our team checks it before it goes live.'), 'success')
    onSaved()
  }
  return (
    <Sheet open onClose={onClose} size="lg" title={vendor.id ? vendor.name : tx('Inscrire mon activité', 'List my business')} sub={tx('Gratuit. Vérifiée par l’équipe Ouimoove avant publication.', 'Free. Checked by the Ouimoove team before it goes live.')}>
      <form className={s.stack} onSubmit={save}>
        <div className={s.formGrid}>
          <Field label={tx("Nom de l'activité", 'Business name')}><Input value={f.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} required /></Field>
          <Field label={tx('Catégorie', 'Category')}><Select value={f.category} onChange={(e) => set({ category: e.target.value })}>{VENDOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c)}</option>)}</Select></Field>
          <Field label={tx('Ville', 'City')}><Input value={f.city || ''} maxLength={80} onChange={(e) => set({ city: e.target.value })} /></Field>
          <Field label={tx('Pays', 'Country')}><Select value={f.country || ''} onChange={(e) => set({ country: e.target.value, currency: COUNTRY_BY_CODE[e.target.value]?.currency || f.currency })}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{L(c)}</option>)}</Select></Field>
        </div>
        <Field label={tx('Description', 'Description')}><Textarea value={f.description || ''} maxLength={1500} onChange={(e) => set({ description: e.target.value })} placeholder={tx('Vos services, votre style, vos zones…', 'Your services, style, areas…')} /></Field>
        <div className={s.formGrid}>
          <Field label="WhatsApp"><Input type="tel" value={f.whatsapp || ''} maxLength={40} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
          <Field label={tx('Téléphone', 'Phone')}><Input type="tel" value={f.phone || ''} maxLength={40} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={f.email || ''} maxLength={200} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Instagram"><Input value={f.instagram || ''} maxLength={100} onChange={(e) => set({ instagram: e.target.value })} placeholder="@" /></Field>
          <Field label={tx('Site web', 'Website')}><Input value={f.website || ''} maxLength={300} onChange={(e) => set({ website: e.target.value })} /></Field>
          <Field label={tx('Prix à partir de', 'Prices from')}><MoneyInput value={f.price_from} onChange={(n) => set({ price_from: n })} /></Field>
          <Field label={tx('Devise', 'Currency')}><Select value={f.currency} onChange={(e) => set({ currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        </div>
        <Field group label={tx('Photo', 'Photo')}>
          <div className={s.rowWrap}>
            {f.photo_url && <img src={f.photo_url} alt="" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 10 }} />}
            <label className={cx(s.btn, s.btnGhost, s.btnSm)} style={{ cursor: 'pointer' }}>{f.photo_url ? tx('Changer', 'Change') : tx('Ajouter une photo', 'Add a photo')}<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
          </div>
        </Field>
        <div className={s.spread}>
          <span className={s.tiny + ' ' + s.muted}>{vendor.status === 'rejected' ? tx('Modifier une fiche refusée la renvoie en vérification.', 'Editing a rejected listing sends it back for review.') : ''}</span>
          <div className={s.rowWrap}><Btn variant="ghost" onClick={onClose}>{tx('Annuler', 'Cancel')}</Btn><Btn type="submit" variant="primary" disabled={busy}>{busy ? '…' : tx('Enregistrer', 'Save')}</Btn></div>
        </div>
      </form>
    </Sheet>
  )
}

function AdminQueue() {
  const { tx, L } = useI18n()
  const { toast } = useUI()
  const pending = useLoad(() => supabase.from('wedding_vendors').select('*').neq('status', 'approved').order('created_at'), [])
  const live = useLoad(() => supabase.from('wedding_vendors').select('*').eq('status', 'approved').order('created_at', { ascending: false }), [])
  const team = useLoad(() => supabase.from('wedding_vendor_leads').select('*').is('vendor_id', null).order('created_at', { ascending: false }).limit(200), [])
  const setVendor = async (v, patch) => {
    const { error } = await supabase.from('wedding_vendors').update(patch).eq('id', v.id)
    if (error) toast(error.message, 'error'); else { pending.reload(); live.reload() }
  }
  const setLead = async (l, status) => {
    const { error } = await supabase.from('wedding_vendor_leads').update({ status }).eq('id', l.id)
    if (error) toast(error.message, 'error'); else team.reload()
  }
  const row = (v, actions) => (
    <div key={v.id} className={s.listItem} style={{ flexWrap: 'wrap' }}>
      <span aria-hidden="true"><Icon glyph={VENDOR_CAT_BY_ID[v.category]?.icon} /></span>
      <div className={s.grow} style={{ minWidth: 220 }}>
        <div className={s.strong}>{v.name} {v.verified && <Chip tone="good">✓</Chip>}</div>
        <div className={s.tiny + ' ' + s.muted}>{[L(VENDOR_CAT_BY_ID[v.category]), v.city, v.country, v.whatsapp || v.phone, v.email].filter(Boolean).join(' · ')}</div>
        {v.description && <p className={s.small + ' ' + s.muted} style={{ marginTop: 4 }}>{v.description.slice(0, 220)}</p>}
      </div>
      <div className={s.rowWrap}>{actions}</div>
    </div>
  )
  return (
    <>
      <Card title={tx(`À vérifier (${pending.data.length})`, `To review (${pending.data.length})`)}>
        {pending.data.length === 0 ? <p className={s.small + ' ' + s.muted}>{tx('Rien à vérifier.', 'Nothing to review.')}</p> : (
          <div className={s.list}>
            {pending.data.map((v) => row(v, (
              <>
                <Chip tone={v.status === 'rejected' ? 'bad' : 'info'}>{L(VENDOR_STATUSES[v.status])}</Chip>
                <Btn size="sm" variant="primary" onClick={() => setVendor(v, { status: 'approved' })}>{tx('Publier', 'Approve')}</Btn>
                <Btn size="sm" variant="ghost" onClick={() => setVendor(v, { status: 'approved', verified: true })}>{tx('Publier + vérifié', 'Approve + verified')}</Btn>
                {v.status !== 'rejected' && <Btn size="sm" variant="danger" onClick={() => setVendor(v, { status: 'rejected' })}>{tx('Refuser', 'Reject')}</Btn>}
              </>
            )))}
          </div>
        )}
      </Card>
      <Card title={tx(`Demandes à l'équipe (${team.data.filter((l) => l.status === 'new').length} nouvelles)`, `Requests to the team (${team.data.filter((l) => l.status === 'new').length} new)`)}>
        {team.data.length === 0 ? <p className={s.small + ' ' + s.muted}>{tx('Aucune demande.', 'No requests.')}</p> : (
          <div className={s.list}>{team.data.map((l) => <LeadRow key={l.id} l={l} onStatus={setLead} extra={<Chip tone="plum"><Icon glyph={VENDOR_CAT_BY_ID[l.category]?.icon} /> {L(VENDOR_CAT_BY_ID[l.category]) || l.category}</Chip>} />)}</div>
        )}
      </Card>
      <Card title={tx(`En ligne (${live.data.length})`, `Live (${live.data.length})`)}>
        <div className={s.list}>
          {live.data.map((v) => row(v, (
            <>
              <Btn size="sm" variant="subtle" onClick={() => setVendor(v, { verified: !v.verified })}>{v.verified ? tx('Retirer le badge', 'Remove badge') : tx('Marquer vérifié', 'Mark verified')}</Btn>
              <Btn size="sm" variant="danger" onClick={() => setVendor(v, { status: 'rejected' })}>{tx('Retirer', 'Take down')}</Btn>
            </>
          )))}
        </div>
      </Card>
    </>
  )
}
