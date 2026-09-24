import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, children, size = 'md' }) {
  const dialogRef = useRef(null)
  // Callers pass a fresh onClose every render; hold it in a ref so the focus
  // logic below runs only when the modal opens/closes, not on every re-render
  // (which would yank focus out of whatever the user is typing in).
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement

    // Move focus into the dialog so keyboard/screen-reader users land in it.
    // (The close button is first in the DOM; prefer the first form field if any.)
    const first = dialog?.querySelector('input, select, textarea') || dialog?.querySelector(FOCUSABLE)
    first?.focus({ preventScroll: true })

    const handler = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !dialog) return
      // Keep Tab cycling inside the open dialog.
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      // Give focus back to whatever opened the dialog.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <div
      className={[styles.overlay, open ? styles.active : ''].join(' ')}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      aria-hidden={!open}
    >
      <div ref={dialogRef} className={[styles.modal, styles[size]].join(' ')} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.sub}>{subtitle}</p>}
    </div>
  )
}

export function ModalBody({ children }) {
  return <div className={styles.body}>{children}</div>
}
