import { useState } from 'react'

// Shared loading/error flags, keyed by domain (events/orders/orgOrders/stats/
// resale/feed) — several domain hooks read and write into the same
// `loading`/`errors` objects that components already destructure as
// `store.loading.events`, `store.loading.resale`, etc. Keeping this as one
// small hook composed once in useStore.js preserves that exact shape.
export function useAsyncStatus() {
  const [loading, setLoading] = useState({
    events: true, orders: false, orgOrders: false, stats: false, resale: false, feed: false,
  })
  const [errors, setErrors] = useState({
    events: null, orders: null, orgOrders: null, stats: null, resale: null, feed: null,
  })

  const setLoad = (k, v) => setLoading((p) => ({ ...p, [k]: v }))
  const setErr  = (k, v) => setErrors((p) => ({ ...p, [k]: v }))

  return { loading, errors, setLoad, setErr }
}
