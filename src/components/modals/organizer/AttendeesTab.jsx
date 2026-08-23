import { useState } from 'react'
import { QRScanner } from '../../QRScanner.jsx'
import { Spinner, ErrorBanner, inputStyle } from './shared.jsx'
import { CheckinDialog } from './CheckinDialog.jsx'

export function AttendeesTab({ myEvents, organizerOrders, onCheckin, onCheckinByRef, onCheckinPartial, onLookupByRef, onRefund, loading, errors, onRefresh }) {
  const [selectedId,  setSelectedId]  = useState(myEvents[0]?.id ?? '')
  const [search,      setSearch]      = useState('')
  const [scanRef,     setScanRef]     = useState('')
  const [scanResult,  setScanResult]  = useState(null)
  const [scanning,    setScanning]    = useState(false)
  const [showCamera,  setShowCamera]  = useState(false)
  const [confirmOrder, setConfirmOrder] = useState(null)

  const attendees = organizerOrders.filter(p => p.items.some(i => i.eventId === selectedId))
  const filtered  = search.trim()
    ? attendees.filter(p =>
        p.userName.toLowerCase().includes(search.toLowerCase()) ||
        p.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().startsWith(search.toLowerCase()))
    : attendees

  const totalTickets   = attendees.reduce((s, p) => s + p.items.filter(i => i.eventId === selectedId).reduce((ss, i) => ss + i.qty, 0), 0)
  const validatedCount = attendees.reduce((s, p) => s + p.items.filter(i => i.eventId === selectedId).reduce((ss, i) => ss + (i.checkedInCount || 0), 0), 0)
  const pct = totalTickets > 0 ? Math.round((validatedCount / totalTickets) * 100) : 0

  const handleManualScan = async () => {
    if (!scanRef.trim()) return
    setScanning(true)
    setScanResult(null)
    const order = onLookupByRef(scanRef.trim())
    setScanning(false)
    if (!order) { setScanResult({ error: 'Référence introuvable.' }); return }
    setScanRef('')
    setConfirmOrder(order)
  }

  const handleCameraScan = (data) => {
    setShowCamera(false)
    const order = onLookupByRef(data)
    if (!order) { setScanResult({ error: 'Billet non reconnu ou non lié à cet événement.' }); return }
    setConfirmOrder(order)
  }

  if (loading.orgOrders) return <Spinner />

  return (
    <div>
      {/* ── Camera scanner fullscreen ── */}
      {showCamera && <QRScanner onScan={handleCameraScan} onClose={() => setShowCamera(false)} />}

      {/* ── Confirm dialog ── */}
      {confirmOrder && (
        <CheckinDialog
          order={confirmOrder}
          eventId={selectedId}
          onConfirm={onCheckinPartial}
          onClose={() => { setConfirmOrder(null); setScanResult(null) }}
        />
      )}

      {/* ── Scan buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setShowCamera(true)}
          style={{
            flex: 1, padding: '13px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(139,34,118,.3)',
          }}
        >
          📷 Scanner un billet
        </button>
      </div>

      {/* ── Manual ref lookup ── */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 8 }}>Ou saisir la référence manuellement</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.88rem' }}
            placeholder="Ex: A3F7B2C1"
            value={scanRef}
            onChange={e => { setScanRef(e.target.value.toUpperCase()); setScanResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleManualScan()}
          />
          <button
            onClick={handleManualScan}
            disabled={scanning || !scanRef.trim()}
            style={{ padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', opacity: scanning || !scanRef.trim() ? 0.5 : 1 }}
          >
            {scanning ? '…' : 'Chercher'}
          </button>
        </div>
        {scanResult?.error && (
          <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: '0.82rem' }}>❌ {scanResult.error}</div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {totalTickets > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6 }}>
            <span><b style={{ color: 'var(--success)' }}>{validatedCount}</b> / {totalTickets} billets validés</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--success))', borderRadius: 4, transition: 'width .4s' }} />
          </div>
        </div>
      )}

      {/* ── Event + search filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select style={{ ...inputStyle, flex: 2, minWidth: 140 }} value={selectedId} onChange={e => { setSelectedId(e.target.value); setScanResult(null) }}>
          {myEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          {!myEvents.length && <option value="">Aucun événement</option>}
        </select>
        <input style={{ ...inputStyle, flex: 2, minWidth: 140 }} placeholder="Nom, email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {errors.orgOrders && <ErrorBanner msg={errors.orgOrders} onRetry={onRefresh} />}

      {/* ── Attendee list ── */}
      {!filtered.length ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
          {search ? 'Aucun résultat.' : 'Aucun participant pour cet événement.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(p => {
            const eventItems   = p.items.filter(i => i.eventId === selectedId)
            const totalQty     = eventItems.reduce((s, i) => s + i.qty, 0)
            const validatedQty = eventItems.reduce((s, i) => s + (i.checkedInCount || 0), 0)
            const fullyIn      = validatedQty >= totalQty && totalQty > 0
            const partialIn    = validatedQty > 0 && !fullyIn
            const isRefunded   = p.status === 'refunded'

            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                opacity: isRefunded ? 0.55 : 1,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: isRefunded ? 'var(--bg3)' : fullyIn ? 'rgba(34,197,94,.2)' : 'linear-gradient(135deg, var(--purple), var(--orange))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', border: fullyIn ? '2px solid var(--success)' : 'none' }}>
                  {fullyIn ? '✓' : (p.userName || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.userName || 'Anonyme'}
                    {isRefunded && <span style={{ color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 400, marginLeft: 6 }}>remboursé</span>}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                    {eventItems.map(i => `${i.ticketName}×${i.qty}`).join(', ')}
                    {' · '}
                    <span style={{ color: fullyIn ? 'var(--success)' : partialIn ? 'var(--orange)' : 'var(--muted)', fontWeight: 600 }}>
                      {validatedQty}/{totalQty} validé{validatedQty !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!isRefunded && !fullyIn && (
                    <button
                      onClick={() => setConfirmOrder(p)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: partialIn ? 'rgba(244,154,14,.15)' : 'transparent', color: partialIn ? 'var(--orange)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      {partialIn ? `+Valider` : 'Valider'}
                    </button>
                  )}
                  {fullyIn && <span style={{ fontSize: '0.75rem', color: 'var(--success)', padding: '5px 6px', fontWeight: 700 }}>✓ Complet</span>}
                  {!isRefunded && (
                    <button
                      onClick={() => { if (window.confirm(`Rembourser ${p.userName} ?`)) onRefund(p.id) }}
                      style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      ↩
                    </button>
                  )}
                  {isRefunded && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '5px 10px' }}>Remboursé</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
