// Share-link preview for wedding websites: https://ouimoove.app/w/<slug>
//
// WhatsApp, Facebook, iMessage etc. read the <meta property="og:*"> tags in
// the raw HTML and never run JavaScript. This serves the normal index.html
// with the couple's names, date and cover photo in those tags; the app then
// opens the wedding page itself (main.jsx routes /w/<slug>). Only weddings
// the couple published are shown (get_wedding_site checks that).

const SITE = 'https://ouimoove.app'
const FALLBACK_IMAGE = `${SITE}/ouimoove-logo.png`
const SLUG = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const first = (s) => String(s ?? '').trim().split(/\s+/)[0] || ''

function longDate(iso, lang) {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

async function loadSite(slug) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) return null
  const res = await fetch(`${base}/rest/v1/rpc/get_wedding_site`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug }),
  })
  if (!res.ok) return null
  return res.json()
}

// The page shell of this deployment (so preview deployments work too),
// falling back to the production site.
async function loadShell(req) {
  // Only our own hosts: this page is cached and served to everyone, so a
  // forged Host / X-Forwarded-Host header must never choose where the page
  // shell (and its scripts) comes from.
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase()
  const trusted = /^([a-z0-9-]+\.)?ouimoove\.app$/.test(host) || /^[a-z0-9-]+\.vercel\.app$/.test(host)
  for (const origin of [trusted ? `https://${host}` : null, SITE].filter(Boolean)) {
    try {
      const res = await fetch(`${origin}/index.html`)
      if (res.ok) return await res.text()
    } catch { /* try the next one */ }
  }
  return null
}

export default async function handler(req, res) {
  const slug = String(req.query.slug ?? '').toLowerCase()
  let html = await loadShell(req)
  if (!html) {
    res.status(502).send('OuiMoove is temporarily unavailable. Please try again.')
    return
  }

  const w = SLUG.test(slug) ? await loadSite(slug).catch(() => null) : null
  if (w) {
    const lang = w.lang === 'en' ? 'en' : 'fr'
    const names = `${first(w.groom_name)} & ${first(w.bride_name)}`
    const events = Array.isArray(w.events) ? w.events : []
    const pick = (k) => events.find((e) => e.kind === k && e.date)
    const main = pick('reception') || pick('religious') || pick('civil') || pick('dowry') || events.find((e) => e.date)
    const when = [longDate(main?.date, lang), main?.city].filter(Boolean).join(' · ')
    const title = lang === 'en' ? `${names} are getting married` : `${names} se marient`
    const desc = [when, w.slogan, lang === 'en' ? 'Schedule, venues and RSVP.' : 'Programme, lieux et réponse en ligne.'].filter(Boolean).join(' — ')
    const cover = w.site && /^https:\/\//.test(w.site.cover_url || '') ? w.site.cover_url : FALLBACK_IMAGE
    const pageUrl = `${SITE}/w/${slug}`

    const tags = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Ouimoove Weddings" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:image" content="${esc(cover)}" />
    <meta property="og:image:alt" content="${esc(names)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(cover)}" />
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${esc(pageUrl)}" />`

    html = html
      .replace(/\s*<meta (?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/g, '')
      .replace(/\s*<link rel="canonical"[^>]*>/g, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace('</head>', `${tags}\n  </head>`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Short edge cache: a couple who edits their page sees the new preview soon.
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
  res.status(200).send(html)
}
