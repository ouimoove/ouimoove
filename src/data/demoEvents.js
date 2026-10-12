// Development-only sample events, so the homepage can be designed and checked
// with a full catalogue: open http://localhost:5173/?demo
// App.jsx only reads this behind `import.meta.env.DEV`, so it is removed from
// the production build and can never reach real visitors.
const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const tk = (id, name, price, total = 200, sold = 40) => ({ id, name, price, total, sold })

export const makeDemoEvents = () => [
  { id: 'demo-1', title: 'Festival Afrobeats Lomé', category: 'Festival', date: day(6), time: '19:00', location: 'Stade de Kégué', city: 'Lomé', desc: 'Trois scènes, vingt artistes, une nuit entière de musique.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Aurum Events', tickets: [tk('d1a', 'Standard', 5000), tk('d1b', 'VIP', 15000, 80, 10)] },
  { id: 'demo-2', title: 'Soirée Jazz au bord de l’eau', category: 'Musique', date: day(9), time: '20:30', location: 'Hôtel du Lac', city: 'Lomé', desc: 'Un quartet live, des cocktails et le coucher de soleil.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Jazz Club Lomé', tickets: [tk('d2a', 'Entrée', 8000)] },
  { id: 'demo-3', title: 'Lomé Tech Meetup', category: 'Tech', date: day(12), time: '17:00', location: 'Cowork Hub', city: 'Lomé', desc: 'Démos de startups et réseautage.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Togo Devs', tickets: [tk('d3a', 'Gratuit', 0)] },
  { id: 'demo-4', title: 'Tournoi de football des quartiers', category: 'Sport', date: day(15), time: '15:00', location: 'Stade municipal', city: 'Cotonou', desc: 'Seize équipes, une seule coupe.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Ligue Locale', tickets: [tk('d4a', 'Supporter', 1500)] },
  { id: 'demo-5', title: 'Nuit de la gastronomie', category: 'Gastronomie', date: day(20), time: '19:30', location: 'Palais des Congrès', city: 'Lomé', desc: 'Dix chefs, un menu dégustation.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Chefs Associés', tickets: [tk('d5a', 'Dégustation', 12000), tk('d5b', 'Accords mets-vins', 25000, 60, 5)] },
  { id: 'demo-6', title: 'Exposition Art & Culture', category: 'Culturel', date: day(24), time: '10:00', location: 'Institut Français', city: 'Accra', desc: 'Peinture, sculpture et performances.', emoji: '', imageUrl: null, isPrivate: false, status: 'published', organizerName: 'Galerie Nord-Sud', tickets: [tk('d6a', 'Entrée', 2000)] },
]

// Development-only: a fake signed-in account with two purchases, so the account
// popups (Mes billets, Profil) can be reviewed at /?demo&modal=tickets or
// /?demo&modal=profile. Same rule as above: compiled out of production.
export const DEMO_USER = { id: 'demo-user', name: 'Amina Traoré', email: 'amina@example.com' }
export const makeDemoPurchases = () => [
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000001', status: 'paid', total: 10000, date: new Date().toISOString(),
    items: [{ id: 'i1', eventId: 'demo-1', ticketTypeId: 'd1a', eventTitle: 'Festival Afrobeats Lomé', ticketName: 'Standard', qty: 2, price: 5000, checkedIn: false, resold: false, isResale: false }],
  },
  {
    id: 'e5f6a7b8-0000-4000-8000-000000000002', status: 'paid', total: 8000, date: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [{ id: 'i2', eventId: 'demo-2', ticketTypeId: 'd2a', eventTitle: 'Soirée Jazz au bord de l’eau', ticketName: 'Entrée', qty: 1, price: 8000, checkedIn: true, resold: false, isResale: false }],
  },
]

// The only thing App.jsx imports. In a production build import.meta.env.DEV is the
// constant false, so DEMO is null and all of the sample data above is dropped.
export const makeDemoListings = () => [
  { id: 'dl-1', seller_id: 'someone', event_title: 'Festival Afrobeats Lomé', event_date: day(6), event_city: 'Lomé', event_image_url: null, ticket_name: 'VIP', quantity: 2, ask_price_cfa: 14000 },
  { id: 'dl-2', seller_id: 'demo-user', event_title: 'Soirée Jazz au bord de l’eau', event_date: day(9), event_city: 'Lomé', event_image_url: null, ticket_name: 'Entrée', quantity: 1, ask_price_cfa: 8000 },
  { id: 'dl-3', seller_id: 'someone', event_title: 'Nuit de la gastronomie', event_date: day(20), event_city: 'Lomé', event_image_url: null, ticket_name: 'Dégustation', quantity: 1, ask_price_cfa: 11000 },
]

export const makeDemoStats = () => ({
  published_events: 6, total_tickets_sold: 412, total_revenue_cfa: 2180000, unique_attendees: 301,
  events_breakdown: makeDemoEvents().slice(0, 3).map((e, i) => ({ event_id: e.id, title: e.title, event_date: e.date, tickets_sold: [210, 130, 72][i], revenue_cfa: [1450000, 520000, 210000][i], attendee_count: [160, 90, 51][i] })),
})

export const DEMO = import.meta.env.DEV ? { events: makeDemoEvents, purchases: makeDemoPurchases, user: DEMO_USER, listings: makeDemoListings, favorites: ['demo-1', 'demo-3', 'demo-5'], stats: makeDemoStats } : null
