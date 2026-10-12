import { useEffect, useRef, useState } from 'react'

// Reports `shown = true` the first time the element scrolls into view, so cards
// can animate in as you reach them instead of all at once on page load.
// Visitors who prefer reduced motion (or browsers without IntersectionObserver)
// get everything shown straight away.
export function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (shown) return undefined
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [shown, threshold])
  return [ref, shown]
}
