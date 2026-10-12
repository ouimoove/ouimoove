import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Spinner, styles as s } from '../components/ui.jsx'
import { firstWord } from '../lib/basics.js'

const ROLE = {
  partner: { fr: 'partenaire', en: 'partner' },
  planner: { fr: 'organisateur·rice', en: 'planner' },
  viewer: { fr: 'proche (lecture seule)', en: 'family / friend (read only)' },
}

// /mariage/invitation/<token>: join a wedding someone shared with you.
export function AcceptInvite({ token }) {
  const { tx, L } = useI18n()
  const { user, reloadList, select } = useWedding()
  const { openAuth, go } = useUI()
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) { setInfo({ ok: false, error: 'invalid' }); return }
    supabase.rpc('get_wedding_invite', { p_token: token })
      .then(({ data, error: e }) => setInfo(e ? { ok: false, error: 'network' } : data))
      .catch(() => setInfo({ ok: false, error: 'network' }))
  }, [token])

  const accept = async () => {
    setBusy(true); setError('')
    const { data, error: e } = await supabase.rpc('accept_wedding_invite', { p_token: token })
    setBusy(false)
    if (e || !data?.ok) {
      const code = data?.error
      setError(code === 'email_mismatch'
        ? tx(`Cette invitation a été envoyée à ${data.email_hint}. Connectez-vous avec cet email.`, `This invite was sent to ${data.email_hint}. Sign in with that email.`)
        : code === 'already_used' ? tx('Cette invitation a déjà été utilisée par un autre compte.', 'This invite has already been used by another account.')
          : tx("L'invitation n'a pas pu être acceptée.", "The invite couldn't be accepted."))
      return
    }
    await reloadList()
    select(data.wedding_id)
    go('')
  }

  if (!info) return <Spinner />
  const names = info.ok ? `${firstWord(info.groom_name)} & ${firstWord(info.bride_name)}` : ''
  return (
    <div className={s.wizard}>
      <Card>
        {!info.ok ? (
          <div className={s.stack}>
            <h1 className={s.wizQ}>{tx('Invitation introuvable', 'Invite not found')}</h1>
            <p className={s.muted}>{info.error === 'network' ? tx('Vérifiez votre connexion et réessayez.', 'Check your connection and try again.') : tx('Le lien est incorrect ou a été supprimé. Demandez un nouveau lien.', 'The link is wrong or was removed. Ask for a new link.')}</p>
            <Btn variant="ghost" onClick={() => go('')}>Ouimoove Weddings</Btn>
          </div>
        ) : (
          <div className={s.stack}>
            <div className={s.tiny + ' ' + s.muted} style={{ letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700 }}>{tx('Invitation', 'Invitation')}</div>
            <h1 className={s.wizQ}>{tx(`Préparez le mariage de ${names}`, `Help plan ${names}'s wedding`)}</h1>
            <p className={s.muted}>{tx(`Vous êtes invité·e comme ${L(ROLE[info.role])}. Connectez-vous avec ${info.email_hint} pour rejoindre.`, `You are invited as ${L(ROLE[info.role])}. Sign in with ${info.email_hint} to join.`)}</p>
            {error && <p className={s.small} style={{ color: 'var(--w-bad)' }}>{error}</p>}
            {user ? (
              <div className={s.rowWrap}>
                <Btn variant="primary" disabled={busy} onClick={accept}>{busy ? '…' : tx('Rejoindre ce mariage', 'Join this wedding')}</Btn>
                <span className={s.small + ' ' + s.muted}>{tx(`Connecté·e : ${user.email}`, `Signed in: ${user.email}`)}</span>
              </div>
            ) : (
              <div className={s.rowWrap}>
                <Btn variant="primary" onClick={() => openAuth('login')}>{tx('Se connecter', 'Sign in')}</Btn>
                <Btn variant="ghost" onClick={() => openAuth('signup')}>{tx('Créer un compte', 'Create an account')}</Btn>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
