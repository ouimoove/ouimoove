// AuthModal's handlers, plus the two logout call sites (Navbar and
// ProfileModal use slightly different post-logout behavior — Navbar has no
// modal open to close, ProfileModal does — kept as two named functions
// rather than one with a flag, so each call site stays exactly as
// explicit as it was inline.
export function useAuthActions(store, toast, { close }) {
  const onLogin = async (email, pwd) => {
    const r = await store.login(email, pwd)
    if (!r.ok) return r.error
    toast('Bienvenue, ' + r.user.name + ' !', 'success')
    close()
    return null
  }

  const onSignup = async (name, email, pwd, businessInfo) => {
    const r = await store.signup(name, email, pwd, businessInfo)
    if (!r.ok) return r.error
    if (r.needsEmailConfirmation) {
      toast('Vérifiez votre boîte email pour confirmer votre compte.', 'info')
      close()
      return null
    }
    toast('Compte créé ! Bienvenue ' + r.user.name, 'success')
    close()
    return null
  }

  const onGoogle = async () => {
    try { await store.googleLogin() }
    catch (e) { toast(e.message || 'Connexion Google impossible', 'error') }
  }

  const logoutFromNavbar = async () => {
    await store.logout()
    toast('À bientôt !', 'info')
  }

  const logoutFromProfile = async () => {
    await store.logout()
    toast('À bientôt !', 'info')
    close()
  }

  return { onLogin, onSignup, onGoogle, logoutFromNavbar, logoutFromProfile }
}
