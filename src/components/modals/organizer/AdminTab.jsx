import { useState, useEffect } from 'react'
import { formatDate } from '../../../utils/helpers.js'

export function AdminTab({ applications, onPromote, onReject, onRefresh, onLoadVerifRequests, onApproveVerif, onDenyVerif, onLoadCityRequests, onApproveCityRequest, onDenyCityRequest, onLoadPendingEvents, onApproveEvent, onRejectEvent, isSuperAdmin, currentUserId, onLoadAdmins, onPromoteAdmin, onDemoteAdmin }) {
  const [busy, setBusy] = useState({})
  const [verifRequests, setVerifRequests] = useState([])
  const [denyTarget, setDenyTarget] = useState(null)
  const [denyReason, setDenyReason] = useState('')
  const [verifBusy, setVerifBusy] = useState({})
  const [cityRequests, setCityRequests] = useState([])
  const [cityBusy, setCityBusy] = useState({})
  const [pendingEvents, setPendingEvents] = useState([])
  const [eventBusy, setEventBusy] = useState({})
  const [admins, setAdmins] = useState([])
  const [adminBusy, setAdminBusy] = useState({})
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addAdminBusy, setAddAdminBusy] = useState(false)

  // Load verification + city + pending-event requests on mount
  useEffect(() => {
    onLoadVerifRequests?.().then(setVerifRequests)
    onLoadCityRequests?.().then(setCityRequests)
    onLoadPendingEvents?.().then(setPendingEvents)
    if (isSuperAdmin) onLoadAdmins?.().then(setAdmins)
  }, [])

  const refreshAdmins = () => onLoadAdmins?.().then(setAdmins)

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim()
    if (!email) return
    setAddAdminBusy(true)
    const result = await onPromoteAdmin(email)
    setAddAdminBusy(false)
    if (result?.ok) { setNewAdminEmail(''); refreshAdmins() }
  }

  const handleRemoveAdmin = async (id) => {
    if (!window.confirm('Retirer les droits admin de ce compte ?')) return
    setAdminBusy(b => ({ ...b, [id]: true }))
    const result = await onDemoteAdmin(id)
    setAdminBusy(b => ({ ...b, [id]: false }))
    if (result?.ok) refreshAdmins()
  }

  const refreshVerif = () => onLoadVerifRequests?.().then(setVerifRequests)
  const refreshPendingEvents = () => onLoadPendingEvents?.().then(setPendingEvents)

  const handleApproveEvent = async (id) => {
    setEventBusy(b => ({ ...b, [id]: true }))
    const ok = await onApproveEvent(id)
    setEventBusy(b => ({ ...b, [id]: false }))
    if (ok) refreshPendingEvents()
  }

  const handleRejectEvent = async (id) => {
    if (!window.confirm("Supprimer définitivement cet événement ? Cette action est irréversible.")) return
    setEventBusy(b => ({ ...b, [id]: true }))
    const ok = await onRejectEvent(id)
    setEventBusy(b => ({ ...b, [id]: false }))
    if (ok) refreshPendingEvents()
  }

  const handleApprove = async (userId) => {
    setVerifBusy(b => ({ ...b, [userId]: true }))
    const ok = await onApproveVerif(userId)
    setVerifBusy(b => ({ ...b, [userId]: false }))
    if (ok) refreshVerif()
  }

  const handleDeny = async () => {
    if (!denyReason.trim()) return
    setVerifBusy(b => ({ ...b, [denyTarget]: true }))
    const ok = await onDenyVerif(denyTarget, denyReason.trim())
    setVerifBusy(b => ({ ...b, [denyTarget]: false }))
    if (ok) { setDenyTarget(null); setDenyReason(''); refreshVerif() }
  }

  const act = async (id, fn) => {
    setBusy(b => ({ ...b, [id]: true }))
    await fn()
    setBusy(b => ({ ...b, [id]: false }))
  }

  return (
    <div>
      {/* ── Manage admins (super_admin only) ── */}
      {isSuperAdmin && (
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              👑 Administrateurs ({admins.length})
            </p>
            <button onClick={refreshAdmins} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem' }}>↻</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="email"
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
              placeholder="Email d'un compte existant…"
              style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }}
            />
            <button
              disabled={addAdminBusy || !newAdminEmail.trim()}
              onClick={handleAddAdmin}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: 'var(--success)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, opacity: (addAdminBusy || !newAdminEmail.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
            >{addAdminBusy ? '…' : '+ Ajouter'}</button>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: -6, marginBottom: 12 }}>
            La personne doit déjà avoir son propre compte OuiMoove — chaque admin garde sa propre connexion.
          </p>

          {admins.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Aucun admin trouvé.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {admins.map(a => (
                <div key={a.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.role === 'super_admin' ? '👑' : '🔑'} {a.full_name || a.email}
                      {a.id === currentUserId && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.72rem' }}>(vous)</span>}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                      {a.email} · {a.role === 'super_admin' ? 'Super admin' : 'Admin'}
                    </div>
                  </div>
                  {a.role === 'admin' && (
                    <button
                      disabled={adminBusy[a.id]}
                      onClick={() => handleRemoveAdmin(a.id)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', opacity: adminBusy[a.id] ? 0.5 : 1, flexShrink: 0 }}
                    >✗ Retirer</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pending events (moderation queue) ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            🕓 Événements en attente ({pendingEvents.length})
          </p>
          <button onClick={refreshPendingEvents} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem' }}>↻</button>
        </div>

        {pendingEvents.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Aucun événement en attente de validation.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingEvents.map(e => (
              <div key={e.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{e.emoji}</span> {e.title}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                      {formatDate(e.date)} · {e.city} · {e.category}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                      Organisateur : {e.organizerName || '—'} {e.organizerEmail ? `(${e.organizerEmail})` : ''}
                    </div>
                    {e.desc && (
                      <div style={{ color: 'var(--text)', fontSize: '0.78rem', marginTop: 6, maxWidth: 420 }}>{e.desc}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      disabled={eventBusy[e.id]}
                      onClick={() => handleRejectEvent(e.id)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', opacity: eventBusy[e.id] ? 0.5 : 1 }}
                    >🗑️ Supprimer</button>
                    <button
                      disabled={eventBusy[e.id]}
                      onClick={() => handleApproveEvent(e.id)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: 'var(--success)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: eventBusy[e.id] ? 0.5 : 1 }}
                    >{eventBusy[e.id] ? '…' : '✓ Approuver'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Verification requests ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            🛡️ Demandes de vérification ({verifRequests.length})
          </p>
          <button onClick={refreshVerif} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem' }}>↻</button>
        </div>

        {/* Deny modal */}
        {denyTarget && (
          <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 8, color: 'var(--danger)' }}>Motif du refus *</p>
            <textarea
              style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              rows={3} placeholder="Expliquez pourquoi la demande est refusée…"
              value={denyReason} onChange={e => setDenyReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { setDenyTarget(null); setDenyReason('') }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 0', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem' }}>Annuler</button>
              <button onClick={handleDeny} disabled={!denyReason.trim()} style={{ flex: 2, background: 'rgba(239,68,68,.2)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 8, padding: '7px 0', color: 'var(--danger)', cursor: denyReason.trim() ? 'pointer' : 'not-allowed', fontSize: '0.82rem', fontWeight: 600, opacity: denyReason.trim() ? 1 : 0.5 }}>Confirmer le refus</button>
            </div>
          </div>
        )}

        {verifRequests.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Aucune demande de vérification en attente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {verifRequests.map(r => (
              <div key={r.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.profiles?.name} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.75rem' }}>#{String(r.profiles?.user_number || '').padStart(6,'0')}</span></div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{r.profiles?.email}</div>
                    <a href={r.id_card_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple3)', fontSize: '0.75rem', marginTop: 4, display: 'inline-block' }}>📄 Voir le document →</a>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      disabled={verifBusy[r.user_id]}
                      onClick={() => { setDenyTarget(r.user_id); setDenyReason('') }}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', opacity: verifBusy[r.user_id] ? 0.5 : 1 }}
                    >✗ Refuser</button>
                    <button
                      disabled={verifBusy[r.user_id]}
                      onClick={() => handleApprove(r.user_id)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: 'var(--success)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: verifBusy[r.user_id] ? 0.5 : 1 }}
                    >{verifBusy[r.user_id] ? '…' : '✓ Approuver'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── City requests ── */}
      <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            🌍 Demandes de ville ({cityRequests.length})
          </p>
          <button onClick={() => onLoadCityRequests?.().then(setCityRequests)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem' }}>↻</button>
        </div>
        {cityRequests.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Aucune demande de ville en attente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cityRequests.map(r => (
              <div key={r.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🌍 {r.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                    Demandé par {r.profiles?.name || r.profiles?.email || 'Inconnu'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    disabled={cityBusy[r.id]}
                    onClick={async () => {
                      setCityBusy(b => ({ ...b, [r.id]: true }))
                      const ok = await onDenyCityRequest?.(r.id)
                      setCityBusy(b => ({ ...b, [r.id]: false }))
                      if (ok) setCityRequests(prev => prev.filter(x => x.id !== r.id))
                    }}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >✗ Refuser</button>
                  <button
                    disabled={cityBusy[r.id]}
                    onClick={async () => {
                      setCityBusy(b => ({ ...b, [r.id]: true }))
                      const ok = await onApproveCityRequest?.(r.id, r.name)
                      setCityBusy(b => ({ ...b, [r.id]: false }))
                      if (ok) setCityRequests(prev => prev.filter(x => x.id !== r.id))
                    }}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: 'var(--success)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >{cityBusy[r.id] ? '…' : '✓ Approuver'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Organizer applications ── */}
      <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            🎤 Demandes organisateur ({applications?.length || 0})
          </p>
          <button onClick={onRefresh} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem' }}>↻ Actualiser</button>
        </div>
        {!applications?.length ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Aucune demande en attente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applications.map(a => (
              <div key={a.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.userName}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{a.userEmail}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{new Date(a.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button disabled={busy[a.id]} onClick={() => act(a.id, () => onReject(a.id))} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.78rem', opacity: busy[a.id] ? 0.5 : 1 }}>Refuser</button>
                    <button disabled={busy[a.id]} onClick={() => act(a.id, () => onPromote(a.userId, a.id))} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: 'var(--success)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, opacity: busy[a.id] ? 0.5 : 1 }}>
                      {busy[a.id] ? '…' : '✓ Approuver'}
                    </button>
                  </div>
                </div>
                {a.reason && <p style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text)', background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>"{a.reason}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
