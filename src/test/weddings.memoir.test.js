// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildMemoir, memoirStats, pdfSafe } from '../weddings/lib/memoir.js'
import { buildPlan } from '../weddings/lib/plan.js'

function sample() {
  const plan = buildPlan({
    groomName: 'Desire', brideName: 'Keli', groomCulture: 'ewe', brideCulture: 'ewe', country: 'TG', city: 'Lomé', currency: 'XOF',
    steps: { knocking: { on: true, date: '2027-03-06' }, dowry: { on: true, date: '2027-06-12' }, civil: { on: true }, religious: { on: true, date: '2027-12-01', variant: 'church' }, reception: { on: true, date: '2027-12-01' }, honeymoon: { on: true, date: '2027-12-04', venue: 'Bahamas' } },
    guestTarget: 200, budgetTotal: 15000000,
  }, 'fr', '2026-10-12')
  const guests = Array.from({ length: 70 }, (_, i) => ({ id: `g${i}`, name: i === 3 ? 'Ɖɔdzi Ɛyram 🎉' : `Invité ${i}`, side: i % 3 === 0 ? 'bride' : i % 3 === 1 ? 'groom' : 'both', grp: 'family', seats: 1 + (i % 2), priority: 1, status: 'in', rsvp: i % 4 ? 'yes' : 'pending' }))
  return {
    wedding: { ...plan.wedding, created_at: '2026-10-12T10:00:00Z', hashtag: '#HisLightHerDesire', slogan: 'Deux cœurs, deux familles, une seule histoire.' },
    rows: {
      ...plan, guests, tables: [{ id: 't1' }],
      rsvps: [{ name: 'Tata Ama', message: 'Que Dieu bénisse votre union ! 🙏', attending: true }],
      members: [],
      budget: plan.budget.map((b, i) => (i === 0 ? { ...b, status: 'booked', vendor_name: 'Hôtel 2 Février' } : b)),
    },
  }
}

describe('memoir', () => {
  it('keeps French accents and maps letters plain PDF fonts cannot draw', () => {
    expect(pdfSafe('Désiré & Kéli — œ')).toBe('Désiré & Kéli — œ')
    expect(pdfSafe('Ɖɔdzi Ɛyram 🎉')).toBe('Dodzi Eyram')
    expect(pdfSafe('1 500 000 FCFA')).toBe('1 500 000 FCFA')
  })

  it('computes the keepsake numbers', () => {
    const { wedding, rows } = sample()
    const st = memoirStats({ wedding, rows })
    expect(st.main).toBe('2027-12-01')
    expect(st.steps).toBe(6)
    expect(st.invitedSeats).toBeGreaterThan(70)
    expect(st.vendors).toBe(1)
    expect(st.messages).toBe(1)
  })

  it('builds a multi-page A5 PDF in French and English', async () => {
    for (const lang of ['fr', 'en']) {
      const doc = await buildMemoir(sample(), lang, { budget: true })
      expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(6)
      const bytes = doc.output('arraybuffer')
      expect(bytes.byteLength).toBeGreaterThan(5000)
      expect(Math.round(doc.internal.pageSize.getWidth())).toBe(148)
    }
  })
})
