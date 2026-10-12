// Turns the answers to the setup questions into a full plan: the journey
// steps, the checklist with due dates, budget envelopes, starter vendor
// bookings and the starting dowry list for the bride's family's culture.
import { cultureOf } from '../data/cultures.js'
import { STEPS, STEP_KINDS, TASK_TEMPLATES, BUDGET_CATEGORIES, STARTER_BOOKINGS, COMMON_EXTRAS } from '../data/templates.js'
import { uuid, addDays, todayISO, roundingStep } from './basics.js'

const pick = (obj, lang) => (obj ? obj[lang] ?? obj.fr : '')

// The main wedding day: reception, else religious, else civil, else dowry.
export function mainDate(events) {
  const by = (k) => events.find((e) => e.kind === k && e.included !== false && e.event_date)?.event_date
  return by('reception') || by('religious') || by('civil') || by('dowry') || by('knocking') || null
}

export function stepTitle(event, lang, brideCulture) {
  if (event.title) return event.title
  if (event.kind === 'religious' && event.variant) {
    const v = { church: { fr: "Mariage à l'église", en: 'Church wedding' }, mosque: { fr: 'Mariage à la mosquée', en: 'Mosque wedding' } }[event.variant]
    if (v) return pick(v, lang)
  }
  const local = cultureOf(brideCulture).terms?.[event.kind]
  const base = pick(STEPS[event.kind] || STEPS.custom, lang)
  return local && pick(local, lang) !== base ? `${base} · ${pick(local, lang)}` : base
}

// Checklist items made from a template follow the app's language unless the
// couple renamed them.
export function taskTitle(task, lang) {
  const tpl = task.tpl && TASK_TEMPLATES.find((t) => t.id === task.tpl)
  if (tpl && (!task.title || task.title === tpl.fr || task.title === tpl.en)) return pick(tpl, lang)
  return task.title || ''
}

// Budget envelopes per category. Splurge = +40 %, save = −40 %, categories
// whose steps aren't planned are dropped; amounts are rounded and the last
// envelope absorbs the rounding so the total is exact.
export function allocateBudget(total, kinds, splurge = [], save = []) {
  const planned = new Set(kinds)
  const cats = BUDGET_CATEGORIES.filter((c) => !c.needs || c.needs.some((k) => planned.has(k)))
  const weights = cats.map((c) => c.weight * (splurge.includes(c.id) ? 1.4 : 1) * (save.includes(c.id) ? 0.6 : 1))
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const step = roundingStep(total)
  const out = {}
  let used = 0
  cats.forEach((c, i) => {
    const raw = (total * weights[i]) / sum
    const amount = i === cats.length - 1 ? Math.max(0, total - used) : Math.round(raw / step) * step
    out[c.id] = amount
    used += amount
  })
  // Rounding can push the earlier envelopes past the total on tiny budgets.
  if (used > total) {
    const last = cats[cats.length - 1].id
    out[last] = Math.max(0, out[last] - (used - total))
  }
  return out
}

// Task due dates: in the past → today (still to do, just urgent).
export function dueDate(eventDate, days, today = todayISO()) {
  if (!eventDate) return null
  const d = addDays(eventDate, days)
  return d < today ? today : d
}

export function buildTasks(weddingId, events, lang, today = todayISO()) {
  const included = new Set(events.filter((e) => e.included !== false).map((e) => e.kind))
  const dates = Object.fromEntries(events.filter((e) => e.included !== false).map((e) => [e.kind, e.event_date || null]))
  const main = mainDate(events)
  return TASK_TEMPLATES
    .filter((t) => t.kind === 'main' || included.has(t.kind))
    .map((t, i) => ({
      id: uuid(),
      wedding_id: weddingId,
      tpl: t.id,
      title: pick(t, lang),
      event_kind: t.kind === 'main' ? null : t.kind,
      due_date: dueDate(t.kind === 'main' ? main : dates[t.kind], t.days, today),
      done: false,
      assignee: t.who,
      sort: i,
    }))
}

export function buildDowryItems(weddingId, cultureId, lang, stages = ['knocking', 'dowry']) {
  const c = cultureOf(cultureId)
  const rows = []
  const add = (items, stage) => items.forEach(([fr, en, qty, unit, recipient, category]) => {
    rows.push({
      id: uuid(), wedding_id: weddingId, stage,
      label: lang === 'en' ? en : fr,
      qty: qty ?? 1, unit: unit || null, recipient, category,
      est_cost: 0, status: 'todo', sort: rows.length,
    })
  })
  if (stages.includes('knocking')) add(c.knockingItems || [], 'knocking')
  if (stages.includes('dowry')) add(c.dowryItems || [], 'dowry')
  return rows
}

export function buildBookings(weddingId, kinds, alloc, lang) {
  const planned = new Set(kinds)
  const lines = STARTER_BOOKINGS.filter((b) => planned.has(b.kind))
  // Split each envelope across its starter lines; the tradition envelope
  // keeps 60 % for the dowry list itself, which is costed separately.
  const counts = {}
  lines.forEach((b) => { counts[b.category] = (counts[b.category] || 0) + 1 })
  return lines.map((b) => {
    const envelope = (alloc[b.category] || 0) * (b.category === 'tradition' ? 0.4 : 1)
    const raw = envelope / counts[b.category]
    const step = roundingStep(raw * 10)
    return {
      id: uuid(), wedding_id: weddingId, category: b.category, label: pick(b, lang),
      event_kind: b.kind, status: 'planned', estimated: Math.round(raw / step) * step, paid: 0,
    }
  })
}

