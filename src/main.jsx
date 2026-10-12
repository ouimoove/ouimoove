import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { isWeddingPath, isSitePath, siteSlugFrom, usePathname } from './weddings/router.js'
import './index.css'

// Ouimoove Weddings lives at /mariage (planner) and /w/<slug> (a couple's
// public website). Both load on demand, so the events app stays as light.
const WeddingApp = lazy(() => import('./weddings/WeddingApp.jsx'))
const WeddingSite = lazy(() => import('./weddings/WeddingSite.jsx'))

Sentry.init({
  dsn: 'https://320f85e78a9e720ef7832254df9ad4be@o4511610589806592.ingest.de.sentry.io/4511623036928080',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// A Google sign-in started in the wedding area can come back to the site
// root (Supabase falls back to the main site URL): return the visitor to the
// page they were on, keeping the sign-in details in the URL.
try {
  const back = localStorage.getItem('om_return_path')
  if (back) {
    localStorage.removeItem('om_return_path')
    const fromSignIn = /access_token|error_description/.test(window.location.hash) || /[?&]code=/.test(window.location.search)
    if (fromSignIn && window.location.pathname === '/' && isWeddingPath(back)) {
      window.history.replaceState(null, '', back + window.location.search + window.location.hash)
    }
  }
} catch { /* storage blocked: stay where we are */ }

function Root() {
  const path = usePathname()
  if (isSitePath(path)) return <Suspense fallback={null}><WeddingSite slug={siteSlugFrom(path)} /></Suspense>
  if (isWeddingPath(path)) return <Suspense fallback={null}><WeddingApp /></Suspense>
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
