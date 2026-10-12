// The wedding memoir: a small A5 keepsake PDF with the couple's journey,
// their numbers, the dowry, their guests and the messages they received.
// Uses the PDF's built-in fonts, so text is reduced to characters those
// fonts can draw (French accents are fine; Ewe/Akan letters are mapped).
import { RELIGIOUS_VARIANTS, RECIPIENTS, VENDOR_CAT_BY_ID, BUDGET_CAT_BY_ID, qtyLabel } from '../data/templates.js'
import { cultureOf } from '../data/cultures.js'
import { stepTitle, mainDate } from './plan.js'
import { guestStats, seatsOf } from './guests.js'
import { budgetSummary } from './budget.js'
import { daysBetween, firstWord, formatDate, formatLongDate, formatMoneyPlain, todayISO } from './basics.js'

const CREAM = [255, 250, 242]
const GOLD = [196, 154, 60]
const PLUM = [139, 34, 118]
const INK = [42, 23, 48]
const MUTED = [128, 112, 138]
const GROOM = [43, 79, 134]
const BRIDE = [155, 47, 102]

const MAP = { ɛ: 'e', Ɛ: 'E', ɔ: 'o', Ɔ: 'O', ɖ: 'd', Ɖ: 'D', ŋ: 'ng', Ŋ: 'Ng', ʋ: 'v', Ʋ: 'V', ɣ: 'g', Ɣ: 'G', ' ': ' ', ' ': ' ' }
// Characters the standard PDF fonts can show (Windows-1252).
const SAFE = /[\x20-\x7E\xA0-\xFF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\n]/
export function pdfSafe(text) {
  return [...String(text ?? '').replace(/[ɛƐɔƆɖƉŋŊʋƲɣƔ  ]/g, (c) => MAP[c] || c)].filter((c) => SAFE.test(c)).join('').replace(/ {2,}/g, ' ').trim()
}

export function memoirStats({ wedding, rows }) {
  const events = rows.events.filter((e) => e.included !== false)
  const main = mainDate(events)
  const gs = guestStats(rows.guests)
  const start = String(wedding.created_at || '').slice(0, 10) || todayISO()
  const end = main && main < todayISO() ? main : (main || todayISO())
  return {
    main,
    prepDays: Math.max(0, daysBetween(start, end) || 0),
    steps: events.length,
    stepsDone: events.filter((e) => e.done).length,
    invitedSeats: gs.invitedSeats,
    confirmed: gs.yesSeats,
    groomSeats: gs.groomSeats,
    brideSeats: gs.brideSeats,
    tables: rows.tables.length,
    tasksDone: rows.tasks.filter((t) => t.done).length,
    tasks: rows.tasks.length,
    vendors: rows.budget.filter((i) => i.status === 'booked' || i.status === 'paid').length,
    dowryItems: rows.dowry.filter((d) => d.stage === 'dowry').length,
    messages: rows.rsvps.filter((r) => r.message).length,
  }
}