const DEFAULT_ON_SITE = Object.fromEntries(Object.entries(STEPS).map(([k, v]) => [k, v.onSite]))

// answers: see Wizard.jsx (names, cultures, country, steps, extras, guests, budget…)
export function buildPlan(answers, lang = 'fr', today = todayISO()) {
  const weddingId = uuid()
  const brideCulture = answers.brideCulture || answers.groomCulture || 'other'
  const steps = answers.steps || {}

  const events = STEP_KINDS.map((kind) => {
    const s = steps[kind] || {}
    return {
      id: uuid(), wedding_id: weddingId, kind,
      variant: kind === 'religious' ? (s.variant || cultureOf(brideCulture).religious || 'church') : null,
      title: null,
      included: !!s.on,
      event_date: s.date || null,
      end_date: kind === 'honeymoon' ? (s.endDate || null) : null,
      start_time: null,
      venue: s.venue || null,
      city: s.city || (kind === 'honeymoon' ? null : answers.city) || null,
      show_on_site: DEFAULT_ON_SITE[kind],
      done: false,
      sort: STEPS[kind].order,
    }
  })
  ;(answers.extras || []).forEach((x, i) => {
    events.push({
      id: uuid(), wedding_id: weddingId, kind: 'custom', variant: x.id || null,
      title: x.title || x.id, included: true, event_date: x.date || null, end_date: null, start_time: null,
      venue: null, city: answers.city || null, show_on_site: true, done: false, sort: 10 + i,
    })
  })

  const kinds = events.filter((e) => e.included && e.kind !== 'custom').map((e) => e.kind)
  const total = Math.max(0, Math.round(Number(answers.budgetTotal) || 0))
  const alloc = allocateBudget(total, kinds, answers.splurge, answers.save)

  const dowryStages = ['knocking', 'dowry'].filter((k) => kinds.includes(k))

  const wedding = {
    id: weddingId,
    groom_name: (answers.groomName || '').trim().slice(0, 80),
    bride_name: (answers.brideName || '').trim().slice(0, 80),
    family_name: (answers.familyName || '').trim().slice(0, 80) || null,
    groom_culture: answers.groomCulture || null,
    bride_culture: answers.brideCulture || null,
    country: answers.country || null,
    city: (answers.city || '').trim().slice(0, 80) || null,
    currency: answers.currency || 'XOF',
    budget_total: total,
    guest_target: Math.max(0, Math.round(Number(answers.guestTarget) || 0)),
    lang,
    hashtag: null,
    slogan: null,
    slug: null,
    site_published: false,
    site: {},
    prefs: { role: answers.role || 'groom', alloc, splurge: answers.splurge || [], save: answers.save || [] },
    status: 'planning',
  }

  return {
    wedding,
    events,
    tasks: buildTasks(weddingId, events, lang, today),
    budget: total > 0 ? buildBookings(weddingId, kinds, alloc, lang) : buildBookings(weddingId, kinds, {}, lang),
    dowry: dowryStages.length ? buildDowryItems(weddingId, brideCulture, lang, dowryStages) : [],
  }
}

// Extras suggested in the setup questions: common ones plus the cultures'.
export function suggestedExtras(groomCulture, brideCulture) {
  const seen = new Set()
  const out = []
  ;[...(cultureOf(brideCulture).extras || []), ...(cultureOf(groomCulture).extras || []), ...COMMON_EXTRAS].forEach((x) => {
    if (!seen.has(x.id)) { seen.add(x.id); out.push(x) }
  })
  return out
}

// After a date changes, move the due dates of unfinished checklist items
// that came from a template. Returns [{ id, patch }] for updateMany.
export function rescheduleTasks(events, tasks, today = todayISO()) {
  const dates = Object.fromEntries(events.filter((e) => e.included !== false && e.kind !== 'custom').map((e) => [e.kind, e.event_date || null]))
  const main = mainDate(events)
  const changes = []
  tasks.forEach((t) => {
    if (t.done || !t.tpl) return
    const tpl = TASK_TEMPLATES.find((x) => x.id === t.tpl)
    if (!tpl) return
    const due = dueDate(tpl.kind === 'main' ? main : dates[tpl.kind], tpl.days, today)
    if ((due || null) !== (t.due_date || null)) changes.push({ id: t.id, patch: { due_date: due } })
  })
  return changes
}

// Order sanity check for the dates the couple entered.
export function dateWarnings(steps) {
  const order = ['knocking', 'dowry', 'civil', 'religious', 'reception']
  const dated = order.filter((k) => steps[k]?.on && steps[k]?.date).map((k) => ({ k, d: steps[k].date }))
  const warnings = []
  for (let i = 1; i < dated.length; i++) {
    if (dated[i].d < dated[i - 1].d) warnings.push([dated[i - 1].k, dated[i].k])
  }
  const h = steps.honeymoon
  if (h?.on && h.date && h.endDate && h.endDate < h.date) warnings.push(['honeymoon', 'honeymoon'])
  return warnings
}
