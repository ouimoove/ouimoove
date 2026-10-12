// Wedding hashtag and slogan ideas, in French and English, from the
// couple's names, family name, date, the meaning of their names and a few
// words that describe them. Pure functions: same input, same ideas.
import { latinize, parseISO } from './basics.js'

const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
// "kekeli" → "Kekeli", "jean-paul" → "JeanPaul", "lumière" → "Lumiere"
export function word(s) {
  return latinize(s).replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).map((w) => cap(w.toLowerCase())).join('')
}
const first = (s) => word(String(s ?? '').trim().split(/\s+/)[0] || '')

// Two blends of the names: "Desire"+"Keli" → "Desli", "Kelire".
export function blends(a, b) {
  if (!a || !b) return []
  const half = (s, end) => (end ? s.slice(Math.floor(s.length / 2)) : s.slice(0, Math.ceil(s.length / 2)))
  const x = cap(half(a, false).toLowerCase() + half(b, true).toLowerCase())
  const y = cap(half(b, false).toLowerCase() + half(a, true).toLowerCase())
  return [...new Set([x, y])].filter((s) => s.length >= 3 && s !== a && s !== b)
}

export function makeHashtags({ groom, bride, family, date, groomMeaning, brideMeaning, words = [] } = {}) {
  const A = first(groom), B = first(bride)
  if (!A && !B) return []
  const S = word(family)
  const d = parseISO(date)
  const Y = d ? String(d.getFullYear()) : ''
  const YY = Y.slice(2)
  const DM = d ? `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}` : ''
  const MA = word(groomMeaning), MB = word(brideMeaning)
  const W = words.map(word).filter(Boolean).slice(0, 3)
  const [blend1, blend2] = blends(A, B)

  const ideas = []
  const add = (group, ...parts) => {
    if (parts.some((p) => p === '' || p == null)) return
    ideas.push({ group, tag: '#' + parts.join('') })
  }

  // Classic
  add('classic', A, 'And', B)
  add('classic', A, 'And', B, Y)
  add('classic', A, 'Et', B)
  add('classic', A, 'Et', B, Y)
  add('classic', A, 'Weds', B)
  add('classic', B, 'Weds', A)
  add('classic', A, B, 'Forever')
  add('classic', A, B, 'PourLaVie')
  add('classic', A, 'x', B)
  add('classic', 'Team', A, B)
  add('classic', A, B, DM)
  add('classic', A, B, YY)
  // Playful
  add('fun', 'Oui', A, B)
  add('fun', B, 'DitOuiA', A)
  add('fun', B, 'SaidYes')
  add('fun', A, 'FoundHis', B)
  add('fun', 'HappilyEver', A, B)
  add('fun', blend1, Y)
  add('fun', blend2, 'Love')
  add('fun', 'Love', blend1)
  // Family name
  add('family', 'Becoming', S)
  add('family', B, 'Devient', S)
  add('family', 'MrAndMrs', S, Y)
  add('family', 'The', S, 's', Y)
  add('family', 'Famille', S, Y)
  // Meanings ("Kekeli" means light → #HisLightHerDesire)
  if (MB) add('meaning', 'His', MB, 'Her', A)
  if (MA && MB) add('meaning', 'His', MB, 'Her', MA)
  if (MB) add('meaning', A, 'Meets', MB)
  if (MA) add('meaning', B, 'Meets', MA)
  if (MA && MB) add('meaning', MA, 'And', MB)
  // Traditional ceremony
  add('tradition', 'LaDotDe', B)
  add('tradition', 'Toc', 'TocChez', B)
  add('tradition', A, B, 'Tradi')
  // Your words ("Lome", "Bahamas"…)
  W.forEach((w) => {
    add('words', A, B, 'In', w)
    add('words', w, 'Love', A, B)
  })

  const seen = new Set()
  return ideas
    .filter(({ tag }) => {
      const k = tag.toLowerCase()
      if (seen.has(k) || tag.length < 5) return false
      seen.add(k)
      return true
    })
    .map((x) => ({ ...x, long: x.tag.length > 26 }))
}

export function makeSlogans({ groom, bride, family, groomMeaning, brideMeaning } = {}, lang = 'fr') {
  const A = String(groom ?? '').trim().split(/\s+/)[0] || ''
  const B = String(bride ?? '').trim().split(/\s+/)[0] || ''
  if (!A && !B) return []
  const S = String(family ?? '').trim()
  const MA = String(groomMeaning ?? '').trim().toLowerCase()
  const MB = String(brideMeaning ?? '').trim().toLowerCase()
  const fr = [
    `${A} & ${B} : deux familles, un seul amour.`,
    'Du toc-toc à la porte jusqu’à toujours.',
    'Deux cœurs, deux familles, une seule histoire.',
    'Ensemble, c’est notre endroit préféré.',
    `L’amour est patient… et ${A} aussi !`,
    `${B} a dit oui, et nous voilà.`,
    'Le meilleur reste à venir.',
    'Unis par l’amour, portés par nos familles.',
    S ? `Bienvenue dans la famille ${S}, ${B} !` : null,
    MB ? `${B}, « ${MB} » : la plus belle chose arrivée à ${A}.` : null,
  ]
  const en = [
    `${A} & ${B}: two families, one love.`,
    'From a knock on the door to forever.',
    'Two hearts, two families, one story.',
    'Together is our favourite place to be.',
    `Love is patient… and so was ${A}!`,
    `${B} said yes, and here we are.`,
    'The best is yet to come.',
    'United by love, carried by our families.',
    S ? `Welcome to the ${S} family, ${B}!` : null,
    MB ? `His ${MB}, her ${MA || A}.` : null,
  ]
  return (lang === 'en' ? en : fr).filter(Boolean)
}
