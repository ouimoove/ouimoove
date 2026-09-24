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

// Props that make a non-button element (span/div) behave like a button for
// keyboard and screen-reader users: focusable, announced as a button, and
// activated by Enter or Space as well as click. Prefer a real <button> where
// styling allows; this is for places where an existing span/div carries the styling.
export function clickable(handler) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e) }
    },
  }
}
