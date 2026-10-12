// Two places a wedding plan can live, behind one interface:
//   remote — the Ouimoove database (Supabase), for signed-in couples;
//   local  — this device only, for people trying the planner first.
// Both take rows that already carry their id (see uuid()).
import { supabase } from '../../lib/supabase.js'
import { groupPatches } from '../lib/basics.js'

export const TABLE = {
  events: 'wedding_events',
  tables: 'wedding_tables',
  guests: 'wedding_guests',
  budget: 'wedding_budget_items',
  dowry: 'wedding_dowry_items',
  tasks: 'wedding_tasks',
  rsvps: 'wedding_rsvps',
  members: 'wedding_members',
}
// Order matters when copying a plan: guests point at tables.
export const PLAN_KINDS = ['events', 'tables', 'guests', 'budget', 'dowry', 'tasks']
export const ALL_KINDS = [...PLAN_KINDS, 'rsvps', 'members']

const check = ({ data, error }) => {
  if (error) throw error
  return data
}
const chunks = (list, size = 200) => {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
const WEDDING_COLUMNS = ['id', 'groom_name', 'bride_name', 'family_name', 'groom_culture', 'bride_culture', 'country', 'city',
  'currency', 'budget_total', 'guest_target', 'hashtag', 'slogan', 'lang', 'slug', 'site_published', 'site', 'prefs', 'status']
const weddingRow = (w) => Object.fromEntries(WEDDING_COLUMNS.filter((k) => k in w).map((k) => [k, w[k]]))
const clean = (r) => {
  const { local, ...rest } = r // eslint-disable-line no-unused-vars
  // Plans made on the device can carry explicit nulls for list columns that are NOT NULL.
  if ('events' in rest && rest.events == null) rest.events = []
  return rest
}

export const remote = {
  local: false,
  async listWeddings() {
    return check(await supabase.from('weddings').select('*').order('created_at', { ascending: true }))
  },
  async createWedding(w) {
    return check(await supabase.from('weddings').insert(weddingRow(w)).select().single())
  },
  async updateWedding(id, patch) {
    return check(await supabase.from('weddings').update(weddingRow(patch)).eq('id', id).select().single())
  },
  async deleteWedding(id) {
    check(await supabase.from('weddings').delete().eq('id', id))
  },
  async list(kind, weddingId) {
    return check(await supabase.from(TABLE[kind]).select('*').eq('wedding_id', weddingId)
      .order('created_at', { ascending: true }).limit(5000))
  },
  async insert(kind, rows) {
    const out = []
    for (const part of chunks(rows.map(clean))) {
      // defaultToNull:false → fields a row lacks use the column default instead of NULL
      out.push(...check(await supabase.from(TABLE[kind]).insert(part, { defaultToNull: false }).select()))
    }
    return out
  },
  async update(kind, id, patch) {
    check(await supabase.from(TABLE[kind]).update(patch).eq('id', id))
  },
  async updateMany(kind, changes) {
    for (const { patch, ids } of groupPatches(changes)) {
      for (const part of chunks(ids)) check(await supabase.from(TABLE[kind]).update(patch).in('id', part))
    }
  },
  async remove(kind, ids) {
    for (const part of chunks(ids)) check(await supabase.from(TABLE[kind]).delete().in('id', part))
  },
}

// ── This device ─────────────────────────────────────────────────────
const LKEY = 'om_weddings_local_v1'
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(LKEY) || 'null')
    if (v && Array.isArray(v.weddings)) return { weddings: v.weddings, rows: v.rows || {} }
  } catch { /* corrupted or blocked: start empty */ }
  return { weddings: [], rows: {} }
}
function save(db) {
  try {
    localStorage.setItem(LKEY, JSON.stringify(db))
  } catch {
    throw new Error('local_storage_full')
  }
}
const now = () => new Date().toISOString()

export const local = {
  local: true,
  async listWeddings() {
    return load().weddings
  },
  async createWedding(w) {
    const db = load()
    const row = { ...w, created_at: now(), updated_at: now(), local: true }
    db.weddings.push(row)
    save(db)
    return row
  },
  async updateWedding(id, patch) {
    const db = load()
    let out = null
    db.weddings = db.weddings.map((w) => (w.id === id ? (out = { ...w, ...patch, updated_at: now() }) : w))
    save(db)
    return out
  },
  async deleteWedding(id) {
    const db = load()
    db.weddings = db.weddings.filter((w) => w.id !== id)
    Object.keys(db.rows).forEach((k) => { db.rows[k] = db.rows[k].filter((r) => r.wedding_id !== id) })
    save(db)
  },
  async list(kind, weddingId) {
    return (load().rows[kind] || []).filter((r) => r.wedding_id === weddingId)
  },
  async insert(kind, rows) {
    const db = load()
    const stamped = rows.map((r) => ({ created_at: now(), ...r }))
    db.rows[kind] = [...(db.rows[kind] || []), ...stamped]
    save(db)
    return stamped
  },
  async update(kind, id, patch) {
    const db = load()
    db.rows[kind] = (db.rows[kind] || []).map((r) => (r.id === id ? { ...r, ...patch } : r))
    save(db)
  },
  async updateMany(kind, changes) {
    const db = load()
    const byId = new Map(changes.map((c) => [c.id, c.patch]))
    db.rows[kind] = (db.rows[kind] || []).map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id) } : r))
    save(db)
  },
  async remove(kind, ids) {
    const db = load()
    const set = new Set(ids)
    db.rows[kind] = (db.rows[kind] || []).filter((r) => !set.has(r.id))
    if (kind === 'tables') {
      db.rows.guests = (db.rows.guests || []).map((g) => (set.has(g.table_id) ? { ...g, table_id: null } : g))
    }
    save(db)
  },
}

export const localWeddingCount = () => load().weddings.length

// Copy every plan made on this device into the signed-in account, then
// remove the device copy. Returns the ids now in the account.
export async function importLocalWeddings() {
  const db = load()
  const moved = []
  for (const w of db.weddings) {
    await remote.createWedding(w)
    for (const kind of PLAN_KINDS) {
      const rows = (db.rows[kind] || []).filter((r) => r.wedding_id === w.id)
      if (rows.length) await remote.insert(kind, rows)
    }
    await local.deleteWedding(w.id)
    moved.push(w.id)
  }
  return moved
}
