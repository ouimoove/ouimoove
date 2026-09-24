import { useState } from 'react'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import { TermsBody } from './InfoModals.jsx'
import styles from './AuthModal.module.css'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

function LoginForm({ onLogin, onGoogle, onSwitch }) {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const err = await onLogin(email, pwd)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <>
      <button className={styles.googleBtn} onClick={onGoogle}>
        <GoogleIcon /> Continuer avec Google
      </button>
      <div className={styles.divider}><span>ou par email</span></div>

      <div className={styles.group}>
        <label className={styles.label}>Email</label>
        <input className={styles.input} type="email" placeholder="vous@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>
      <div className={styles.group}>
        <label className={styles.label}>Mot de passe</label>
        <input className={styles.input} type="password" placeholder="••••••••"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} onClick={submit} disabled={loading}>
        {loading ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className={styles.switchTxt}>
        <span className={styles.link} onClick={() => onSwitch('forgot')}>Mot de passe oublié ?</span>
      </p>
      <p className={styles.switchTxt}>
        Pas encore de compte ?{' '}
        <span className={styles.link} onClick={() => onSwitch('signup')}>S'inscrire</span>
      </p>
    </>
  )
}

function ForgotForm({ onForgot, onSwitch }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email.trim()) { setError('Entrez votre email.'); return }
    setError('')
    setLoading(true)
    const err = await onForgot(email)
    setLoading(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (sent) {
    return (
      <>
        <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 18 }}>
          Si un compte existe pour <strong>{email}</strong>, un email avec un lien pour
          choisir un nouveau mot de passe vient d’être envoyé. Pensez à vérifier vos spams.
        </p>
        <button className={styles.submitBtn} onClick={() => onSwitch('login')}>Retour à la connexion</button>
      </>
    )
  }

  return (
    <>
      <div className={styles.group}>
        <label className={styles.label}>Email</label>
        <input className={styles.input} type="email" placeholder="vous@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} onClick={submit} disabled={loading}>
        {loading ? 'Envoi…' : 'Envoyer le lien'}
      </button>

      <p className={styles.switchTxt}>
        <span className={styles.link} onClick={() => onSwitch('login')}>← Retour à la connexion</span>
      </p>
    </>
  )
}

function ResetForm({ onReset }) {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (pwd !== pwd2) { setError('Les mots de passe ne correspondent pas.'); return }
    setError('')
    setLoading(true)
    const err = await onReset(pwd)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <>
      <div className={styles.group}>
        <label className={styles.label}>Nouveau mot de passe</label>
        <input className={styles.input} type="password" placeholder="min. 6 caractères"
          value={pwd} onChange={e => setPwd(e.target.value)} />
      </div>
      <div className={styles.group}>
        <label className={styles.label}>Confirmer le mot de passe</label>
        <input className={styles.input} type="password" placeholder="••••••••"
          value={pwd2} onChange={e => setPwd2(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} onClick={submit} disabled={loading}>
        {loading ? 'Mise à jour…' : 'Enregistrer le mot de passe'}
      </button>
    </>
  )
}

