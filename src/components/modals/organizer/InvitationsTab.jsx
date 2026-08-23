import { useState, useEffect } from 'react'
import { inputStyle, labelStyle, groupStyle } from './shared.jsx'

export function InvitationsTab({ myEvents, onInvite, onLoadInvitations, toast }) {
  const [selectedId,   setSelectedId]   = useState(myEvents[0]?.id ?? '')
  const [email,        setEmail]        = useState('')
  const [invitations,  setInvitations]  = useState([])
  const [loading,      setLoading]      = useState(false)
  const [copied,       setCopied]       = useState(null)

  const selectedEvent = myEvents.find(e => e.id === selectedId)

  const load = async (id) => {
    if (!id) return
    const list = await onLoadInvitations(id)
    setInvitations(list)
  }

  const handleSelect = (id) => { setSelectedId(id); load(id) }

  // Load on mount
  useEffect(() => { if (selectedId) load(selectedId) }, [])

  const invite = async () => {
    if (!email.trim() || !selectedId) return
    setLoading(true)
    const result = await onInvite(
      selectedId, email,
      selectedEvent?.title, selectedEvent?.date, selectedEvent?.city
    )
    setLoading(false)
    if (result?.ok) {
      toast?.('Invitation envoyée ✓', 'success')
      setEmail('')
      load(selectedId)
    } else {
      toast?.(result?.error || 'Erreur lors de l\'envoi', 'error')
    }
  }

  const copyLink = (token) => {
    const url = `${window.location.origin}/?invite=${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const privateEvents = myEvents.filter(e => e.isPrivate)

  return (
    <div>
      {!myEvents.length ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>Créez d'abord un événement.</p>
      ) : (
        <>
          <div style={groupStyle}>
            <label style={labelStyle}>Événement</label>
            <select style={inputStyle} value={selectedId} onChange={e => handleSelect(e.target.value)}>
              {myEvents.map(e => (
                <option key={e.id} value={e.id}>{e.isPrivate ? '🔒 ' : ''}{e.title}</option>
              ))}
            </select>
            {selectedEvent && !selectedEvent.isPrivate && (
              <p style={{ color: 'var(--orange)', fontSize: '0.78rem', marginTop: 6 }}>⚠️ Cet événement est public. Les invitations fonctionnent mais tout le monde peut y accéder.</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && invite()}
            />
            <button
              onClick={invite}
              disabled={loading || !email.trim()}
              style={{ flexShrink: 0, background: 'linear-gradient(135deg, var(--purple), var(--purple2))', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '…' : '✉️ Inviter'}
            </button>
          </div>

          {invitations.length > 0 && (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invitations.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                      <div style={{ fontSize: '0.72rem', color: inv.status === 'accepted' ? 'var(--success)' : inv.status === 'declined' ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>
                        {inv.status === 'accepted' ? '✓ Accepté' : inv.status === 'declined' ? '✗ Décliné' : '⏳ En attente'}
                      </div>
                    </div>
                    <button
                      onClick={() => copyLink(inv.token)}
                      style={{ flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', color: copied === inv.token ? 'var(--success)' : 'var(--muted)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', transition: 'all .2s' }}
                    >
                      {copied === inv.token ? '✓ Copié' : '🔗 Lien'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {invitations.length === 0 && selectedId && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              Aucune invitation envoyée pour cet événement.
            </p>
          )}
        </>
      )}
    </div>
  )
}
