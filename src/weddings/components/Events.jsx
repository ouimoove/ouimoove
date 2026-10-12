import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from './uiContext.js'
import { Btn, ConfirmBtn, Field, Input, Select, Sheet, Textarea, cx, styles as s } from './ui.jsx'
import { cultureOf, COUNTRY_NOTES } from '../data/cultures.js'
import { STEPS, STEP_GUIDE, STEP_KINDS, RELIGIOUS_VARIANTS, RECIPIENTS, qtyLabel } from '../data/templates.js'
import { stepTitle, rescheduleTasks, buildTasks, buildDowryItems } from '../lib/plan.js'

export const eventIcon = (e) => (e.kind === 'religious' ? RELIGIOUS_VARIANTS[e.variant]?.icon || '⛪' : (STEPS[e.kind] || STEPS.custom).icon)

export function sortEvents(events) {
  return events.slice().sort((a, b) => (a.event_date || '9999').localeCompare(b.event_date || '9999') || (a.sort || 0) - (b.sort || 0))
}

// Moves checklist due dates after a date change and says so.
export function useReschedule() {
  const { rows, updateMany } = useWedding()
  const { toast } = useUI()
  const { tx } = useI18n()
  return async (events) => {
    const changes = rescheduleTasks(events, rows.tasks)
    if (!changes.length) return
    await updateMany('tasks', changes)
    toast(tx(`${changes.length} tâche(s) redatée(s) selon vos nouvelles dates.`, `${changes.length} task(s) re-dated to match your new dates.`), 'info')
  }
}

function Bullets({ items }) {
  if (!items?.length) return null
  return <ul className={s.guideList}>{items.map((b, i) => <li key={i}>{b}</li>)}</ul>
}

