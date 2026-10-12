import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildPlan, allocateBudget, rescheduleTasks, taskTitle, mainDate, stepTitle, dueDate, dateWarnings, suggestedExtras } from '../weddings/lib/plan.js'
import { suggestCut, autoSeat, guestStats, tableFill } from '../weddings/lib/guests.js'
import { makeHashtags, makeSlogans, blends } from '../weddings/lib/hashtags.js'
import { formatMoney, moneyParts, parseMoney, waNumber, slugify, latinize, addDays, coupleNames, groupPatches } from '../weddings/lib/basics.js'
import { budgetSummary, paymentsDue } from '../weddings/lib/budget.js'
import { CULTURES, cultureOf, COUNTRY_NOTES } from '../weddings/data/cultures.js'
import { RECIPIENTS, DOWRY_CATEGORIES, UNITS, VENDOR_CATEGORIES, TASK_TEMPLATES, BUDGET_CATEGORIES, STEP_KINDS, qtyLabel } from '../weddings/data/templates.js'

const TODAY = '2026-10-12'
const answers = {
  groomName: 'Desire', brideName: 'Keli', familyName: 'Akoda', role: 'groom',
  country: 'TG', city: 'Lomé', groomCulture: 'ewe', brideCulture: 'ewe', currency: 'XOF',
  steps: {
    knocking: { on: true, date: '2027-03-06' },
    dowry: { on: true, date: '2027-06-12' },
    civil: { on: true, date: '2027-11-29' },
    religious: { on: true, date: '2027-12-01', variant: 'church' },
    reception: { on: true, date: '2027-12-01', city: 'Lomé' },
    honeymoon: { on: true, date: '2027-12-04', endDate: '2027-12-14', venue: 'Bahamas' },
  },
  extras: [{ id: 'photoshoot', title: 'Séance photo', date: '2026-12-15' }],
  guestTarget: 200, budgetTotal: 15_000_000, splurge: ['venue', 'decor'], save: ['music', 'photo'],
}

describe('buildPlan', () => {
  const plan = buildPlan(answers, 'fr', TODAY)

  it('creates the six steps plus extras, linked to the wedding', () => {
    expect(plan.events.filter((e) => e.kind !== 'custom').map((e) => e.kind)).toEqual(STEP_KINDS)
    expect(plan.events.find((e) => e.kind === 'custom').title).toBe('Séance photo')
    expect(plan.events.every((e) => e.wedding_id === plan.wedding.id)).toBe(true)
    expect(plan.events.find((e) => e.kind === 'honeymoon')).toMatchObject({ end_date: '2027-12-14', venue: 'Bahamas', show_on_site: false })
    expect(plan.events.find((e) => e.kind === 'knocking').show_on_site).toBe(false)
  })

  it('dates every task from its step, never in the past', () => {
    const venue = plan.tasks.find((t) => t.tpl === 'venue_book')
    expect(venue.due_date).toBe(addDays('2027-12-01', -300))
    const knock = plan.tasks.find((t) => t.tpl === 'knock_buy')
    expect(knock.due_date).toBe(addDays('2027-03-06', -14))
    expect(plan.tasks.every((t) => !t.due_date || t.due_date >= TODAY)).toBe(true)
    expect(plan.tasks.find((t) => t.tpl === 'budget_set').due_date).toBe('2026-12-01')
    expect(dueDate('2026-11-01', -365, TODAY)).toBe(TODAY) // already past → do it now
  })

  it('splits the budget exactly and starts the bookings list', () => {
    const sum = Object.values(plan.wedding.prefs.alloc).reduce((a, b) => a + b, 0)
    expect(sum).toBe(15_000_000)
    expect(plan.budget.some((b) => b.label === 'Salle de réception' && b.estimated > 0)).toBe(true)
    expect(plan.budget.some((b) => b.category === 'honeymoon')).toBe(true)
  })

  it("starts the dowry list from the bride's family culture", () => {
    expect(plan.dowry.filter((d) => d.stage === 'knocking').length).toBe(cultureOf('ewe').knockingItems.length)
    expect(plan.dowry.filter((d) => d.stage === 'dowry').length).toBe(cultureOf('ewe').dowryItems.length)
    expect(plan.dowry[0].label).toBe('Schnapps')
  })

  it('skips what the couple does not celebrate', () => {
    const p = buildPlan({ ...answers, steps: { ...answers.steps, knocking: { on: false }, dowry: { on: false }, honeymoon: { on: false } } }, 'en', TODAY)
    expect(p.dowry).toHaveLength(0)
    expect(p.tasks.some((t) => t.event_kind === 'dowry' || t.event_kind === 'honeymoon')).toBe(false)
    expect(p.wedding.prefs.alloc.tradition).toBeUndefined()
    expect(p.wedding.prefs.alloc.honeymoon).toBeUndefined()
    expect(p.tasks.find((t) => t.tpl === 'venue_book').title).toBe('Book the reception venue')
  })

  it('works with no dates and no budget', () => {
    const p = buildPlan({ ...answers, steps: Object.fromEntries(STEP_KINDS.map((k) => [k, { on: true }])), extras: [], budgetTotal: 0 }, 'fr', TODAY)
    expect(p.tasks.every((t) => t.due_date === null)).toBe(true)
    expect(p.budget.every((b) => b.estimated === 0)).toBe(true)
    expect(mainDate(p.events)).toBeNull()
  })
})

