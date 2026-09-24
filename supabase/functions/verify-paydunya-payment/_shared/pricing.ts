// Server-side source of truth for what an order costs. The browser only says
// WHICH tickets/listing it wants (ids + quantities + an optional promo code);
// every price, discount and total is recomputed here from the database, so a
// tampered cart, price or discount from the client can never change what is
// charged — or what a payment is later accepted as.
//
// NOTE: this file is duplicated verbatim into create-paydunya-payment,
// verify-paydunya-payment and paydunya-webhook (Supabase functions can't
// import across function folders). Keep the three copies identical.

// deno-lint-ignore no-explicit-any
type Admin = any

// Discount codes live here, not in the browser bundle. Percent off the cart.
export const PROMO_CODES: Record<string, { pct: number; label: string }> = {
  WELCOME20:  { pct: 20, label: '20% de réduction' },
  OUIMOOVE10: { pct: 10, label: '10% de réduction' },
  VIP50:      { pct: 50, label: '50% de réduction' },
  TOGO2025:   { pct: 15, label: '15% de réduction' },
}

export const RESALE_FEE_RATE = 0.10
export const MAX_TICKETS_PER_ORDER = 10

export type CartLine = { ticketTypeId: string; qty: number }

export type PricedCart = {
  ok: true
  rawTotal: number
  discount: number
  total: number
  promoCode: string | null
  lines: Array<{
    ticketTypeId: string; eventId: string; eventTitle: string; ticketName: string
    price: number; qty: number
  }>
}
export type PriceError = { ok: false; error: string }

export async function priceCart(
  admin: Admin,
  rawLines: unknown,
  rawPromo: unknown,
  // At completion the customer has already paid: skip the stock/date/status
  // gates (a sell-out between checkout and payment must not orphan a paid
  // order) and only recompute the price.
  opts: { forCompletion?: boolean } = {},
): Promise<PricedCart | PriceError> {
  if (!Array.isArray(rawLines) || rawLines.length === 0) return { ok: false, error: 'Panier vide.' }

  // Merge duplicate ticket types and validate quantities.
  const qtyById = new Map<string, number>()
  for (const l of rawLines as CartLine[]) {
    const qty = Number(l?.qty)
    if (!l?.ticketTypeId || !Number.isInteger(qty) || qty < 1) return { ok: false, error: 'Panier invalide.' }
    qtyById.set(l.ticketTypeId, (qtyById.get(l.ticketTypeId) ?? 0) + qty)
  }
  const totalQty = [...qtyById.values()].reduce((a, b) => a + b, 0)
  if (totalQty > MAX_TICKETS_PER_ORDER) return { ok: false, error: `Maximum ${MAX_TICKETS_PER_ORDER} billets par commande.` }

  const { data: types, error } = await admin
    .from('ticket_types')
    .select('id, name, price_cfa, quantity_total, quantity_sold, event_id, events(id, title, date, status)')
    .in('id', [...qtyById.keys()])
  if (error || !types || types.length !== qtyById.size) return { ok: false, error: 'Billet introuvable.' }

  const today = new Date().toISOString().slice(0, 10)
  const lines: PricedCart['lines'] = []
  for (const t of types) {
    const ev = Array.isArray(t.events) ? t.events[0] : t.events
    const qty = qtyById.get(t.id)!
    if (!ev) return { ok: false, error: 'Événement indisponible.' }
    if (!opts.forCompletion) {
      if (ev.status !== 'published') return { ok: false, error: 'Événement indisponible.' }
      if (ev.date < today) return { ok: false, error: 'Un des événements est déjà passé.' }
      if ((t.quantity_sold || 0) + qty > t.quantity_total) return { ok: false, error: `Plus assez de billets « ${t.name} ».` }
    }
    lines.push({
      ticketTypeId: t.id, eventId: t.event_id, eventTitle: ev.title,
      ticketName: t.name, price: Number(t.price_cfa) || 0, qty,
    })
  }

  const rawTotal = lines.reduce((s, l) => s + l.price * l.qty, 0)

  let discount = 0
  let promoCode: string | null = null
  if (rawPromo !== undefined && rawPromo !== null && String(rawPromo).trim() !== '') {
    const code = String(rawPromo).trim().toUpperCase()
    const promo = PROMO_CODES[code]
    if (!promo) return { ok: false, error: 'Code promo invalide ou expiré.' }
    promoCode = code
    discount = Math.round(rawTotal * promo.pct / 100)
  }

  return { ok: true, rawTotal, discount, total: Math.max(0, rawTotal - discount), promoCode, lines }
}

export type PricedListing = {
  ok: true
  total: number
  listing: {
    id: string; sellerId: string; eventId: string; ticketTypeId: string
    quantity: number; askPrice: number; orderItemId: string
    eventTitle: string; ticketName: string
  }
}

export async function priceListing(
  admin: Admin,
  listingId: unknown,
  buyerId: string,
  // On completion the listing is already 'reserved' for this buyer; at
  // creation time it must still be 'active'.
  expectStatus: 'active' | 'reserved',
): Promise<PricedListing | PriceError> {
  if (!listingId) return { ok: false, error: 'Annonce invalide.' }
  const { data: l } = await admin
    .from('ticket_listings')
    .select('id, seller_id, buyer_id, status, event_id, ticket_type_id, quantity, ask_price_cfa, order_item_id, event_title, ticket_name')
    .eq('id', listingId)
    .maybeSingle()
  if (!l) return { ok: false, error: 'Annonce introuvable.' }
  if (l.seller_id === buyerId) return { ok: false, error: 'Vous ne pouvez pas acheter votre propre annonce.' }
  if (l.status !== expectStatus) return { ok: false, error: 'Cette annonce n’est plus disponible.' }
  if (expectStatus === 'reserved' && l.buyer_id !== buyerId) return { ok: false, error: 'Annonce réservée par un autre acheteur.' }

  const ask = Number(l.ask_price_cfa) || 0
  const fee = Math.round(ask * RESALE_FEE_RATE)
  return {
    ok: true,
    total: ask + fee,
    listing: {
      id: l.id, sellerId: l.seller_id, eventId: l.event_id, ticketTypeId: l.ticket_type_id,
      quantity: l.quantity, askPrice: ask, orderItemId: l.order_item_id,
      eventTitle: l.event_title, ticketName: l.ticket_name,
    },
  }
}
