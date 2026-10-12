import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { remote, local, TABLE, PLAN_KINDS, ALL_KINDS, importLocalWeddings, localWeddingCount } from './adapters.js'
import { uuid } from '../lib/basics.js'

const CURRENT_KEY = 'om_wedding_current'
const EMPTY = Object.fromEntries(ALL_KINDS.map((k) => [k, []]))

// Signed-in session for the wedding area (the events app keeps its own).
export function useSession() {
  const [state, setState] = useState({ ready: false, user: null })
  useEffect(() => {
    let alive = true
    const toUser = (u) => (u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email } : null)
    supabase.auth.getSession()
      .then(({ data }) => { if (alive) setState({ ready: true, user: toUser(data.session?.user) }) })
      .catch(() => { if (alive) setState({ ready: true, user: null }) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return
      const user = toUser(session?.user)
      setState((s) => (s.ready && s.user?.id === user?.id && s.user?.name === user?.name ? s : { ready: true, user }))
    })
    return () => { alive = false; subscription.unsubscribe() }
  }, [])
  return state
}

const Ctx = createContext(null)

// Turns a Supabase/Postgres error into something a couple can act on.
export function errorText(e, tx) {
  const msg = String(e?.message || e || '')
  if (e?.code === '23505' && /slug/.test(msg)) return tx('Cette adresse est déjà prise : essayez-en une autre.', 'That address is taken: try another one.')
  if (/local_storage_full/.test(msg)) return tx("Plus de place sur cet appareil : créez un compte pour continuer.", 'This device is out of space: create an account to continue.')
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return tx('Pas de connexion. Vérifiez internet et réessayez.', 'No connection. Check your internet and try again.')
  if (/row-level security|permission/i.test(msg)) return tx("Vous n'avez pas le droit de modifier ce mariage.", "You don't have permission to edit this wedding.")
  if (/too_many_requests/.test(msg)) return tx('Trop de demandes envoyées aujourd’hui. Réessayez demain.', 'Too many requests sent today. Try again tomorrow.')
  return tx("Ça n'a pas marché : ", "That didn't work: ") + msg
}

