import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useI18n } from '../i18n.jsx'
import { Btn, Field, Input, Sheet, styles as s } from './ui.jsx'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

// Same Ouimoove account as tickets and events, in French or English.
export function AuthPanel({ mode, reason, onMode, onClose }) {
  const { tx } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const here = `${window.location.origin}${window.location.pathname}`
  const run = async (fn) => {
    setBusy(true); setError('')
    try { await fn() } catch (e) { setError(e?.message || String(e)) }
    setBusy(false)
  }

  const login = () => run(async () => {
    if (!email || !pwd) throw new Error(tx('Email et mot de passe requis.', 'Email and password are required.'))
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd })
    if (e) throw new Error(/invalid/i.test(e.message) ? tx('Email ou mot de passe incorrect.', 'Wrong email or password.') : e.message)
    onClose()
  })
  const signup = () => run(async () => {
    if (!name.trim() || !email.trim() || !pwd) throw new Error(tx('Tous les champs sont requis.', 'All fields are required.'))
    if (pwd.length < 6) throw new Error(tx('Mot de passe trop court (6 caractères minimum).', 'Password too short (at least 6 characters).'))
    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim(), password: pwd,
      options: { emailRedirectTo: here, data: { full_name: name.trim(), account_type: 'personal' } },
    })
    if (e) throw e
    if (!data.session) setNotice(tx(`Compte créé. Ouvrez l'email envoyé à ${email.trim()} pour le confirmer, puis revenez ici.`, `Account created. Open the email sent to ${email.trim()} to confirm it, then come back here.`))
    else onClose()
  })
  const forgot = () => run(async () => {
    if (!email.trim()) throw new Error(tx('Entrez votre email.', 'Enter your email.'))
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    if (e) throw e
    setNotice(tx("Si un compte existe pour cet email, un lien pour choisir un nouveau mot de passe vient d'être envoyé.", 'If an account exists for that email, a link to choose a new password has been sent.'))
  })
  const google = () => run(async () => {
    try { localStorage.setItem('om_return_path', window.location.pathname) } catch { /* ignore */ }
    const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here } })
    if (e) throw e
  })

  const title = mode === 'signup' ? tx('Créer votre compte', 'Create your account')
    : mode === 'forgot' ? tx('Mot de passe oublié', 'Forgot password') : tx('Connexion', 'Sign in')
  const submit = mode === 'signup' ? signup : mode === 'forgot' ? forgot : login

  return (
    <Sheet open onClose={onClose} title={title} sub={reason || tx('Le même compte que pour vos billets Ouimoove.', 'The same account as your Ouimoove tickets.')}>
      {notice ? (
        <div className={s.stack}>
          <p className={s.small} style={{ lineHeight: 1.6 }}>{notice}</p>
          <Btn variant="primary" onClick={() => { setNotice(''); onMode('login') }}>{tx('Aller à la connexion', 'Go to sign in')}</Btn>
        </div>
      ) : (
        <form className={s.stack} onSubmit={(e) => { e.preventDefault(); submit() }}>
          {mode !== 'forgot' && (
            <>
              <Btn variant="ghost" block onClick={google} disabled={busy}><GoogleIcon /> {tx('Continuer avec Google', 'Continue with Google')}</Btn>
              <div className={s.muted} style={{ textAlign: 'center', fontSize: '.8rem' }}>{tx('ou par email', 'or with email')}</div>
            </>
          )}
          {mode === 'signup' && (
            <Field label={tx('Votre nom', 'Your name')}>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
            </Field>
          )}
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@email.com" />
          </Field>
          {mode !== 'forgot' && (
            <Field label={tx('Mot de passe', 'Password')}>
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </Field>
          )}
          {error && <p className={s.small} style={{ color: 'var(--danger)' }}>{error}</p>}
          <Btn type="submit" variant="primary" block disabled={busy}>
            {busy ? '…' : mode === 'signup' ? tx('Créer mon compte', 'Create my account') : mode === 'forgot' ? tx('Envoyer le lien', 'Send the link') : tx('Se connecter', 'Sign in')}
          </Btn>
          <div className={s.stackSm} style={{ textAlign: 'center', fontSize: '.84rem' }}>
            {mode === 'login' && (
              <>
                <span><button type="button" className={s.linkBtn} onClick={() => onMode('forgot')}>{tx('Mot de passe oublié ?', 'Forgot your password?')}</button></span>
                <span className={s.muted}>{tx('Pas encore de compte ?', 'No account yet?')} <button type="button" className={s.linkBtn} onClick={() => onMode('signup')}>{tx("S'inscrire", 'Sign up')}</button></span>
              </>
            )}
            {mode === 'signup' && <span className={s.muted}>{tx('Déjà un compte ?', 'Already have an account?')} <button type="button" className={s.linkBtn} onClick={() => onMode('login')}>{tx('Se connecter', 'Sign in')}</button></span>}
            {mode === 'forgot' && <span><button type="button" className={s.linkBtn} onClick={() => onMode('login')}>{tx('← Retour à la connexion', '← Back to sign in')}</button></span>}
          </div>
        </form>
      )}
    </Sheet>
  )
}