describe('budget envelopes', () => {
  it('always sums to the total and follows splurge / save', () => {
    for (const total of [0, 7, 999, 1_234_567, 15_000_000, 250_000_000]) {
      const a = allocateBudget(total, STEP_KINDS)
      expect(Object.values(a).reduce((x, y) => x + y, 0)).toBe(total)
    }
    const base = allocateBudget(10_000_000, STEP_KINDS)
    const more = allocateBudget(10_000_000, STEP_KINDS, ['venue'], ['music'])
    expect(more.venue).toBeGreaterThan(base.venue)
    expect(more.music).toBeLessThan(base.music)
  })

  it('summarises planned, committed and paid, with the dowry in tradition', () => {
    const items = [
      { category: 'venue', estimated: 3_000_000, actual: 3_200_000, paid: 1_000_000, status: 'booked', due_date: '2027-05-01' },
      { category: 'photo', estimated: 800_000, paid: 0, status: 'planned' },
      { category: 'music', estimated: 500_000, paid: 0, status: 'cancelled' },
    ]
    const dowry = [{ est_cost: 200_000, status: 'bought' }, { est_cost: 100_000, status: 'todo' }]
    const b = budgetSummary(items, dowry, { budget_total: 5_000_000, prefs: { alloc: { venue: 3_000_000 } } })
    expect(b.forecast).toBe(3_200_000 + 800_000 + 300_000)
    expect(b.paid).toBe(1_000_000 + 200_000)
    expect(b.committed).toBe(3_200_000 + 200_000)
    expect(b.byCat.tradition.forecast).toBe(300_000)
    expect(b.byCat.venue.alloc).toBe(3_000_000)
    expect(paymentsDue(items).map((i) => i.category)).toEqual(['venue'])
  })
})