export function WeddingProvider({ user, toast, tx, children }) {
  const adapter = user ? remote : local
  const [weddings, setWeddings] = useState([])
  const [currentId, setCurrentId] = useState(() => { try { return localStorage.getItem(CURRENT_KEY) } catch { return null } })
  const [rows, setRows] = useState(EMPTY)
  const [listState, setListState] = useState('loading') // loading | ready | error
  const [rowsState, setRowsState] = useState('idle') // idle | loading | ready | error
  const [localCount, setLocalCount] = useState(() => localWeddingCount())
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  const fail = useCallback((e) => {
    console.error('[weddings]', e)
    toast?.(errorText(e, tx), 'error')
  }, [toast, tx])

  const wedding = useMemo(() => weddings.find((w) => w.id === currentId) || weddings[0] || null, [weddings, currentId])
  const weddingId = wedding?.id || null

  const reloadList = useCallback(async () => {
    setListState('loading')
    try {
      setWeddings(await adapter.listWeddings())
      setListState('ready')
    } catch (e) {
      setListState('error')
      fail(e)
    }
    setLocalCount(localWeddingCount())
  }, [adapter, fail])

  useEffect(() => { reloadList() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRows = useCallback(async (id, quiet = false) => {
    if (!quiet) setRowsState('loading')
    try {
      const kinds = adapter.local ? PLAN_KINDS : ALL_KINDS
      const lists = await Promise.all(kinds.map((k) => adapter.list(k, id)))
      setRows({ ...EMPTY, ...Object.fromEntries(kinds.map((k, i) => [k, lists[i]])) })
      setRowsState('ready')
    } catch (e) {
      setRowsState('error')
      if (!quiet) fail(e)
    }
  }, [adapter, fail])

  useEffect(() => {
    if (!weddingId) { setRows(EMPTY); setRowsState('idle'); return }
    loadRows(weddingId)
  }, [weddingId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Partner edits arrive live; coming back to the tab refreshes anyway.
  useEffect(() => {
    if (!weddingId || adapter.local) return
    const channel = supabase.channel(`wedding_${weddingId}`)
    ALL_KINDS.forEach((kind) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: TABLE[kind], filter: `wedding_id=eq.${weddingId}` }, (p) => {
        if (p.eventType === 'DELETE') {
          const id = p.old?.id
          if (id) setRows((prev) => (prev[kind].some((r) => r.id === id) ? { ...prev, [kind]: prev[kind].filter((r) => r.id !== id) } : prev))
          return
        }
        const row = p.new
        if (!row || row.wedding_id !== weddingId) return
        setRows((prev) => {
          const exists = prev[kind].some((r) => r.id === row.id)
          return { ...prev, [kind]: exists ? prev[kind].map((r) => (r.id === row.id ? row : r)) : [...prev[kind], row] }
        })
      })
    })
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'weddings', filter: `id=eq.${weddingId}` }, (p) => {
      if (p.new) setWeddings((prev) => prev.map((w) => (w.id === p.new.id ? p.new : w)))
    })
    channel.subscribe()
    const onFocus = () => { if (document.visibilityState === 'visible') loadRows(weddingId, true) }
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [weddingId, adapter, loadRows])

  const select = useCallback((id) => {
    setCurrentId(id)
    try { localStorage.setItem(CURRENT_KEY, id) } catch { /* ignore */ }
  }, [])

  // ── Wedding ──
  const createWedding = useCallback(async (plan) => {
    try {
      const created = await adapter.createWedding(plan.wedding)
      for (const kind of PLAN_KINDS) {
        if (plan[kind]?.length) await adapter.insert(kind, plan[kind])
      }
      setWeddings((prev) => [...prev, created])
      select(created.id)
      setLocalCount(localWeddingCount())
      return created.id
    } catch (e) {
      fail(e)
      return null
    }
  }, [adapter, fail, select])

  const updateWedding = useCallback(async (patch) => {
    if (!wedding) return false
    const before = wedding
    setWeddings((prev) => prev.map((w) => (w.id === before.id ? { ...w, ...patch } : w)))
    try {
      await adapter.updateWedding(before.id, patch)
      return true
    } catch (e) {
      setWeddings((prev) => prev.map((w) => (w.id === before.id ? before : w)))
      fail(e)
      return false
    }
  }, [adapter, wedding, fail])

  const deleteWedding = useCallback(async () => {
    if (!wedding) return false
    try {
      await adapter.deleteWedding(wedding.id)
      setWeddings((prev) => prev.filter((w) => w.id !== wedding.id))
      setCurrentId(null)
      try { localStorage.removeItem(CURRENT_KEY) } catch { /* ignore */ }
      setLocalCount(localWeddingCount())
      return true
    } catch (e) {
      fail(e)
      return false
    }
  }, [adapter, wedding, fail])

  // ── Rows (optimistic: the screen changes first, then the save) ──
  const add = useCallback(async (kind, input) => {
    if (!weddingId) return null
    const stamp = new Date().toISOString()
    const list = (Array.isArray(input) ? input : [input]).map((r) => ({ id: uuid(), wedding_id: weddingId, ...r }))
    setRows((prev) => ({ ...prev, [kind]: [...prev[kind], ...list.map((r) => ({ created_at: stamp, ...r }))] }))
    try {
      const saved = await adapter.insert(kind, list)
      // Keep server defaults (invite tokens, timestamps).
      if (saved?.length) {
        const byId = new Map(saved.map((r) => [r.id, r]))
        setRows((prev) => ({ ...prev, [kind]: prev[kind].map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id) } : r)) }))
      }
      return saved?.length ? saved : list
    } catch (e) {
      const ids = new Set(list.map((r) => r.id))
      setRows((prev) => ({ ...prev, [kind]: prev[kind].filter((r) => !ids.has(r.id)) }))
      fail(e)
      return null
    }
  }, [adapter, weddingId, fail])

  const update = useCallback(async (kind, id, patch) => {
    const before = rowsRef.current[kind].find((r) => r.id === id)
    if (!before) return false
    setRows((prev) => ({ ...prev, [kind]: prev[kind].map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
    try {
      await adapter.update(kind, id, patch)
      return true
    } catch (e) {
      setRows((prev) => ({ ...prev, [kind]: prev[kind].map((r) => (r.id === id ? before : r)) }))
      fail(e)
      return false
    }
  }, [adapter, fail])

  // changes: [{ id, patch }]
  const updateMany = useCallback(async (kind, changes) => {
    if (!changes.length) return true
    const before = rowsRef.current[kind]
    const byId = new Map(changes.map((c) => [c.id, c.patch]))
    setRows((prev) => ({ ...prev, [kind]: prev[kind].map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id) } : r)) }))
    try {
      await adapter.updateMany(kind, changes)
      return true
    } catch (e) {
      setRows((prev) => ({ ...prev, [kind]: before }))
      fail(e)
      return false
    }
  }, [adapter, fail])

  const remove = useCallback(async (kind, idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds]
    const set = new Set(ids)
    const before = rowsRef.current
    setRows((prev) => {
      const next = { ...prev, [kind]: prev[kind].filter((r) => !set.has(r.id)) }
      if (kind === 'tables') next.guests = prev.guests.map((g) => (set.has(g.table_id) ? { ...g, table_id: null } : g))
      return next
    })
    try {
      await adapter.remove(kind, ids)
      return true
    } catch (e) {
      setRows(before)
      fail(e)
      return false
    }
  }, [adapter, fail])

  const importLocal = useCallback(async () => {
    try {
      const ids = await importLocalWeddings()
      await reloadList()
      if (ids[0]) select(ids[ids.length - 1])
      toast?.(tx('Votre plan est maintenant dans votre compte ✓', 'Your plan is now in your account ✓'), 'success')
      return true
    } catch (e) {
      fail(e)
      setLocalCount(localWeddingCount())
      return false
    }
  }, [reloadList, select, toast, tx, fail])

  const role = useMemo(() => {
    if (!wedding) return null
    if (adapter.local) return 'owner'
    if (wedding.owner_id === user?.id) return 'owner'
    return rows.members.find((m) => m.user_id === user?.id && m.status === 'accepted')?.role || 'viewer'
  }, [wedding, adapter, user, rows.members])

  const value = {
    user, isLocal: adapter.local, weddings, wedding, role,
    canEdit: role === 'owner' || role === 'partner' || role === 'planner',
    rows, listState, rowsState, localCount,
    select, reloadList, refresh: () => weddingId && loadRows(weddingId, true),
    createWedding, updateWedding, deleteWedding,
    add, update, updateMany, remove, importLocal, fail,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWedding() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWedding outside WeddingProvider')
  return ctx
}
