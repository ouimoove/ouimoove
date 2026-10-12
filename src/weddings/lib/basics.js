// Small pure helpers shared across Ouimoove Weddings: ids, dates, money,
// text and links. No React, no Supabase, so they are easy to test.

// ── Ids ────────────────────────────────────────────────────────────
// Rows get their id on the device, so the screen updates instantly and a
// plan made without an account keeps its ids when it moves to the account.
export function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const b = new Uint8Array(16)
  globalThis.crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// Groups [{id, patch}] by identical patch so bulk moves are a few requests.
export function groupPatches(changes) {
  const groups = new Map()
  changes.forEach(({ id, patch }) => {
    const key = JSON.stringify(patch)
    if (!groups.has(key)) groups.set(key, { patch, ids: [] })
    groups.get(key).ids.push(id)
  })
  return [...groups.values()]
}

// ── Dates (always plain YYYY-MM-DD strings, read in local time) ────
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export function parseISO(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(iso, days) {
  const d = parseISO(iso)
  if (!d) return null
  d.setDate(d.getDate() + days)
  return toISO(d)
}
export function daysBetween(fromISO, toISOStr) {
  const a = parseISO(fromISO), b = parseISO(toISOStr)
  if (!a || !b) return null
  return Math.round((b - a) / 86400000)
}
export const daysUntil = (iso) => daysBetween(todayISO(), iso)
export const minISO = (a, b) => (!a ? b : !b ? a : a < b ? a : b)

const LOCALE = { fr: 'fr-FR', en: 'en-GB' }
export function formatDate(iso, lang = 'fr', opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = parseISO(iso)
  if (!d) return ''
  return d.toLocaleDateString(LOCALE[lang] || 'fr-FR', opts)
}
export const formatShortDate = (iso, lang) => formatDate(iso, lang, { day: 'numeric', month: 'short' })
export const formatLongDate = (iso, lang) => formatDate(iso, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// ── Money ──────────────────────────────────────────────────────────
// Wedding budgets are whole amounts. CFA francs read best as "1 500 000 FCFA".
const CFA = new Set(['XOF', 'XAF'])
export function formatMoney(amount, currency = 'XOF', lang = 'fr') {
  const n = Math.round(Number(amount) || 0)
  const locale = LOCALE[lang] || 'fr-FR'
  if (CFA.has(currency)) return `${n.toLocaleString(locale)} FCFA`
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n)
  } catch {
    return `${n.toLocaleString(locale)} ${currency}`
  }
}
// The number and the currency apart, so the currency can be drawn small.
// before: the currency comes first (£1,000) rather than after (1 000 €).
export function moneyParts(amount, currency = 'XOF', lang = 'fr') {
  const n = Math.round(Number(amount) || 0)
  const locale = LOCALE[lang] || 'fr-FR'
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  if (CFA.has(currency)) return { sign, num: abs.toLocaleString(locale), unit: 'FCFA', before: false }
  try {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }).formatToParts(abs)
    const at = parts.findIndex((p) => p.type === 'currency')
    const first = parts.findIndex((p) => p.type === 'integer')
    const num = parts.filter((p) => p.type !== 'currency').map((p) => p.value).join('').trim()
    return { sign, num, unit: at >= 0 ? parts[at].value : currency, before: at >= 0 && at < first }
  } catch {
    return { sign, num: abs.toLocaleString(locale), unit: currency, before: false }
  }
}
// Plain-text version for PDFs (built-in PDF fonts lack ₦, ₵, etc.).
export function formatMoneyPlain(amount, currency = 'XOF', lang = 'fr') {
  const n = Math.round(Number(amount) || 0)
  const s = n.toLocaleString(LOCALE[lang] || 'fr-FR').replace(/[  ]/g, ' ')
  return `${s} ${CFA.has(currency) ? 'FCFA' : currency}`
}
// Accepts "1 500 000", "1.500.000", "1,500,000", "1500000 FCFA".
export function parseMoney(text) {
  const digits = String(text ?? '').replace(/[^\d]/g, '')
  return digits ? Math.min(Number(digits), 1e12) : 0
}
// A sensible rounding step for suggested amounts in a given total.
export function roundingStep(total) {
  if (total >= 10_000_000) return 10_000
  if (total >= 1_000_000) return 1_000
  if (total >= 10_000) return 100
  return 1
}

// ── Text ───────────────────────────────────────────────────────────
export const stripAccents = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
// Ewe / Akan letters that plain PDF fonts and hashtags can't hold.
const LETTERS = { ɛ: 'e', Ɛ: 'E', ɔ: 'o', Ɔ: 'O', ɖ: 'd', Ɖ: 'D', ŋ: 'ng', Ŋ: 'Ng', ƒ: 'f', Ƒ: 'F', ʋ: 'v', Ʋ: 'V', ɣ: 'g', Ɣ: 'G', œ: 'oe', Œ: 'OE', æ: 'ae', Æ: 'AE', ß: 'ss' }
export const latinize = (s) => stripAccents(String(s ?? '').replace(/[ɛƐɔƆɖƉŋŊƒƑʋƲɣƔœŒæÆß]/g, (c) => LETTERS[c] || c))
export function slugify(s, max = 60) {
  return latinize(s).toLowerCase().replace(/&/g, ' et ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/g, '')
}
export const firstWord = (s) => String(s ?? '').trim().split(/\s+/)[0] || ''
export const coupleNames = (w, sep = ' & ') => [firstWord(w?.groom_name), firstWord(w?.bride_name)].filter(Boolean).join(sep)

// ── Links ──────────────────────────────────────────────────────────
// WhatsApp wants international digits only. Local 8-digit numbers are
// assumed to be Togolese unless a country code is given.
const DIAL = { TG: '228', BJ: '229', CI: '225', SN: '221', BF: '226', ML: '223', NE: '227', GH: '233', NG: '234', CM: '237', GA: '241', CG: '242', CD: '243', KE: '254', UG: '256', TZ: '255', RW: '250', ET: '251', ZA: '27', ZW: '263', MA: '212', DZ: '213', TN: '216', FR: '33', BE: '32', CH: '41', GB: '44', CA: '1', US: '1' }
export function waNumber(phone, country = 'TG') {
  let d = String(phone ?? '').replace(/[^\d+]/g, '')
  if (!d) return ''
  if (d.startsWith('+')) return d.slice(1)
  if (d.startsWith('00')) return d.slice(2)
  const code = DIAL[country] || ''
  if (code && d.startsWith(code) && d.length > 9) return d
  return code + d.replace(/^0+/, '')
}
export function waLink(phone, text, country) {
  const n = waNumber(phone, country)
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}
export const mapsLink = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export function csv(rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')
}
export function downloadBlob(filename, data, type = 'text/plain;charset=utf-8') {
  const blob = data instanceof Blob ? data : new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
