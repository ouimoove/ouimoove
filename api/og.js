// Share-link preview for events: https://ouimoove.app/e/<eventId>
//
// WhatsApp, Facebook, iMessage etc. never run JavaScript — they read the
// <meta property="og:*"> tags in the raw HTML. The app is a single-page app,
// so without this every shared link previewed as the generic homepage (no
// event title, no image). This function serves the normal index.html with the
// event's own title, date/city and image injected into those tags, plus a tiny
// script that moves real visitors to /?event=<id>, which the app already opens.

const SITE = 'https://ouimoove.app'
const FALLBACK_IMAGE = `${SITE}/ouimoove-logo.png`
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function frDate(iso) {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

async function loadEvent(id) {
  const base = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) return null
  // Anon key + RLS: only published, public events are returned.
  const url = `${base}/rest/v1/events?id=eq.${id}&status=eq.published&select=title,description,city,venue,event_date,image_url&limit=1`
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] ?? null
}

export default async function handler(req, res) {
  const id = String(req.query.id ?? '')
  const appUrl = UUID.test(id) ? `/?event=${id}` : '/'

  let html
  try {
    html = await (await fetch(`${SITE}/index.html`)).text()
  } catch {
    res.writeHead(302, { Location: appUrl }).end()
    return
  }

  const ev = UUID.test(id) ? await loadEvent(id).catch(() => null) : null

  if (ev) {
    const title = `${ev.title} — OuiMoove`
    const when = [frDate(ev.event_date), ev.venue, ev.city].filter(Boolean).join(' · ')
    const desc = [when, (ev.description || '').slice(0, 180)].filter(Boolean).join(' — ') || 'Réservez vos billets sur OuiMoove.'
    const image = /^https:\/\//.test(ev.image_url || '') ? ev.image_url : FALLBACK_IMAGE
    const pageUrl = `${SITE}/e/${id}`

    const tags = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="OuiMoove" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:alt" content="${esc(ev.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${esc(pageUrl)}" />`

    html = html
      // Drop the generic site-wide tags so crawlers only see this event's.
      .replace(/\s*<meta (?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/g, '')
      .replace(/\s*<link rel="canonical"[^>]*>/g, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace('</head>', `${tags}\n  </head>`)
  }

  // Real visitors: switch the address to the route the app understands before
  // the app boots (crawlers ignore scripts, so they keep the tags above).
  html = html.replace('<head>', `<head>\n    <script>history.replaceState(null, '', ${JSON.stringify(appUrl)})</script>`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Cache at the edge briefly so a viral link doesn't hit the database each time.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(html)
}