export function StepGuide({ event, onClose }) {
  const { tx, L, lang } = useI18n()
  const { wedding, rows } = useWedding()
  const { go } = useUI()
  const bride = cultureOf(wedding.bride_culture || wedding.groom_culture)
  const groom = wedding.groom_culture && wedding.groom_culture !== wedding.bride_culture ? cultureOf(wedding.groom_culture) : null
  const kind = event.kind
  const traditional = kind === 'knocking' || kind === 'dowry'
  const generic = kind === 'religious' ? STEP_GUIDE.religious[event.variant || 'church'] : STEP_GUIDE[kind]
  const note = (kind === 'dowry' || kind === 'civil') ? COUNTRY_NOTES[wedding.country] : null
  const sources = [...(traditional ? bride.sources : []), ...(traditional && groom ? groom.sources : []), ...(note ? [note.source] : [])]
    .filter((x, i, arr) => arr.findIndex((y) => y.url === x.url) === i)
  const knockingItems = rows.dowry.filter((d) => d.stage === 'knocking')
  const dowryItems = rows.dowry.filter((d) => d.stage === 'dowry')

  return (
    <Sheet open onClose={onClose} size="lg" title={`${eventIcon(event)} ${stepTitle(event, lang, wedding.bride_culture)}`} sub={L((STEPS[kind] || STEPS.custom).blurb)}>
      <div className={s.guide}>
        {traditional && (
          <div className={s.guideBlock}>
            <h4>{tx('Comment ça se passe', 'How it works')} · {L(bride.name)}</h4>
            <Bullets items={L(kind === 'knocking' ? bride.knocking : bride.dowry)} />
          </div>
        )}
        {traditional && groom && (
          <div className={s.guideBlock}>
            <h4>{tx('Côté famille du marié', "On the groom's family side")} · {L(groom.name)}</h4>
            <Bullets items={L(kind === 'knocking' ? groom.knocking : groom.dowry)} />
            <p className={s.small + ' ' + s.muted} style={{ marginTop: 8 }}>{tx("Deux cultures : mettez-vous d'accord tôt, entre aînés, sur les coutumes à suivre.", 'Two cultures: agree early, between elders, on which customs to follow.')}</p>
          </div>
        )}
        {generic && L(generic)?.length > 0 && (
          <div className={s.guideBlock}>
            <h4>{tx('Bon à savoir', 'Good to know')}</h4>
            <Bullets items={[...L(generic), ...(traditional ? L(bride.tips) || [] : [])]} />
          </div>
        )}
        {kind === 'knocking' && knockingItems.length > 0 && (
          <div className={s.guideBlock}>
            <h4>{tx('À apporter', 'What to bring')}</h4>
            <div className={s.list}>
              {knockingItems.map((d) => (
                <div key={d.id} className={s.listItem}>
                  <span className={s.grow}>{d.label}</span>
                  <span className={s.small + ' ' + s.muted}>{qtyLabel(d.qty, d.unit, lang)} · {L(RECIPIENTS[d.recipient])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {kind === 'dowry' && (
          <div className={cx(s.banner, s.bannerInfo)}>
            <span>{tx(`Votre liste de dot compte ${dowryItems.length} article(s).`, `Your dowry list has ${dowryItems.length} item(s).`)}</span>
            <Btn size="sm" variant="primary" onClick={() => { onClose(); go('tradition') }}>{tx('Ouvrir la liste', 'Open the list')}</Btn>
          </div>
        )}
        {note && (
          <div className={cx(s.banner, s.bannerWarn)}>{L(note)}</div>
        )}
        {traditional && (
          <p className={s.small + ' ' + s.muted}>{tx('Chaque famille a ses coutumes : servez-vous de ce guide comme point de départ et validez avec vos aînés.', 'Every family has its own customs: use this guide as a starting point and confirm with your elders.')}</p>
        )}
        {sources.length > 0 && (
          <div className={s.sources}>
            {tx('Sources : ', 'Sources: ')}
            {sources.map((x, i) => <span key={x.url}>{i > 0 && ' · '}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a></span>)}
          </div>
        )}
      </div>
    </Sheet>
  )
}

const httpsOnly = (u) => {
  const t = String(u || '').trim()
  if (!t) return null
  const withProto = /^https?:\/\//i.test(t) ? t.replace(/^http:\/\//i, 'https://') : `https://${t}`
  return withProto.length <= 500 ? withProto : null
}

// Edit a step's date, place and details, or add a custom moment.
export function EventEditor({ event, onClose }) {
  const { tx, L, lang } = useI18n()
  const { wedding, rows, add, update, remove, canEdit } = useWedding()
  const reschedule = useReschedule()
  const isNew = !event.id
  const [f, setF] = useState(() => ({
    title: event.title || '', variant: event.variant || 'church', included: event.included !== false,
    event_date: event.event_date || '', end_date: event.end_date || '', start_time: (event.start_time || '').slice(0, 5),
    venue: event.venue || '', city: event.city || '', map_url: event.map_url || '', dress_code: event.dress_code || '',
    notes: event.notes || '', show_on_site: event.show_on_site ?? true,
  }))
  const [busy, setBusy] = useState(false)
  const set = (p) => setF((prev) => ({ ...prev, ...p }))
  const kind = event.kind || 'custom'
  const honeymoon = kind === 'honeymoon'

  const save = async () => {
    if (kind === 'custom' && !f.title.trim()) return
    setBusy(true)
    const patch = {
      title: f.title.trim() || null,
      variant: kind === 'religious' ? f.variant : (event.variant ?? null),
      included: kind === 'custom' ? true : f.included,
      event_date: f.event_date || null,
      end_date: honeymoon ? (f.end_date || null) : null,
      start_time: f.start_time || null,
      venue: f.venue.trim() || null,
      city: f.city.trim() || null,
      map_url: httpsOnly(f.map_url),
      dress_code: f.dress_code.trim() || null,
      notes: f.notes.trim() || null,
      show_on_site: f.show_on_site,
    }
    let ok
    if (isNew) ok = !!(await add('events', { kind: 'custom', sort: 20 + rows.events.length, done: false, ...patch }))
    else ok = await update('events', event.id, patch)
    setBusy(false)
    if (!ok) return
    const dateChanged = isNew ? false : (patch.event_date !== (event.event_date || null) || patch.included !== (event.included !== false))
    if (dateChanged) await reschedule(rows.events.map((e) => (e.id === event.id ? { ...e, ...patch } : e)))
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={isNew ? tx('Ajouter un moment', 'Add an event') : `${eventIcon(event)} ${stepTitle(event, lang, wedding.bride_culture)}`}>
      <form className={s.stack} onSubmit={(e) => { e.preventDefault(); save() }}>
        {(kind === 'custom' || !isNew) && (
          <Field label={kind === 'custom' ? tx('Nom du moment', 'Event name') : tx('Nom affiché (facultatif)', 'Display name (optional)')}>
            <Input value={f.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder={kind === 'custom' ? tx('Ex. : soirée du henné', 'e.g. henna night') : L(STEPS[kind])} required={kind === 'custom'} />
          </Field>
        )}
        {kind === 'religious' && (
          <Field label={tx('Cérémonie', 'Ceremony')}>
            <Select value={f.variant} onChange={(e) => set({ variant: e.target.value })}>
              {Object.entries(RELIGIOUS_VARIANTS).map(([id, v]) => <option key={id} value={id}>{v.icon} {L(v)}</option>)}
            </Select>
          </Field>
        )}
        <div className={s.formGrid}>
          <Field label={honeymoon ? tx('Départ', 'Departure') : 'Date'}><Input type="date" value={f.event_date} onChange={(e) => set({ event_date: e.target.value })} /></Field>
          {honeymoon
            ? <Field label={tx('Retour', 'Return')}><Input type="date" value={f.end_date} min={f.event_date || undefined} onChange={(e) => set({ end_date: e.target.value })} /></Field>
            : <Field label={tx('Heure', 'Time')}><Input type="time" value={f.start_time} onChange={(e) => set({ start_time: e.target.value })} /></Field>}
        </div>
        <div className={s.formGrid}>
          <Field label={honeymoon ? tx('Destination', 'Destination') : tx('Lieu', 'Venue')}><Input value={f.venue} maxLength={160} onChange={(e) => set({ venue: e.target.value })} placeholder={honeymoon ? 'Zanzibar' : tx('Ex. : Hôtel 2 Février', 'e.g. Hotel 2 Février')} /></Field>
          {!honeymoon && <Field label={tx('Ville', 'City')}><Input value={f.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} /></Field>}
        </div>
        {!honeymoon && (
          <>
            <Field label={tx('Lien Google Maps (facultatif)', 'Google Maps link (optional)')} hint={tx("Dans Google Maps : Partager → Copier le lien.", 'In Google Maps: Share → Copy link.')}>
              <Input value={f.map_url} maxLength={500} inputMode="url" onChange={(e) => set({ map_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <Field label={tx('Tenue / dress code', 'Dress code')}><Input value={f.dress_code} maxLength={200} onChange={(e) => set({ dress_code: e.target.value })} placeholder={tx('Ex. : pagne des familles, tenue de soirée', 'e.g. family fabric, black tie')} /></Field>
          </>
        )}
        <Field label={tx('Notes privées', 'Private notes')}><Textarea value={f.notes} maxLength={4000} onChange={(e) => set({ notes: e.target.value })} /></Field>
        <div className={s.rowWrap}>
          {kind !== 'custom' && (
            <label className={s.check}><input type="checkbox" checked={f.included} onChange={(e) => set({ included: e.target.checked })} /> {tx('Nous célébrons cette étape', 'We are celebrating this step')}</label>
          )}
          <label className={s.check}><input type="checkbox" checked={f.show_on_site} onChange={(e) => set({ show_on_site: e.target.checked })} /> {tx('Afficher sur notre site', 'Show on our website')}</label>
        </div>
        <div className={s.spread}>
          {!isNew && kind === 'custom' && canEdit
            ? <ConfirmBtn onConfirm={async () => { if (await remove('events', event.id)) onClose() }}>{tx('Supprimer', 'Delete')}</ConfirmBtn>
            : <span />}
          <div className={s.rowWrap}>
            <Btn variant="ghost" onClick={onClose}>{tx('Annuler', 'Cancel')}</Btn>
            <Btn type="submit" variant="primary" disabled={busy || !canEdit}>{busy ? '…' : tx('Enregistrer', 'Save')}</Btn>
          </div>
        </div>
      </form>
    </Sheet>
  )
}

// Turn steps on or off and add custom moments.
export function ManageSteps({ onClose, onAdd }) {
  const { tx, L, lang } = useI18n()
  const { wedding, rows, add, update } = useWedding()
  const reschedule = useReschedule()
  const byKind = (k) => rows.events.find((e) => e.kind === k)
  // A step switched on for the first time gets its checklist (and, for the
  // traditional steps, its starting list of things to bring).
  const fillStep = async (k, events) => {
    if (!rows.tasks.some((t) => t.event_kind === k)) {
      const tasks = buildTasks(wedding.id, events, lang).filter((t) => t.event_kind === k)
      if (tasks.length) await add('tasks', tasks)
    }
    if ((k === 'knocking' || k === 'dowry') && !rows.dowry.some((d) => d.stage === k)) {
      const items = buildDowryItems(wedding.id, wedding.bride_culture || wedding.groom_culture, lang, [k])
      if (items.length) await add('dowry', items)
    }
  }
  const toggle = async (k) => {
    const e = byKind(k)
    if (e) {
      const included = e.included === false
      const events = rows.events.map((x) => (x.id === e.id ? { ...x, included } : x))
      const ok = await update('events', e.id, { included })
      if (ok) await reschedule(events)
      if (ok && included) await fillStep(k, events)
    } else {
      const row = { kind: k, included: true, show_on_site: STEPS[k].onSite, sort: STEPS[k].order, done: false, variant: k === 'religious' ? cultureOf(wedding.bride_culture).religious : null }
      const saved = await add('events', row)
      if (saved) await fillStep(k, [...rows.events, ...saved])
    }
  }
  const customs = rows.events.filter((e) => e.kind === 'custom')
  return (
    <Sheet open onClose={onClose} title={tx('Vos étapes', 'Your steps')} sub={tx('Cochez les étapes que vous célébrez.', 'Tick the steps you are celebrating.')}>
      <div className={s.stack}>
        <div className={s.list}>
          {STEP_KINDS.map((k) => {
            const e = byKind(k)
            const on = !!e && e.included !== false
            return (
              <label key={k} className={s.listItem} style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={on} onChange={() => toggle(k)} style={{ width: 18, height: 18, accentColor: 'var(--purple)' }} />
                <span aria-hidden="true">{e ? eventIcon(e) : STEPS[k].icon}</span>
                <span className={s.grow}>{e ? stepTitle(e, lang, wedding.bride_culture) : L(STEPS[k])}</span>
              </label>
            )
          })}
        </div>
        {customs.length > 0 && (
          <div className={s.list}>
            {customs.map((e) => <div key={e.id} className={s.listItem}>✨ <span className={s.grow}>{e.title}</span></div>)}
          </div>
        )}
        <Btn variant="subtle" onClick={onAdd}>+ {tx('Ajouter un moment (henné, fiançailles…)', 'Add an event (henna, engagement…)')}</Btn>
      </div>
    </Sheet>
  )
}
