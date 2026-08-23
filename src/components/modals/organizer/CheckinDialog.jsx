import { useState } from 'react'

// Bottom-sheet confirm dialog used by AttendeesTab after a scan/lookup.
export function CheckinDialog({ order, eventId, onConfirm, onClose }) {
  const items    = order.items.filter(i => !eventId || i.eventId === eventId)
  const item     = items[0]
  const remaining = item ? item.qty - (item.checkedInCount || 0) : 0
  const [count, setCount] = useState(remaining > 0 ? 1 : 0)
  const [busy,  setBusy]  = useState(false)
  const [done,  setDone]  = useState(null)

  const confirm = async () => {
    setBusy(true)
    const result = await onConfirm(item.id, count)
    setBusy(false)
    if (result.ok) setDone(result)
    else setDone({ error: result.error })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg2)', borderRadius: '24px 24px 0 0',
        padding: '28px 24px 40px', width: '100%', maxWidth: 480,
        border: '1px solid var(--border)', borderBottom: 'none',
      }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {done.error ? (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</div>
                <div style={{ color: 'var(--danger)', fontWeight: 700 }}>{done.error}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)', marginBottom: 6 }}>
                  {done.validated} billet{done.validated > 1 ? 's' : ''} validé{done.validated > 1 ? 's' : ''} !
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {order.userName} · {done.newCount}/{item.qty} utilisé{done.newCount > 1 ? 's' : ''}
                </div>
              </>
            )}
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 32px', borderRadius: 12, border: 'none', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
              Fermer
            </button>
          </div>
        ) : remaining <= 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, color: 'var(--orange)', marginBottom: 6 }}>Billet déjà entièrement utilisé</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{order.userName} · {item?.qty}/{item?.qty} billets validés</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 32px', borderRadius: 12, border: 'none', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Fermer</button>
          </div>
        ) : (
          <>
            {/* Holder info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple), var(--orange))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                {(order.userName || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.userName || 'Anonyme'}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{item?.ticketName} · {item?.qty} billet{item?.qty > 1 ? 's' : ''} achetés</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '12px 16px', marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}>
                <span>Billets utilisés</span>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{item.checkedInCount || 0} / {item.qty}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((item.checkedInCount || 0) / item.qty) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--success))', borderRadius: 4 }} />
              </div>
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                {remaining} billet{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
              </div>
            </div>

            {/* Count selector */}
            {item.qty > 1 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 10 }}>Combien de billets valider ?</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setCount(c => Math.max(1, c - 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer' }}>−</button>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>{count}</div>
                  <button onClick={() => setCount(c => Math.min(remaining, c + 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {Array.from({ length: remaining }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setCount(n)} style={{ padding: '4px 12px', borderRadius: 8, border: `1px solid ${count === n ? 'var(--purple)' : 'var(--border)'}`, background: count === n ? 'rgba(139,34,118,.15)' : 'var(--bg3)', color: count === n ? 'var(--purple3)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: count === n ? 700 : 400 }}>
                      {n === remaining ? `Tous (${n})` : n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={confirm} disabled={busy} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
              color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(139,34,118,.35)', opacity: busy ? 0.7 : 1,
            }}>
              {busy ? 'Validation…' : `✓ Valider ${count} billet${count > 1 ? 's' : ''}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