function SignupForm({ onSignup, onGoogle, onSwitch }) {
  const [accountType, setAccountType] = useState('personal')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isBusiness = accountType === 'business'

  const submit = async () => {
    if (!agreed) { setError('Veuillez accepter les conditions d’utilisation pour continuer.'); return }
    if (isBusiness && !businessName.trim()) { setError('Le nom de l’entreprise est requis.'); return }
    if (isBusiness && !phone.trim()) { setError('Le numéro de téléphone est requis.'); return }
    setLoading(true)
    const err = await onSignup(name, email, pwd, {
      accountType,
      businessName: isBusiness ? businessName.trim() : '',
      phone: isBusiness ? phone.trim() : '',
    })
    setLoading(false)
    if (err) setError(err)
  }

  if (showTerms) {
    return (
      <>
        <button className={styles.backLink} onClick={() => setShowTerms(false)}>← Retour à l’inscription</button>
        <div className={styles.termsScroll}><TermsBody /></div>
        <button className={styles.submitBtn} onClick={() => { setAgreed(true); setShowTerms(false); setError('') }}>
          J’accepte les conditions
        </button>
      </>
    )
  }

  return (
    <>
      <button className={styles.googleBtn} onClick={onGoogle}>
        <GoogleIcon /> Continuer avec Google
      </button>
      <div className={styles.divider}><span>ou par email</span></div>

      <div className={styles.group}>
        <label className={styles.label}>Vous vous inscrivez en tant que…</label>
        <div className={styles.accountTypeRow}>
          <button
            type="button"
            className={`${styles.accountTypeBtn} ${!isBusiness ? styles.accountTypeActive : ''}`}
            onClick={() => setAccountType('personal')}
          >👤 Particulier</button>
          <button
            type="button"
            className={`${styles.accountTypeBtn} ${isBusiness ? styles.accountTypeActive : ''}`}
            onClick={() => setAccountType('business')}
          >🏢 Entreprise / Organisateur</button>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{isBusiness ? 'Nom du contact' : 'Nom complet'}</label>
        <input className={styles.input} type="text" placeholder="Amina Traoré"
          value={name} onChange={e => setName(e.target.value)} />
      </div>

      {isBusiness && (
        <>
          <div className={styles.group}>
            <label className={styles.label}>Nom de l’entreprise</label>
            <input className={styles.input} type="text" placeholder="Ex. Aurum Events"
              value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Téléphone</label>
            <input className={styles.input} type="tel" placeholder="+228 90 00 00 00"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </>
      )}

      <div className={styles.group}>
        <label className={styles.label}>Email</label>
        <input className={styles.input} type="email" placeholder="vous@email.com"
          value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className={styles.group}>
        <label className={styles.label}>Mot de passe</label>
        <input className={styles.input} type="password" placeholder="min. 6 caractères"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>

      <label className={styles.terms}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span>
          J’accepte les{' '}
          <span className={styles.link} onClick={(e) => { e.preventDefault(); setShowTerms(true) }}>
            conditions d’utilisation
          </span>{' '}
          et la politique de confidentialité de OuiMoove.
        </span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submitBtn} onClick={submit} disabled={loading || !agreed}>
        {loading ? 'Création…' : 'Créer le compte'}
      </button>

      <p className={styles.switchTxt}>
        Déjà un compte ?{' '}
        <span className={styles.link} onClick={() => onSwitch('login')}>Se connecter</span>
      </p>
    </>
  )
}

const HEADERS = {
  login:  { title: 'Connexion',              subtitle: 'Content de vous revoir !' },
  signup: { title: 'Créer un compte',        subtitle: 'Rejoignez la communauté OuiMoove' },
  forgot: { title: 'Mot de passe oublié',    subtitle: 'Nous vous envoyons un lien de réinitialisation' },
  reset:  { title: 'Nouveau mot de passe',   subtitle: 'Choisissez un nouveau mot de passe' },
}

export function AuthModal({ mode, onClose, onSwitch, onLogin, onSignup, onGoogle, onForgot, onReset }) {
  const header = HEADERS[mode]

  return (
    <Modal open={!!header} onClose={onClose}>
      <ModalHeader title={header?.title} subtitle={header?.subtitle} />
      <ModalBody>
        {mode === 'login'  && <LoginForm onLogin={onLogin} onGoogle={onGoogle} onSwitch={onSwitch} />}
        {mode === 'signup' && <SignupForm onSignup={onSignup} onGoogle={onGoogle} onSwitch={onSwitch} />}
        {mode === 'forgot' && <ForgotForm onForgot={onForgot} onSwitch={onSwitch} />}
        {mode === 'reset'  && <ResetForm onReset={onReset} />}
      </ModalBody>
    </Modal>
  )
}
