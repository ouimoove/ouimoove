import { useState } from 'react'
import { PUBLIC_URL } from '../../utils/helpers.js'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, ConfirmBtn, Field, Input, PageHead, Select, copyText, styles as s } from '../components/ui.jsx'
import { CULTURES, REGIONS } from '../data/cultures.js'
import { COUNTRIES, COUNTRY_BY_CODE, CURRENCIES } from '../data/templates.js'
import { coupleNames } from '../lib/basics.js'
import { navigate } from '../router.js'
import { Icon } from '../../components/Icon.jsx'

const ROLES = {
  partner: { fr: 'Partenaire (modifie tout)', en: 'Partner (can edit everything)' },
  planner: { fr: 'Organisateur·rice (modifie tout)', en: 'Planner (can edit everything)' },
  viewer: { fr: 'Famille / proche (lecture seule)', en: 'Family / friend (read only)' },
}

export function Settings() {
  const { tx, L } = useI18n()
  const { wedding, rows, role, canEdit, isLocal, user, updateWedding, deleteWedding, add, update, remove, reloadList } = useWedding()
  const { toast, openAuth, go } = useUI()
  const [f, setF] = useState(() => ({
    groom_name: wedding.groom_name || '', bride_name: wedding.bride_name || '', family_name: wedding.family_name || '',
    groom_culture: wedding.groom_culture || '', bride_culture: wedding.bride_culture || '', country: wedding.country || 'TG',
    city: wedding.city || '', currency: wedding.currency || 'XOF', lang: wedding.lang || 'fr',
  }))
  const [invite, setInvite] = useState({ email: '', role: 'partner' })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const dirty = Object.keys(f).some((k) => (f[k] || '') !== (wedding[k] || (k === 'country' ? 'TG' : k === 'currency' ? 'XOF' : k === 'lang' ? 'fr' : '')))

  const save = async (e) => {
    e.preventDefault()
    const ok = await updateWedding({
      groom_name: f.groom_name.trim().slice(0, 80), bride_name: f.bride_name.trim().slice(0, 80), family_name: f.family_name.trim() || null,
      groom_culture: f.groom_culture || null, bride_culture: f.bride_culture || null, country: f.country || null,
      city: f.city.trim() || null, currency: f.currency, lang: f.lang,
    })
    if (ok) toast(tx('Enregistré ✓', 'Saved ✓'), 'success')
  }
  const inviteLink = (m) => `${PUBLIC_URL}/mariage/invitation/${m.invite_token}`
  const sendInvite = async (e) => {
    e.preventDefault()
    const email = invite.email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast(tx('Entrez un email valide.', 'Enter a valid email.'), 'error'); return }
    if (rows.members.some((m) => m.email === email)) { toast(tx('Cette personne est déjà invitée.', 'This person is already invited.'), 'info'); return }
    const saved = await add('members', { email, role: invite.role })
    if (saved?.[0]) {
      setInvite({ email: '', role: invite.role })
      toast(tx('Invitation créée : envoyez le lien.', 'Invite created: send the link.'), 'success')
    }
  }
  const shareInvite = (m) => {
    const text = tx(
      `${coupleNames(wedding)} : je t'invite à préparer notre mariage avec moi sur Ouimoove Weddings. Connecte-toi avec ${m.email} : ${inviteLink(m)}`,
      `${coupleNames(wedding)}: join me to plan our wedding on Ouimoove Weddings. Sign in with ${m.email}: ${inviteLink(m)}`,
    )
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }
  const leave = async () => {
    const me = rows.members.find((m) => m.user_id === user?.id)
    if (me && await remove('members', me.id)) { await reloadList(); go('') }
  }

  const cultureOptions = (
    <>
      <option value="">—</option>
      {REGIONS.map((r) => <optgroup key={r.id} label={L(r)}>{CULTURES.filter((c) => c.region === r.id).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}</optgroup>)}
    </>
  )

  return (
    <>
      <PageHead title={tx('Réglages', 'Settings')} />

      <Card title={tx('Le couple', 'The couple')}>
        <form className={s.stack} onSubmit={save}>
          <fieldset disabled={!canEdit} className={s.stack} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className={s.formGrid}>
              <Field label={tx('Prénom du marié', "Groom's first name")}><Input value={f.groom_name} maxLength={80} onChange={(e) => set({ groom_name: e.target.value })} /></Field>
              <Field label={tx('Prénom de la mariée', "Bride's first name")}><Input value={f.bride_name} maxLength={80} onChange={(e) => set({ bride_name: e.target.value })} /></Field>
              <Field label={tx('Nom de famille', 'Family name')}><Input value={f.family_name} maxLength={80} onChange={(e) => set({ family_name: e.target.value })} /></Field>
              <Field label={tx('Culture de la famille du marié', "Groom's family culture")}><Select value={f.groom_culture} onChange={(e) => set({ groom_culture: e.target.value })}>{cultureOptions}</Select></Field>
              <Field label={tx('Culture de la famille de la mariée', "Bride's family culture")}><Select value={f.bride_culture} onChange={(e) => set({ bride_culture: e.target.value })}>{cultureOptions}</Select></Field>
              <Field label={tx('Pays', 'Country')}><Select value={f.country} onChange={(e) => set({ country: e.target.value })}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{L(c)}</option>)}</Select></Field>
              <Field label={tx('Ville', 'City')}><Input value={f.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} /></Field>
              <Field label={tx('Devise', 'Currency')}><Select value={f.currency} onChange={(e) => set({ currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
            </div>
            {f.country && COUNTRY_BY_CODE[f.country] && COUNTRY_BY_CODE[f.country].currency !== f.currency && (
              <p className={s.tiny + ' ' + s.muted}>{tx(`La devise habituelle ici est ${COUNTRY_BY_CODE[f.country].currency}. Changer de devise ne convertit pas les montants.`, `The usual currency here is ${COUNTRY_BY_CODE[f.country].currency}. Changing currency does not convert amounts.`)}</p>
            )}
          </fieldset>
          {canEdit && <div><Btn type="submit" variant="primary" disabled={!dirty}>{tx('Enregistrer', 'Save')}</Btn></div>}
        </form>
      </Card>

      <Card title={tx('Planifier à plusieurs', 'Plan together')} sub={tx('Invitez votre partenaire, votre wedding planner ou un proche. Chacun se connecte avec son propre compte Ouimoove.', 'Invite your partner, your wedding planner or a relative. Everyone signs in with their own Ouimoove account.')}>
        {isLocal ? (
          <div className={s.spread}>
            <span className={s.small + ' ' + s.muted}>{tx('Créez un compte pour inviter des personnes.', 'Create an account to invite people.')}</span>
            <Btn variant="primary" onClick={() => openAuth('signup', tx('Votre plan sera ajouté à votre compte.', 'Your plan will be added to your account.'))}>{tx('Créer un compte', 'Create an account')}</Btn>
          </div>
        ) : (
          <div className={s.stack}>
            <div>
              {rows.members.length === 0 && <p className={s.small + ' ' + s.muted}>{tx('Personne pour le moment.', 'Nobody yet.')}</p>}
              {rows.members.map((m) => (
                <div key={m.id} className={s.memberRow}>
                  <span className={s.avatar}>{m.email.slice(0, 1).toUpperCase()}</span>
                  <div className={s.grow}>
                    <div className={s.strong + ' ' + s.ellipsis}>{m.email}</div>
                    <div className={s.tiny + ' ' + s.muted}>{L(ROLES[m.role])}</div>
                  </div>
                  <Chip tone={m.status === 'accepted' ? 'good' : 'info'}>{m.status === 'accepted' ? tx('A rejoint', 'Joined') : tx('Invitation envoyée', 'Invited')}</Chip>
                  {m.status === 'pending' && m.invite_token && (role === 'owner' || role === 'partner') && (
                    <>
                      <Btn size="sm" variant="ghost" onClick={() => shareInvite(m)}><Icon name="chat" /> WhatsApp</Btn>
                      <Btn size="sm" variant="subtle" onClick={() => copyText(inviteLink(m), toast, tx)}>{tx('Copier le lien', 'Copy link')}</Btn>
                    </>
                  )}
                  {(role === 'owner' || role === 'partner') && (
                    <>
                      <Select value={m.role} onChange={(e) => update('members', m.id, { role: e.target.value })} style={{ width: 'auto', padding: '6px 8px' }} aria-label={tx('Rôle', 'Role')}>
                        {Object.entries(ROLES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                      </Select>
                      <ConfirmBtn onConfirm={() => remove('members', m.id)}>{tx('Retirer', 'Remove')}</ConfirmBtn>
                    </>
                  )}
                </div>
              ))}
            </div>
            {(role === 'owner' || role === 'partner') && (
              <form className={s.rowWrap} style={{ alignItems: 'flex-end' }} onSubmit={sendInvite}>
                <Field label="Email" className={s.growWide}><Input type="email" value={invite.email} maxLength={200} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="keli@email.com" /></Field>
                <Field label={tx('Rôle', 'Role')}><Select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>{Object.entries(ROLES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select></Field>
                <Btn type="submit" variant="primary">{tx('Inviter', 'Invite')}</Btn>
              </form>
            )}
            <p className={s.tiny + ' ' + s.muted}>{tx("La personne invitée doit se connecter avec exactement cet email pour rejoindre le mariage.", 'The invited person must sign in with exactly that email to join the wedding.')}</p>
          </div>
        )}
      </Card>

      <Card title={tx('Zone sensible', 'Danger zone')}>
        <div className={s.stack}>
          {role !== 'owner' && !isLocal ? (
            <div className={s.spread}>
              <span className={s.small}>{tx('Quitter ce mariage : vous ne le verrez plus.', 'Leave this wedding: you will no longer see it.')}</span>
              <ConfirmBtn onConfirm={leave}>{tx('Quitter', 'Leave')}</ConfirmBtn>
            </div>
          ) : (
            <div className={s.spread}>
              <span className={s.small}>{tx('Supprimer ce mariage et toutes ses données (invités, budget, site…). Définitif.', 'Delete this wedding and all its data (guests, budget, website…). Permanent.')}</span>
              <ConfirmBtn onConfirm={async () => { if (await deleteWedding()) { toast(tx('Mariage supprimé.', 'Wedding deleted.'), 'info'); navigate('/mariage') } }} confirmLabel={tx('Supprimer définitivement ?', 'Delete permanently?')}>{tx('Supprimer le mariage', 'Delete the wedding')}</ConfirmBtn>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