describe('rescheduling and titles', () => {
  it('moves unfinished template tasks when a step date changes', () => {
    const plan = buildPlan(answers, 'fr', TODAY)
    const done = plan.tasks.find((t) => t.tpl === 'cake_book')
    done.done = true
    const events = plan.events.map((e) => (e.kind === 'reception' ? { ...e, event_date: '2028-01-15' } : e))
    const changes = rescheduleTasks(events, plan.tasks, TODAY)
    const venue = plan.tasks.find((t) => t.tpl === 'venue_book')
    expect(changes.find((c) => c.id === venue.id).patch.due_date).toBe(addDays('2028-01-15', -300))
    expect(changes.some((c) => c.id === done.id)).toBe(false)
    expect(dueDate(null, -10)).toBeNull()
  })

  it('translates template tasks unless renamed', () => {
    expect(taskTitle({ tpl: 'venue_book', title: 'Réserver la salle de réception' }, 'en')).toBe('Book the reception venue')
    expect(taskTitle({ tpl: 'venue_book', title: 'Visiter 3 salles' }, 'en')).toBe('Visiter 3 salles')
    expect(taskTitle({ title: 'Custom' }, 'fr')).toBe('Custom')
  })

  it('names steps with the local term when there is one', () => {
    expect(stepTitle({ kind: 'knocking' }, 'fr', 'akan')).toBe('Toquer à la porte · Kɔkɔɔ kɔ')
    expect(stepTitle({ kind: 'dowry' }, 'en', 'nguni')).toBe('Dowry & traditional wedding · Lobola')
    expect(stepTitle({ kind: 'dowry' }, 'fr', 'ewe')).toBe('Dot & mariage coutumier')
    expect(stepTitle({ kind: 'religious', variant: 'mosque' }, 'en', 'hausa')).toBe('Mosque wedding')
    expect(stepTitle({ kind: 'custom', title: 'Henna night' }, 'en', 'other')).toBe('Henna night')
  })

  it('warns when steps are out of order', () => {
    expect(dateWarnings({ knocking: { on: true, date: '2027-06-01' }, dowry: { on: true, date: '2027-03-01' } })).toEqual([['knocking', 'dowry']])
    expect(dateWarnings(answers.steps)).toEqual([])
  })

  it('suggests extras from both cultures without duplicates', () => {
    const ids = suggestedExtras('hausa', 'maghreb').map((x) => x.id)
    expect(ids).toContain('henna')
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('guests', () => {
  const g = (id, seats, priority, status = 'list', extra = {}) => ({ id, name: id, seats, priority, status, side: 'groom', grp: 'family', rsvp: 'pending', created_at: id, ...extra })

  it('invites by priority until the seats run out', () => {
    const guests = [g('a', 2, 1), g('b', 3, 2), g('c', 2, 3), g('d', 1, 2, 'in'), g('e', 4, 1, 'out')]
    const changes = suggestCut(guests, 5)
    // by priority, then in the order they were added: a (2) + b (3) = 5 seats;
    // d (want) and c (if room) no longer fit
    expect(Object.fromEntries(changes.map((c) => [c.id, c.to]))).toEqual({ a: 'in', b: 'in', c: 'out', d: 'out' })
    expect(changes.find((c) => c.id === 'e')).toBeUndefined() // already cut, untouched
  })

  it('counts seats by side and replies', () => {
    const s = guestStats([g('a', 2, 1, 'in', { rsvp: 'yes', rsvp_count: 2 }), g('b', 1, 1, 'in', { side: 'bride' }), g('c', 5, 2, 'list')])
    expect(s).toMatchObject({ invitedSeats: 3, groomSeats: 2, brideSeats: 1, yesSeats: 2, wishSeats: 5, pendingCount: 1 })
  })

  it('seats everyone within capacity and keeps groups together', () => {
    const tables = [{ id: 't1', capacity: 4 }, { id: 't2', capacity: 4 }]
    const guests = [
      g('a', 2, 1, 'in'), g('b', 2, 1, 'in'),
      g('c', 3, 1, 'in', { side: 'bride' }), g('d', 1, 1, 'in', { side: 'bride' }),
      g('x', 2, 1, 'in', { rsvp: 'no' }),
    ]
    const plan = autoSeat(guests, tables)
    const seated = guests.map((x) => ({ ...x, table_id: plan.find((p) => p.id === x.id)?.table_id ?? null }))
    const fill = tableFill(tables, seated)
    expect(fill.t1).toBeLessThanOrEqual(4)
    expect(fill.t2).toBeLessThanOrEqual(4)
    expect(plan.find((p) => p.id === 'x')).toBeUndefined() // declined: no seat
    const tableOf = (id) => plan.find((p) => p.id === id).table_id
    expect(tableOf('a')).toBe(tableOf('b'))
    expect(tableOf('c')).toBe(tableOf('d'))
  })

  it('leaves a party unseated when no table has room', () => {
    expect(autoSeat([g('big', 9, 1, 'in')], [{ id: 't', capacity: 8 }])).toEqual([])
  })
})

describe('hashtags and slogans', () => {
  it("finds the couple's own style of hashtag from name meanings", () => {
    const tags = makeHashtags({ groom: 'Desire', bride: 'Keli', brideMeaning: 'light', date: '2027-12-01', family: 'Akoda' }).map((t) => t.tag)
    expect(tags).toContain('#HisLightHerDesire')
    expect(tags).toContain('#DesireAndKeli2027')
    expect(tags).toContain('#OuiDesireKeli')
    expect(tags).toContain('#KeliDevientAkoda')
    expect(new Set(tags.map((t) => t.toLowerCase())).size).toBe(tags.length)
    expect(tags.every((t) => /^#[A-Za-z0-9]+$/.test(t))).toBe(true)
  })

  it('cleans accents and special letters', () => {
    const tags = makeHashtags({ groom: 'Désiré', bride: 'Ɛyram', words: ['Lomé'] }).map((t) => t.tag)
    expect(tags).toContain('#DesireAndEyram')
    expect(tags).toContain('#DesireEyramInLome')
  })

  it('needs at least one name', () => {
    expect(makeHashtags({})).toEqual([])
    expect(makeSlogans({}, 'fr')).toEqual([])
    expect(makeSlogans({ groom: 'Desire', bride: 'Keli', brideMeaning: 'light' }, 'en')).toContain('His light, her Desire.')
    expect(blends('Desire', 'Keli')).toEqual(['Desli', 'Keire'])
  })
})

describe('money, text and links', () => {
  it('formats CFA francs and parses typed amounts', () => {
    expect(formatMoney(1500000, 'XOF', 'fr').replace(/\s/g, ' ')).toBe('1 500 000 FCFA')
    expect(formatMoney(1500000, 'XOF', 'en')).toBe('1,500,000 FCFA')
    expect(parseMoney('1 500 000 FCFA')).toBe(1500000)
    expect(parseMoney('1.500.000')).toBe(1500000)
    expect(parseMoney('')).toBe(0)
  })

  it('splits amounts from their currency for big numbers', () => {
    const cfa = moneyParts(13550000, 'XOF', 'fr')
    expect([cfa.num.replace(/\s/g, ' '), cfa.unit, cfa.before, cfa.sign]).toEqual(['13 550 000', 'FCFA', false, ''])
    const gbp = moneyParts(-2500, 'GBP', 'en')
    expect([gbp.num, gbp.unit, gbp.before, gbp.sign]).toEqual(['2,500', '£', true, '−'])
    const eur = moneyParts(2500, 'EUR', 'fr')
    expect([eur.num.replace(/\s/g, ' '), eur.unit, eur.before]).toEqual(['2 500', '€', false])
  })

  it('builds WhatsApp numbers from local formats', () => {
    expect(waNumber('90 11 22 33', 'TG')).toBe('22890112233')
    expect(waNumber('+228 90 11 22 33')).toBe('22890112233')
    expect(waNumber('0024 41 23 45 67')).toBe('2441234567')
    expect(waNumber('024 123 4567', 'GH')).toBe('233241234567')
  })

  it('makes clean website addresses', () => {
    expect(slugify('Désiré & Kéli 2027')).toBe('desire-et-keli-2027')
    expect(slugify('  Ɖɔdzi  ')).toBe('dodzi')
    expect(latinize('Kɔkɔɔ')).toBe('Kokoo')
    expect(coupleNames({ groom_name: 'Desire Akoda', bride_name: 'Keli Kwasi' })).toBe('Desire & Keli')
    expect(groupPatches([{ id: 1, patch: { a: 1 } }, { id: 2, patch: { a: 1 } }, { id: 3, patch: { a: 2 } }])).toEqual([{ patch: { a: 1 }, ids: [1, 2] }, { patch: { a: 2 }, ids: [3] }])
  })
})

describe('culture guides', () => {
  const sql = readFileSync(`${process.cwd()}/supabase/migrations/20261012000000_ouimoove_weddings.sql`, 'utf8')
  const dowryTable = sql.split('create table if not exists public.wedding_dowry_items')[1].split('\n);')[0]
  const checkList = (column) => {
    const m = dowryTable.match(new RegExp(`${column}\\s+text[^\\n]*check \\(${column} in \\(([^)]*)\\)`, 's'))
    return m ? m[1].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean) : []
  }

  it('covers each region with complete, bilingual content', () => {
    expect(CULTURES.length).toBeGreaterThanOrEqual(20)
    for (const c of CULTURES) {
      expect(c.name.fr && c.name.en, c.id).toBeTruthy()
      for (const part of ['knocking', 'dowry']) {
        expect(c[part].fr.length, `${c.id} ${part}`).toBeGreaterThan(0)
        expect(c[part].fr.length, `${c.id} ${part} fr/en`).toBe(c[part].en.length)
      }
      expect((c.tips.fr || []).length, `${c.id} tips`).toBe((c.tips.en || []).length)
      if (c.id !== 'other') expect(c.sources.length, `${c.id} sources`).toBeGreaterThan(0)
      c.sources.forEach((src) => expect(src.url).toMatch(/^https:\/\//))
    }
    expect(new Set(CULTURES.map((c) => c.region))).toEqual(new Set(['west', 'central', 'east', 'south', 'north', 'other']))
    expect(COUNTRY_NOTES.TG.fr).toContain('10 000 FCFA')
  })

  it('only uses list values the database accepts', () => {
    const recipients = checkList('recipient')
    const categories = checkList('category')
    expect(recipients.sort()).toEqual(Object.keys(RECIPIENTS).sort())
    expect(categories.sort()).toEqual(Object.keys(DOWRY_CATEGORIES).sort())
    for (const c of CULTURES) {
      for (const [fr, en, qty, unit, recipient, category] of [...c.knockingItems, ...c.dowryItems]) {
        expect(fr && en, c.id).toBeTruthy()
        expect(qty, `${c.id} ${fr}`).toBeGreaterThanOrEqual(0)
        if (unit) expect(UNITS[unit], `${c.id} unit ${unit}`).toBeTruthy()
        expect(RECIPIENTS[recipient], `${c.id} recipient ${recipient}`).toBeTruthy()
        expect(DOWRY_CATEGORIES[category], `${c.id} category ${category}`).toBeTruthy()
      }
    }
  })

  it('keeps vendor categories and task templates consistent', () => {
    const vendorSql = sql.match(/category\s+text not null check \(category in \(([^)]*)\)\)/s)[1].replace(/\s/g, '').replace(/'/g, '').split(',')
    expect(vendorSql.sort()).toEqual(VENDOR_CATEGORIES.map((c) => c.id).sort())
    expect(new Set(TASK_TEMPLATES.map((t) => t.id)).size).toBe(TASK_TEMPLATES.length)
    TASK_TEMPLATES.forEach((t) => expect(t.fr && t.en, t.id).toBeTruthy())
    expect(BUDGET_CATEGORIES.reduce((a, c) => a + c.weight, 0)).toBe(100)
    expect(qtyLabel(2, 'bottle', 'fr')).toBe('2 bouteilles')
    expect(qtyLabel(1, null, 'en')).toBe('')
  })
})
