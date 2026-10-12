// Budget maths. A line's cost is its actual price once known, else the
// estimate; cancelled lines don't count. The dowry list is costed from its
// items and belongs to the "tradition" envelope.
import { BUDGET_CATEGORIES } from '../data/templates.js'

export const lineCost = (i) => Number(i.actual ?? i.estimated ?? 0) || 0
export const isCommitted = (i) => i.status === 'booked' || i.status === 'paid'

export function budgetSummary(items, dowry, wedding) {
  const active = items.filter((i) => i.status !== 'cancelled')
  const dowryTotal = dowry.reduce((a, d) => a + (Number(d.est_cost) || 0), 0)
  const dowryPaid = dowry.filter((d) => d.status !== 'todo').reduce((a, d) => a + (Number(d.est_cost) || 0), 0)
  const linesTotal = active.reduce((a, i) => a + lineCost(i), 0)
  const committed = active.filter(isCommitted).reduce((a, i) => a + lineCost(i), 0) + dowryPaid
  const paid = active.reduce((a, i) => a + (Number(i.paid) || 0), 0) + dowryPaid
  const forecast = linesTotal + dowryTotal
  const total = Number(wedding?.budget_total) || 0
  const alloc = wedding?.prefs?.alloc || {}

  const byCat = {}
  const ensure = (id) => (byCat[id] ||= { alloc: Number(alloc[id]) || 0, forecast: 0, paid: 0, lines: 0 })
  BUDGET_CATEGORIES.forEach((c) => { if (alloc[c.id] != null) ensure(c.id) })
  active.forEach((i) => {
    const c = ensure(i.category || 'other')
    c.forecast += lineCost(i)
    c.paid += Number(i.paid) || 0
    c.lines += 1
  })
  if (dowry.length) {
    const t = ensure('tradition')
    t.forecast += dowryTotal
    t.paid += dowryPaid
  }
  return { total, forecast, committed, paid, dowryTotal, remaining: total - forecast, toPay: Math.max(0, forecast - paid), byCat }
}

// Lines with money still owed, soonest due date first.
export function paymentsDue(items) {
  return items
    .filter((i) => i.status !== 'cancelled' && isCommitted(i) && lineCost(i) > (Number(i.paid) || 0))
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
}
