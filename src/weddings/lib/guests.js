// Guest list maths: seats, his/hers split, RSVPs, "who makes the cut" and
// automatic table seating.

export const seatsOf = (g) => Math.max(1, Number(g?.seats) || 1)
export const sumSeats = (list) => list.reduce((a, g) => a + seatsOf(g), 0)

export function guestStats(guests) {
  const invited = guests.filter((g) => g.status === 'in')
  const coming = invited.filter((g) => g.rsvp === 'yes')
  return {
    names: guests.length,
    wishSeats: sumSeats(guests.filter((g) => g.status === 'list')),
    invitedSeats: sumSeats(invited),
    cutSeats: sumSeats(guests.filter((g) => g.status === 'out')),
    groomSeats: sumSeats(invited.filter((g) => g.side === 'groom')),
    brideSeats: sumSeats(invited.filter((g) => g.side === 'bride')),
    bothSeats: sumSeats(invited.filter((g) => g.side === 'both')),
    yesSeats: coming.reduce((a, g) => a + (g.rsvp_count ?? seatsOf(g)), 0),
    noCount: invited.filter((g) => g.rsvp === 'no').length,
    pendingCount: invited.filter((g) => g.rsvp === 'pending' || g.rsvp === 'maybe').length,
    invitedCount: invited.length,
  }
}

export function sortGuests(list) {
  return list.slice().sort((a, b) =>
    (a.priority - b.priority)
    || String(a.created_at || '').localeCompare(String(b.created_at || ''))
    || a.name.localeCompare(b.name))
}

// Fill the invited list by priority until the seats run out; everyone else
// is cut. Returns only the guests whose status changes.
export function suggestCut(guests, capacity) {
  const cap = Math.max(0, Number(capacity) || 0)
  const pool = sortGuests(guests.filter((g) => g.status === 'list' || g.status === 'in'))
  let used = 0
  const changes = []
  pool.forEach((g) => {
    const n = seatsOf(g)
    const to = used + n <= cap ? 'in' : 'out'
    if (to === 'in') used += n
    if (g.status !== to) changes.push({ id: g.id, from: g.status, to })
  })
  return changes
}

// Guests who should get a seat: invited and not declined.
export const seatable = (guests) => guests.filter((g) => g.status === 'in' && g.rsvp !== 'no')

export function tableFill(tables, guests) {
  const fill = Object.fromEntries(tables.map((t) => [t.id, 0]))
  seatable(guests).forEach((g) => { if (g.table_id && g.table_id in fill) fill[g.table_id] += seatsOf(g) })
  return fill
}

// Seat everyone who has no table yet, keeping each side and group together
// when possible. Parties larger than any free space stay unseated.
export function autoSeat(guests, tables) {
  const fill = tableFill(tables, guests)
  const groupAt = {} // "side|grp" → table id last used
  const todo = seatable(guests)
    .filter((g) => !g.table_id || !(g.table_id in fill))
    .sort((a, b) => (a.side + a.grp).localeCompare(b.side + b.grp) || a.priority - b.priority || seatsOf(b) - seatsOf(a))
  const out = []
  todo.forEach((g) => {
    const n = seatsOf(g)
    const key = `${g.side}|${g.grp}`
    const free = (t) => t.capacity - fill[t.id] >= n
    let table = tables.find((t) => t.id === groupAt[key] && free(t))
    if (!table) table = tables.find((t) => fill[t.id] > 0 && free(t) && tablesKey(t, guests, out) === key)
    if (!table) table = tables.find((t) => fill[t.id] === 0 && free(t))
    if (!table) table = tables.find(free)
    if (!table) return
    fill[table.id] += n
    groupAt[key] = table.id
    out.push({ id: g.id, table_id: table.id })
  })
  return out
}

// The side|group most present at a table (to keep families together).
function tablesKey(table, guests, pending) {
  const counts = {}
  const add = (g) => { const k = `${g.side}|${g.grp}`; counts[k] = (counts[k] || 0) + seatsOf(g) }
  guests.filter((g) => g.table_id === table.id).forEach(add)
  pending.filter((p) => p.table_id === table.id).forEach((p) => { const g = guests.find((x) => x.id === p.id); if (g) add(g) })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
}

export const tablesNeeded = (seats, perTable = 10) => Math.max(1, Math.ceil(seats / Math.max(1, perTable)))
