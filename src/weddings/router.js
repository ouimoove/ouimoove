import { useEffect, useState } from 'react'

// Ouimoove has no router library: the app reads window.location and the
// wedding area lives under /mariage (or /wedding) with sections below it.
export const BASES = ['/mariage', '/wedding']
export const isWeddingPath = (p) => BASES.some((b) => p === b || p.startsWith(`${b}/`))
export const isSitePath = (p) => /^\/w\/[^/]+\/?$/.test(p)
export const siteSlugFrom = (p) => {
  const raw = p.replace(/^\/w\//, '').replace(/\/$/, '')
  // A malformed escape (e.g. /w/%) must not crash the page.
  try { return decodeURIComponent(raw) } catch { return raw }
}

export function parseWeddingPath(pathname) {
  const base = BASES.find((b) => pathname === b || pathname.startsWith(`${b}/`)) || BASES[0]
  const rest = pathname.slice(base.length).replace(/^\/+|\/+$/g, '')
  const [section = '', ...params] = rest ? rest.split('/') : []
  return { base, section, params }
}

export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname + window.location.search) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

export function usePathname() {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
