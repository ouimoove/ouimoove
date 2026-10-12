import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { formatDate, formatShortDate, formatLongDate, formatMoney } from './lib/basics.js'

// French first (Ouimoove's main audience), English on request or when the
// browser is set to English. Strings are written inline as tx('…', '…').
const KEY = 'om_lang'
function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'fr' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'fr'
}

const LangContext = createContext(null)

export function LangProvider({ children, initial }) {
  const [lang, setLangState] = useState(() => initial || initialLang())
  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
    document.documentElement.lang = l
  }, [])
  const value = useMemo(() => {
    const tx = (fr, en) => (lang === 'en' ? en : fr)
    const L = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : obj[lang] ?? obj.fr ?? '')
    return {
      lang, setLang, tx, L,
      date: (iso) => formatDate(iso, lang),
      shortDate: (iso) => formatShortDate(iso, lang),
      longDate: (iso) => formatLongDate(iso, lang),
      money: (n, cur) => formatMoney(n, cur, lang),
    }
  }, [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useI18n outside LangProvider')
  return ctx
}

export function LangToggle({ className }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={className} role="group" aria-label="Langue / Language">
      {['fr', 'en'].map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
