export function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function minPrice(event) {
  return Math.min(...event.tickets.map((t) => t.price))
}

export function fmtPrice(n) {
  if (n === 0) return 'Gratuit'
  return n.toLocaleString('fr-FR') + ' FCFA'
}

// supabase.functions.invoke() reports any non-2xx response as a generic
// "Edge Function returned a non-2xx status code"; the useful message our
// functions send ({ error: '...' }) is in the response body on error.context.
export async function edgeErrorMessage(error, data) {
  if (data?.error) return data.error
  try {
    const body = await error?.context?.json?.()
    if (body?.error) return body.error
  } catch { /* body wasn't JSON */ }
  return error?.message || null
}