export async function buildMemoir({ wedding, rows }, lang = 'fr', opts = {}) {
  const { jsPDF } = await import('jspdf')
  const o = { guests: true, messages: true, dowry: true, budget: false, ...opts }
  const tx = (fr, en) => pdfSafe(lang === 'en' ? en : fr)
  const doc = new jsPDF({ unit: 'mm', format: 'a5', compress: true })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 16
  const A = pdfSafe(firstWord(wedding.groom_name)) || '…'
  const B = pdfSafe(firstWord(wedding.bride_name)) || '…'
  const stats = memoirStats({ wedding, rows })
  let page = 1
  let y = 0

  const fill = (c) => doc.setFillColor(...c)
  const stroke = (c) => doc.setDrawColor(...c)
  const color = (c) => doc.setTextColor(...c)
  const font = (f = 'helvetica', st = 'normal', size = 10) => { doc.setFont(f, st); doc.setFontSize(size) }
  const center = (text, yy) => doc.text(pdfSafe(text), W / 2, yy, { align: 'center' })

  const frame = () => {
    fill(CREAM); doc.rect(0, 0, W, H, 'F')
    stroke(GOLD); doc.setLineWidth(0.6); doc.rect(7, 7, W - 14, H - 14)
    doc.setLineWidth(0.2); doc.rect(9, 9, W - 18, H - 18)
  }
  const footer = () => {
    font('helvetica', 'normal', 7); color(MUTED)
    center(`${A} & ${B}  ·  ${page}`, H - 11.5)
  }
  const newPage = (title) => {
    doc.addPage(); page += 1; frame(); footer()
    y = 26
    if (title) {
      font('times', 'italic', 22); color(PLUM); center(title, y)
      stroke(GOLD); doc.setLineWidth(0.4); doc.line(W / 2 - 10, y + 4, W / 2 + 10, y + 4)
      y += 14
    }
  }
  const ensure = (need, title) => { if (y + need > H - 20) newPage(title) }
  const rings = (cx, cy, r) => {
    stroke(GOLD); doc.setLineWidth(0.9)
    doc.circle(cx - r * 0.55, cy, r, 'S'); doc.circle(cx + r * 0.55, cy, r, 'S')
  }
  const names = (yy, size) => {
    font('times', 'italic', size)
    const left = `${A} `, amp = '&', right = ` ${B}`
    const wl = doc.getTextWidth(left), wa = doc.getTextWidth(amp), wr = doc.getTextWidth(right)
    let x = (W - (wl + wa + wr)) / 2
    color(PLUM); doc.text(left, x, yy); x += wl
    color(GOLD); doc.text(amp, x, yy); x += wa
    color(PLUM); doc.text(right, x, yy)
  }

  // ── Cover ──
  frame()
  rings(W / 2, 46, 6)
  font('helvetica', 'bold', 8); color(MUTED); doc.setCharSpace(1.2)
  center(tx('LE MARIAGE DE', 'THE WEDDING OF'), 66); doc.setCharSpace(0)
  names(84, 34)
  font('times', 'normal', 13); color(INK)
  if (stats.main) center(formatLongDate(stats.main, lang), 100)
  const mainEvent = rows.events.find((e) => e.event_date === stats.main && e.included !== false)
  font('helvetica', 'normal', 9); color(MUTED)
  if (mainEvent && (mainEvent.venue || mainEvent.city || wedding.city)) center([mainEvent.venue, mainEvent.city || wedding.city].filter(Boolean).join(' · '), 108)
  if (wedding.hashtag) { font('helvetica', 'bold', 11); color(GOLD); center(wedding.hashtag, 126) }
  if (wedding.slogan) {
    font('times', 'italic', 12); color(INK)
    doc.splitTextToSize(pdfSafe(wedding.slogan), W - 2 * M - 10).slice(0, 3).forEach((line, i) => center(line, 138 + i * 6))
  }
  const cultures = [...new Set([wedding.groom_culture, wedding.bride_culture].filter(Boolean))].map((c) => cultureOf(c).name[lang] || cultureOf(c).name.fr)
  if (cultures.length) { font('helvetica', 'normal', 8); color(MUTED); center(`${tx('Traditions', 'Traditions')} : ${cultures.join(' · ')}`, H - 34) }
  font('times', 'italic', 11); color(GOLD); center('Ouimoove Weddings', H - 22)

  // ── Journey ──
  newPage(tx('Notre parcours', 'Our journey'))
  const events = rows.events.filter((e) => e.included !== false)
    .sort((a, b) => (a.event_date || '9999').localeCompare(b.event_date || '9999') || (a.sort || 0) - (b.sort || 0))
  const railX = M + 8
  events.forEach((e, i) => {
    const where = [e.venue, e.city].filter(Boolean).join(', ')
    const block = 9 + (where ? 5 : 0) + 6
    ensure(block, tx('Notre parcours (suite)', 'Our journey (continued)'))
    if (i < events.length - 1) { stroke(GOLD); doc.setLineWidth(0.3); doc.line(railX, y + 2, railX, y + block + 1) }
    fill(e.done ? GOLD : CREAM); stroke(GOLD); doc.setLineWidth(0.6); doc.circle(railX, y, 2.4, 'FD')
    font('helvetica', 'bold', 10.5); color(INK)
    const title = e.kind === 'religious' ? (RELIGIOUS_VARIANTS[e.variant]?.[lang] || stepTitle(e, lang, wedding.bride_culture)) : stepTitle(e, lang, wedding.bride_culture)
    doc.text(pdfSafe(title), railX + 7, y + 1)
    font('helvetica', 'normal', 9); color(PLUM)
    const when = e.event_date ? formatLongDate(e.event_date, lang) + (e.kind === 'honeymoon' && e.end_date ? ` → ${formatDate(e.end_date, lang)}` : '') : tx('Date non fixée', 'Date not set')
    doc.text(pdfSafe(when), railX + 7, y + 6.5)
    if (where) { color(MUTED); doc.text(pdfSafe(where), railX + 7, y + 11.5, { maxWidth: W - railX - 7 - M }) }
    y += block
  })
  if (!events.length) { font('helvetica', 'normal', 10); color(MUTED); center(tx('Aucune étape enregistrée.', 'No steps recorded.'), y) }

  // ── Numbers ──
  newPage(tx('Notre mariage en chiffres', 'Our wedding in numbers'))
  const tiles = [
    [stats.prepDays, tx('jours de préparation', 'days of planning')],
    [stats.steps, tx('étapes célébrées', 'steps celebrated')],
    [stats.invitedSeats, tx('places d’invités', 'guest seats')],
    [stats.confirmed, tx('présences confirmées', 'confirmed guests')],
    [stats.tables, tx('tables', 'tables')],
    [`${stats.tasksDone}/${stats.tasks}`, tx('tâches accomplies', 'tasks completed')],
    [stats.vendors, tx('prestataires réservés', 'vendors booked')],
    [stats.dowryItems, tx('présents de dot', 'dowry gifts')],
  ]
  if (o.messages) tiles.push([stats.messages, tx('messages reçus', 'messages received')])
  const tw = (W - 2 * M - 6) / 2, th = 22
  tiles.forEach(([v, label], i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = M + col * (tw + 6), yy = y + row * (th + 5)
    fill([255, 255, 255]); stroke([232, 220, 196]); doc.setLineWidth(0.3); doc.roundedRect(x, yy, tw, th, 3, 3, 'FD')
    font('times', 'bold', 18); color(PLUM); doc.text(pdfSafe(String(v)), x + tw / 2, yy + 11, { align: 'center' })
    font('helvetica', 'normal', 7.5); color(MUTED); doc.text(label, x + tw / 2, yy + 17, { align: 'center' })
  })
  y += Math.ceil(tiles.length / 2) * (th + 5) + 4
  const sideTotal = stats.groomSeats + stats.brideSeats
  if (sideTotal > 0) {
    ensure(22)
    font('helvetica', 'bold', 8.5); color(GROOM); doc.text(pdfSafe(`${A} · ${stats.groomSeats}`), M, y)
    color(BRIDE); doc.text(pdfSafe(`${stats.brideSeats} · ${B}`), W - M, y, { align: 'right' })
    const bw = W - 2 * M, gw = (bw * stats.groomSeats) / sideTotal
    fill(GROOM); doc.roundedRect(M, y + 3, Math.max(gw, 0.1), 4, 1.5, 1.5, 'F')
    fill(BRIDE); doc.roundedRect(M + gw, y + 3, Math.max(bw - gw, 0.1), 4, 1.5, 1.5, 'F')
    font('helvetica', 'normal', 7.5); color(MUTED); center(tx('Invités de chaque côté', 'Guests on each side'), y + 13)
    y += 20
  }
  if (o.budget) {
    const b = budgetSummary(rows.budget, rows.dowry, wedding)
    ensure(20)
    font('helvetica', 'normal', 9); color(INK)
    center(`${tx('Budget prévu', 'Planned budget')} : ${formatMoneyPlain(b.forecast, wedding.currency, lang)}  ·  ${tx('payé', 'paid')} : ${formatMoneyPlain(b.paid, wedding.currency, lang)}`, y + 4)
    y += 12
  }

  // ── Dowry ──
  const dowry = rows.dowry.filter((d) => d.stage === 'dowry')
  if (o.dowry && dowry.length) {
    newPage(tx('La dot', 'The dowry'))
    const culture = cultureOf(wedding.bride_culture || wedding.groom_culture)
    font('helvetica', 'normal', 8.5); color(MUTED)
    center(`${tx('Selon les coutumes', 'Following the customs')} : ${culture.name[lang] || culture.name.fr}`, y - 4)
    y += 4
    Object.keys(RECIPIENTS).forEach((r) => {
      const list = dowry.filter((d) => d.recipient === r)
      if (!list.length) return
      ensure(12 + list.length * 5, tx('La dot (suite)', 'The dowry (continued)'))
      font('helvetica', 'bold', 9); color(PLUM); doc.text(pdfSafe(`${tx('Pour', 'For')} ${(RECIPIENTS[r][lang] || RECIPIENTS[r].fr).toLowerCase()}`), M, y)
      y += 5.5
      font('helvetica', 'normal', 9); color(INK)
      list.forEach((d) => {
        ensure(6, tx('La dot (suite)', 'The dowry (continued)'))
        const q = qtyLabel(d.qty, d.unit, lang)
        doc.text(pdfSafe(`•  ${d.label}${q ? ` — ${q}` : ''}`), M + 3, y, { maxWidth: W - 2 * M - 3 })
        y += 5
      })
      y += 3
    })
  }

  // ── Guests ──
  const invited = rows.guests.filter((g) => g.status === 'in')
  if (o.guests && invited.length) {
    newPage(tx('Nos invités', 'Our guests'))
    const sides = [
      ['groom', `${tx('Côté', 'Side of')} ${A}`, GROOM],
      ['bride', `${tx('Côté', 'Side of')} ${B}`, BRIDE],
      ['both', tx('Nos deux familles', 'Both our families'), PLUM],
    ]
    sides.forEach(([side, label, c]) => {
      const list = invited.filter((g) => g.side === side).sort((a, b) => a.name.localeCompare(b.name))
      if (!list.length) return
      ensure(16, tx('Nos invités (suite)', 'Our guests (continued)'))
      font('helvetica', 'bold', 9.5); color(c); doc.text(pdfSafe(`${label} · ${list.reduce((a, g) => a + seatsOf(g), 0)}`), M, y)
      y += 6
      const colW = (W - 2 * M) / 2
      for (let i = 0; i < list.length; i += 2) {
        ensure(5.2, tx('Nos invités (suite)', 'Our guests (continued)'))
        ;[list[i], list[i + 1]].forEach((g, k) => {
          if (!g) return
          font('helvetica', g.rsvp === 'yes' ? 'bold' : 'normal', 8.5); color(INK)
          const t = doc.splitTextToSize(pdfSafe(g.name + (seatsOf(g) > 1 ? ` (${seatsOf(g)})` : '')), colW - 4)[0]
          doc.text(t, M + k * colW, y)
        })
        y += 5
      }
      y += 4
    })
    font('helvetica', 'italic', 7.5); color(MUTED); ensure(6); doc.text(tx('En gras : présence confirmée.', 'In bold: confirmed attendance.'), M, y)
  }

  // ── Messages ──
  const messages = rows.rsvps.filter((r) => r.message)
  if (o.messages && messages.length) {
    newPage(tx('Vos mots pour nous', 'Your words for us'))
    messages.forEach((m) => {
      const lines = doc.splitTextToSize(pdfSafe(`« ${m.message} »`), W - 2 * M - 8)
      const h = lines.length * 5 + 10
      ensure(h, tx('Vos mots (suite)', 'Your words (continued)'))
      fill([255, 255, 255]); stroke([232, 220, 196]); doc.setLineWidth(0.3); doc.roundedRect(M, y - 4, W - 2 * M, h, 3, 3, 'FD')
      font('times', 'italic', 10.5); color(INK); doc.text(lines, M + 4, y + 1.5)
      font('helvetica', 'bold', 8); color(PLUM); doc.text(pdfSafe(`— ${m.name}`), W - M - 4, y + lines.length * 5 + 2, { align: 'right' })
      y += h + 4
    })
  }

  // ── Thank you ──
  newPage(tx('Merci', 'Thank you'))
  const booked = rows.budget.filter((i) => (i.status === 'booked' || i.status === 'paid') && i.vendor_name)
  if (booked.length) {
    font('helvetica', 'normal', 9); color(MUTED); center(tx('À celles et ceux qui ont rendu ce jour possible', 'To everyone who made this day possible'), y - 2)
    y += 6
    booked.forEach((i) => {
      ensure(6)
      const cat = BUDGET_CAT_BY_ID[i.category] || VENDOR_CAT_BY_ID[i.category]
      font('helvetica', 'bold', 9); color(INK); doc.text(pdfSafe(i.vendor_name), M, y)
      font('helvetica', 'normal', 8.5); color(MUTED); doc.text(pdfSafe(cat ? (cat[lang] || cat.fr) : i.label), W - M, y, { align: 'right' })
      y += 5.5
    })
    y += 6
  }
  const trip = rows.events.find((e) => e.kind === 'honeymoon' && e.included !== false && (e.venue || e.event_date))
  if (trip) {
    ensure(18)
    font('times', 'italic', 14); color(PLUM); center(tx('Et ensuite…', 'And then…'), y + 2)
    font('helvetica', 'normal', 9.5); color(INK)
    center(`${trip.venue || tx('Lune de miel', 'Honeymoon')}${trip.event_date ? ` · ${formatDate(trip.event_date, lang)}` : ''}`, y + 9)
    y += 18
  }
  ensure(40)
  rings(W / 2, Math.max(y + 12, H - 60), 5)
  font('times', 'italic', 13); color(INK)
  center(tx('Que votre amour grandisse chaque jour.', 'May your love grow every day.'), Math.max(y + 30, H - 42))
  font('helvetica', 'normal', 7.5); color(MUTED)
  center(`${tx('Mémoire créé le', 'Memoir made on')} ${formatDate(todayISO(), lang)} · Ouimoove Weddings · ouimoove.app/mariage`, H - 20)

  return doc
}
