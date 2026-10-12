import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { Btn, Card, Chip, ConfirmBtn, Empty, Field, Input, InlineMoney, InlineText, PageHead, Stat, cx, styles as s } from '../components/ui.jsx'
import { useReschedule } from '../components/Events.jsx'
import { HONEYMOON_IDEAS, STEPS } from '../data/templates.js'
import { buildTasks, taskTitle } from '../lib/plan.js'
import { daysBetween, daysUntil, todayISO } from '../lib/basics.js'
import { lineCost } from '../lib/budget.js'

const PACKING = {
  fr: ['Passeports et visas', 'Billets et réservations (imprimés + téléphone)', 'Carnet de vaccination', 'Maillots, crème solaire, lunettes', 'Chargeurs et adaptateur de prise', 'Une tenue chic pour un dîner'],
  en: ['Passports and visas', 'Tickets and bookings (printed + phone)', 'Vaccination record', 'Swimwear, sunscreen, sunglasses', 'Chargers and plug adapter', 'One smart outfit for a dinner'],
}

export function Honeymoon() {
  const { tx, L, lang, money, date } = useI18n()
  const { wedding, rows, canEdit, add, update, remove } = useWedding()
  const reschedule = useReschedule()
  const [newTask, setNewTask] = useState('')
  const [newCost, setNewCost] = useState({ label: '', estimated: 0 })
  const trip = rows.events.find((e) => e.kind === 'honeymoon')
  const on = trip && trip.included !== false
  const cur = wedding.currency

  const enable = async () => {
    if (trip) {
      await update('events', trip.id, { included: true })
    } else {
      const saved = await add('events', { kind: 'honeymoon', included: true, show_on_site: false, sort: STEPS.honeymoon.order, done: false })
      if (!saved) return
    }
    if (!rows.tasks.some((t) => t.event_kind === 'honeymoon')) {
      const tasks = buildTasks(wedding.id, [...rows.events, { kind: 'honeymoon', included: true, event_date: trip?.event_date || null }], lang).filter((t) => t.event_kind === 'honeymoon')
      if (tasks.length) await add('tasks', tasks)
    }
  }
  const setTrip = async (patch) => {
    if (!trip) return
    const ok = await update('events', trip.id, patch)
    if (ok && 'event_date' in patch) await reschedule(rows.events.map((e) => (e.id === trip.id ? { ...e, ...patch } : e)))
  }

  if (!on) {
    return (
      <>
        <PageHead title={tx('Lune de miel', 'Honeymoon')} />
        <Card><Empty icon="✈️" action={canEdit && <Btn variant="primary" onClick={enable}>{tx('Prévoir une lune de miel', 'Plan a honeymoon')}</Btn>}>
          {tx('Vous n’avez pas encore prévu de lune de miel. Ajoutez-la pour avoir sa checklist, son budget et le compte à rebours.', 'No honeymoon planned yet. Add it to get its checklist, budget and countdown.')}
        </Empty></Card>
      </>
    )
  }

  const nights = trip.event_date && trip.end_date ? daysBetween(trip.event_date, trip.end_date) : null
  const until = trip.event_date ? daysUntil(trip.event_date) : null
  const costs = rows.budget.filter((i) => i.category === 'honeymoon' || i.event_kind === 'honeymoon')
  const total = costs.filter((i) => i.status !== 'cancelled').reduce((a, i) => a + lineCost(i), 0)
  const envelope = Number(wedding.prefs?.alloc?.honeymoon) || 0
  const tasks = rows.tasks.filter((t) => t.event_kind === 'honeymoon').sort((a, b) => (a.done - b.done) || (a.due_date || '9999').localeCompare(b.due_date || '9999'))

  const addTask = async (title) => {
    const t = title.trim()
    if (!t) return
    await add('tasks', { title: t, event_kind: 'honeymoon', due_date: trip.event_date && trip.event_date > todayISO() ? trip.event_date : null, assignee: 'both', done: false, sort: 2000 + rows.tasks.length })
  }

  return (
    <>
      <PageHead title={tx('Lune de miel', 'Honeymoon')} sub={tx('Votre voyage à deux. Il reste privé : il n’apparaît pas sur votre site, sauf si vous le décidez.', 'Your trip together. It stays private: it does not appear on your website unless you choose to.')} />

      <div className={s.stats}>
        <Stat value={trip.venue || '—'} label={tx('destination', 'destination')} />
        <Stat value={until == null ? '—' : until > 0 ? `J-${until}` : until === 0 ? tx("Aujourd'hui", 'Today') : tx('Bon voyage !', 'Bon voyage!')} label={trip.event_date ? `${tx('départ le', 'leaving on')} ${date(trip.event_date)}` : tx('date de départ à fixer', 'departure date to set')} />
        <Stat value={nights != null && nights >= 0 ? nights : '—'} label={tx('nuits', 'nights')} />
        <Stat amount={total} currency={cur} label={envelope ? tx(`prévu sur ${money(envelope, cur)}`, `planned of ${money(envelope, cur)}`) : tx('prévu', 'planned')} tone={envelope && total > envelope ? 'var(--w-bad)' : undefined} />
      </div>

      <div className={s.grid2} style={{ alignItems: 'start' }}>
        <Card title={tx('Le voyage', 'The trip')}>
          <fieldset disabled={!canEdit} className={s.stack} style={{ border: 0, padding: 0, margin: 0 }}>
            <Field label={tx('Destination', 'Destination')}><Input defaultValue={trip.venue || ''} key={trip.venue || 'v'} maxLength={160} onBlur={(e) => e.target.value.trim() !== (trip.venue || '') && setTrip({ venue: e.target.value.trim() || null })} placeholder="Zanzibar, Bahamas, Assinie…" /></Field>
            <div className={s.formGrid}>
              <Field label={tx('Départ', 'Departure')}><Input type="date" value={trip.event_date || ''} onChange={(e) => setTrip({ event_date: e.target.value || null })} /></Field>
              <Field label={tx('Retour', 'Return')}><Input type="date" value={trip.end_date || ''} min={trip.event_date || undefined} onChange={(e) => setTrip({ end_date: e.target.value || null })} /></Field>
            </div>
            <Field label={tx('Notes (hôtel, vols, idées)', 'Notes (hotel, flights, ideas)')}>
              <InlineText multiline value={trip.notes || ''} maxLength={4000} onSave={(notes) => setTrip({ notes: notes || null })} />
            </Field>
          </fieldset>
        </Card>

        <Card title={tx('Checklist du voyage', 'Trip checklist')} actions={canEdit && <Btn size="sm" variant="subtle" onClick={async () => { for (const p of PACKING[lang]) await addTask(p) }}>{tx('+ Liste de bagages', '+ Packing list')}</Btn>}>
          <div className={s.list}>
            {tasks.map((t) => (
              <label key={t.id} className={s.listItem} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={!!t.done} disabled={!canEdit} onChange={() => update('tasks', t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() })} style={{ width: 18, height: 18, accentColor: 'var(--purple)' }} />
                <span className={cx(s.grow, s.small)} style={t.done ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{taskTitle(t, lang)}</span>
                {canEdit && !t.tpl && <ConfirmBtn variant="subtle" confirmLabel="✕ ?" aria-label={tx('Supprimer', 'Delete')} onConfirm={() => remove('tasks', t.id)}>✕</ConfirmBtn>}
              </label>
            ))}
          </div>
          {canEdit && (
            <form className={s.row} style={{ marginTop: 10 }} onSubmit={(e) => { e.preventDefault(); addTask(newTask); setNewTask('') }}>
              <Input value={newTask} maxLength={200} onChange={(e) => setNewTask(e.target.value)} placeholder={tx('Ajouter une chose à faire ou à emporter', 'Add something to do or pack')} />
              <Btn type="submit" size="sm">{tx('Ajouter', 'Add')}</Btn>
            </form>
          )}
        </Card>
      </div>

      <Card title={tx('Budget du voyage', 'Trip budget')}>
        {costs.length === 0 && <p className={s.small + ' ' + s.muted}>{tx('Ajoutez vols, hôtel, activités…', 'Add flights, hotel, activities…')}</p>}
        <div className={s.list}>
          {costs.map((i) => (
            <div key={i.id} className={s.listItem}>
              <span className={s.grow}>{canEdit ? <InlineText value={i.label} maxLength={120} onSave={(label) => label && update('budget', i.id, { label })} /> : i.label}</span>
              <span style={{ width: 150 }}>{canEdit ? <InlineMoney value={i.actual ?? i.estimated} onSave={(n) => update('budget', i.id, i.actual != null ? { actual: n } : { estimated: n })} aria-label={tx('Montant', 'Amount')} /> : money(lineCost(i), cur)}</span>
              {canEdit && <ConfirmBtn variant="subtle" confirmLabel="✕ ?" aria-label={tx('Supprimer', 'Delete')} onConfirm={() => remove('budget', i.id)}>✕</ConfirmBtn>}
            </div>
          ))}
        </div>
        {canEdit && (
          <form className={s.rowWrap} style={{ marginTop: 10, alignItems: 'flex-end' }} onSubmit={async (e) => { e.preventDefault(); if (!newCost.label.trim()) return; if (await add('budget', { label: newCost.label.trim(), category: 'honeymoon', event_kind: 'honeymoon', estimated: newCost.estimated || 0, paid: 0, status: 'planned' })) setNewCost({ label: '', estimated: 0 }) }}>
            <Field label={tx('Poste', 'Item')} className={s.growWide}><Input value={newCost.label} maxLength={120} onChange={(e) => setNewCost({ ...newCost, label: e.target.value })} placeholder={tx('Ex. : excursion en bateau', 'e.g. boat trip')} /></Field>
            <Field label={tx('Montant', 'Amount')}><InlineMoney bare={false} value={newCost.estimated} onSave={(n) => setNewCost((c) => ({ ...c, estimated: n }))} style={{ width: 150 }} /></Field>
            <Btn type="submit" variant="primary">{tx('Ajouter', 'Add')}</Btn>
          </form>
        )}
      </Card>

      <Card title={tx('Idées de destinations', 'Destination ideas')} sub={tx('Touchez une idée pour la choisir.', 'Tap an idea to choose it.')}>
        <div className={s.gridAuto}>
          {HONEYMOON_IDEAS.map((h) => (
            <button key={h.place} type="button" className={cx(s.pickable, trip.venue === h.place && s.picked)} disabled={!canEdit} onClick={() => setTrip({ venue: h.place })} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className={s.strong}>{h.place}</span>
              <span className={s.tiny + ' ' + s.muted}>{L(h.country)} · {L(h.tags)}</span>
            </button>
          ))}
        </div>
        <div className={s.rowWrap} style={{ marginTop: 12 }}>
          <Chip tone="info">ℹ️</Chip>
          <span className={s.small + ' ' + s.muted}>{tx('Vérifiez les visas et vaccins demandés (fièvre jaune notamment) avant de réserver.', 'Check the visas and vaccinations required (yellow fever in particular) before booking.')}</span>
        </div>
      </Card>
    </>
  )
}
