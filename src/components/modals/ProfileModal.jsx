import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import styles from './ProfileModal.module.css'
import { Icon } from '../Icon.jsx'

export function ProfileModal({
  open, user, userNumber, isVerified, isOrganizer,
  onClose, onSave, onLogout, onApply,
  onSubscribePush, onUnsubscribePush,
  onSubmitVerification, onLoadVerificationStatus,
  onDeleteAccount,
}) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [pwd, setPwd]           = useState('')
  const [error, setError]       = useState('')
  const [applyReason, setApplyReason] = useState('')
  const [applyStatus, setApplyStatus] = useState(null)
  const [applyMsg, setApplyMsg] = useState('')
  const [pushState, setPushState] = useState('unknown')

  // Verification
  const [verifStatus,  setVerifStatus]  = useState(null) // null | 'pending' | 'approved' | 'denied'
  const [denialReason, setDenialReason] = useState('')
  const [verifLoading, setVerifLoading] = useState(false)
  const [verifFile,    setVerifFile]    = useState(null)

  useEffect(() => {
    if ('Notification' in window) setPushState(Notification.permission)
  }, [open])

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPwd('')
      setError('')
      setApplyReason('')
      setApplyStatus(null)
      setApplyMsg('')
      setVerifFile(null)
      // Load verification status
      onLoadVerificationStatus?.().then(data => {
        setVerifStatus(data?.status || null)
        setDenialReason(data?.denial_reason || '')
      })
    }
  }, [user, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const save = () => {
    if (!name.trim() || !email.trim()) { setError('Le nom et l\'email sont requis.'); return }
    setError('')
    onSave(name.trim(), email.trim(), pwd || undefined)
  }

  const submitApply = async () => {
    if (!applyReason.trim()) { setApplyMsg('Expliquez brièvement votre projet.'); setApplyStatus('error'); return }
    setApplyStatus('loading')
    const result = await onApply(applyReason.trim())
    if (result?.ok) { setApplyStatus('ok'); setApplyMsg('Demande envoyée ! Nous reviendrons vers vous.') }
    else { setApplyStatus('error'); setApplyMsg(result?.error || 'Erreur lors de l\'envoi.') }
  }

  const submitVerif = async () => {
    if (!verifFile) return
    setVerifLoading(true)
    const result = await onSubmitVerification?.(verifFile)
    setVerifLoading(false)
    if (result?.ok) { setVerifStatus('pending'); setVerifFile(null) }
    else alert(result?.error || 'Erreur lors de l\'envoi.')
  }

  const sectionStyle = { marginTop: 18, padding: '18px 20px', background: 'var(--cream)', borderRadius: 24 }
  const sectionTitle = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.08rem', color: 'var(--plum)', marginBottom: 6 }
  const sectionSub   = { color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: 12 }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Mon Profil" />
      <ModalBody>
        {/* Avatar + user number + verified badge */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{initials}</div>
          {user.isGoogle && <div className={styles.googleTag}>via Google</div>}
        </div>

        {/* User ID + verified badge */}
        <div className={styles.metaRow}>
          {userNumber && (
            <span className={styles.idChip}>
              #{String(userNumber).padStart(6, '0')}
            </span>
          )}
          {isVerified ? (
            <span className={styles.verifiedChip}>
              <Icon name="check" /> Compte vérifié
            </span>
          ) : (
            <span className={styles.unverifiedChip}>
              Non vérifié
            </span>
          )}
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Nom complet</label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Nouveau mot de passe <span className={styles.optional}>(laisser vide pour ne pas changer)</span></label>
          <input className={styles.input} type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.saveBtn} onClick={save}>Sauvegarder les modifications</button>

        {/* ── Verification section ── */}
        {!isVerified && (
          <div style={sectionStyle}>
            <p style={sectionTitle}><Icon name="shield" /> Obtenir le badge Vérifié</p>

            {verifStatus === 'pending' && (
              <div style={{ background: 'rgba(244,154,14,.1)', border: '1px solid rgba(244,154,14,.3)', borderRadius: 16, padding: '12px 14px' }}>
                <p style={{ color: 'var(--orange)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}><Icon name="hourglass" /> Vérification en cours</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '4px 0 0' }}>Votre document est en cours d'examen. Nous vous notifierons dès qu'une décision sera prise.</p>
              </div>
            )}

            {verifStatus === 'denied' && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 16, padding: '12px 14px', marginBottom: 12 }}>
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>✗ Demande refusée</p>
                {denialReason && <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '6px 0 0', lineHeight: 1.5 }}>Raison : {denialReason}</p>}
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '8px 0 0' }}>Vous pouvez soumettre un nouveau document ci-dessous.</p>
              </div>
            )}

            {(verifStatus === null || verifStatus === 'denied') && (
              <>
                <p style={sectionSub}>
                  Téléchargez une pièce d'identité (CNI, passeport ou permis de conduire) pour obtenir le badge ✓ Vérifié sur votre profil.
                </p>
                <label style={{ display: 'block', background: verifFile ? 'rgba(139,34,118,.08)' : '#fff', border: `2px dashed ${verifFile ? 'var(--purple)' : '#e4d3df'}`, borderRadius: 16, padding: '14px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                  <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setVerifFile(e.target.files?.[0] || null)} />
                  {verifFile
                    ? <span style={{ color: 'var(--purple3)', fontSize: '0.85rem', fontWeight: 600 }}><Icon name="file" /> {verifFile.name}</span>
                    : <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}><Icon name="clip" /> Cliquez pour sélectionner votre document</span>
                  }
                </label>
                <button
                  onClick={submitVerif}
                  disabled={!verifFile || verifLoading}
                  style={{ marginTop: 10, width: '100%', background: 'var(--purple)', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 0', fontSize: '0.92rem', fontWeight: 700, cursor: (!verifFile || verifLoading) ? 'not-allowed' : 'pointer', opacity: (!verifFile || verifLoading) ? 0.6 : 1 }}
                >
                  {verifLoading ? 'Envoi…' : 'Soumettre pour vérification'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Become organizer ── */}
        {!isOrganizer && onApply && (
          <div style={sectionStyle}>
            <p style={sectionTitle}><Icon name="mic" /> Devenir organisateur</p>
            <p style={sectionSub}>Vous souhaitez créer et gérer vos propres événements ? Soumettez une demande.</p>
            {applyStatus === 'ok' ? (
              <p style={{ color: 'var(--success)', fontSize: '0.82rem' }}>✓ {applyMsg}</p>
            ) : (
              <>
                <textarea
                  style={{ width: '100%', background: '#fff', border: '2px solid #e4d3df', borderRadius: 16, padding: '11px 14px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  rows={3}
                  placeholder="Décrivez votre projet (type d'événements, ville, fréquence…)"
                  value={applyReason}
                  onChange={e => setApplyReason(e.target.value)}
                />
                {applyStatus === 'error' && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4 }}>{applyMsg}</p>}
                <button
                  onClick={submitApply}
                  disabled={applyStatus === 'loading'}
                  style={{ marginTop: 8, width: '100%', background: 'var(--orange)', color: 'var(--plum)', border: 'none', borderRadius: 999, padding: '12px 0', fontSize: '0.92rem', fontWeight: 700, cursor: applyStatus === 'loading' ? 'not-allowed' : 'pointer', opacity: applyStatus === 'loading' ? 0.7 : 1 }}
                >
                  {applyStatus === 'loading' ? 'Envoi…' : 'Envoyer la demande'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Push notifications ── */}
        {'Notification' in window && pushState !== 'denied' && (
          <div style={sectionStyle}>
            <p style={sectionTitle}><Icon name="bell" /> Notifications push</p>
            <p style={sectionSub}>
              {pushState === 'granted' ? 'Vous recevez des notifications pour vos achats et événements.' : 'Activez les notifications pour recevoir vos confirmations de billets.'}
            </p>
            <button
              disabled={pushState === 'loading'}
              onClick={async () => {
                if (pushState === 'granted') { setPushState('loading'); await onUnsubscribePush?.(); setPushState('default') }
                else { setPushState('loading'); const ok = await onSubscribePush?.(); setPushState(ok ? 'granted' : (Notification.permission === 'denied' ? 'denied' : 'default')) }
              }}
              style={{ width: '100%', border: 0, borderRadius: 999, padding: '12px 0', fontSize: '0.92rem', fontWeight: 700, cursor: pushState === 'loading' ? 'not-allowed' : 'pointer', background: pushState === 'granted' ? 'rgba(239,68,68,.1)' : 'var(--purple)', color: pushState === 'granted' ? 'var(--danger)' : '#fff', opacity: pushState === 'loading' ? 0.6 : 1 }}
            >
              {pushState === 'loading' ? '…' : pushState === 'granted' ? 'Désactiver les notifications' : 'Activer les notifications'}
            </button>
          </div>
        )}

        <button className={styles.logoutBtn} onClick={onLogout}>Se déconnecter</button>
        {onDeleteAccount && (
          <button
            onClick={onDeleteAccount}
            style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1.5px solid rgba(226,61,61,.35)', color: 'var(--danger)', borderRadius: 999, padding: '12px 0', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Icon name="trash" /> Supprimer mon compte
          </button>
        )}
      </ModalBody>
    </Modal>
  )
}
