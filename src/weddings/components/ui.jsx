import { useEffect, useRef, useState } from 'react'
import { Modal, ModalHeader, ModalBody } from '../../components/Modal.jsx'
import { useI18n } from '../i18n.jsx'
import { parseMoney, firstWord, moneyParts } from '../lib/basics.js'
import s from '../weddings.module.css'

export const cx = (...a) => a.filter(Boolean).join(' ')
export { s as styles }

const VARIANT = { primary: s.btnPrimary, accent: s.btnAccent, ghost: s.btnGhost, subtle: s.btnSubtle, danger: s.btnDanger }

export function Btn({ variant = 'ghost', size, block, icon, className, children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={cx(s.btn, VARIANT[variant], size === 'sm' && s.btnSm, size === 'icon' && s.btnIcon, block && s.btnBlock, className)}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

// A labelled control. Use `group` when the content is several buttons or
// controls (a <label> would hand its text to the first button).
export function Field({ label, hint, children, className, group }) {
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className={cx(s.field, className)} role={group ? 'group' : undefined} aria-label={group && typeof label === 'string' ? label : undefined}>
      {label && <span className={s.label}>{label}</span>}
      {children}
      {hint && <span className={s.hint}>{hint}</span>}
    </Tag>
  )
}
export const Input = ({ className, ...p }) => <input className={cx(s.input, className)} {...p} />
export const Select = ({ className, children, ...p }) => <select className={cx(s.select, className)} {...p}>{children}</select>
export const Textarea = ({ className, ...p }) => <textarea className={cx(s.textarea, className)} {...p} />

// Number field that shows "1 500 000" while typing and returns a number.
export function MoneyInput({ value, onChange, className, ...rest }) {
  const { lang } = useI18n()
  const fmt = (n) => (n ? Number(n).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR') : '')
  const [text, setText] = useState(fmt(value))
  const focused = useRef(false)
  useEffect(() => { if (!focused.current) setText(fmt(value)) }, [value, lang]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      inputMode="numeric"
      className={cx(s.input, s.num, className)}
      value={text}
      onFocus={() => { focused.current = true }}
      onBlur={() => { focused.current = false; setText(fmt(parseMoney(text))) }}
      onChange={(e) => { setText(e.target.value); onChange?.(parseMoney(e.target.value)) }}
      {...rest}
    />
  )
}

// Saves on blur or Enter, so typing doesn't send a request per key.
export function InlineText({ value, onSave, placeholder, className, multiline, maxLength = 200, ...rest }) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => { setV(value ?? '') }, [value])
  const commit = () => { const t = v.trim(); if (t !== (value ?? '').trim()) onSave(t) }
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <Tag
      className={cx(multiline ? s.textarea : s.inputBare, className)}
      value={v}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (!multiline && e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setV(value ?? ''); e.currentTarget.blur() } }}
      {...rest}
    />
  )
}

export function InlineMoney({ value, onSave, className, style, bare = true, ...rest }) {
  const { lang } = useI18n()
  const fmt = (n) => (n ? Number(n).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR') : '')
  const [v, setV] = useState(fmt(value))
  useEffect(() => { setV(fmt(value)) }, [value, lang]) // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => { const n = parseMoney(v); setV(fmt(n)); if (n !== (Number(value) || 0)) onSave(n) }
  return (
    <input
      inputMode="numeric"
      className={cx(bare ? s.inputBare : s.input, s.num, className)}
      style={{ textAlign: 'right', ...style }}
      value={v}
      placeholder="0"
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      {...rest}
    />
  )
}

export function InlineNumber({ value, onSave, min = 0, max = 100000, className, style, bare = true, ...rest }) {
  const [v, setV] = useState(String(value ?? ''))
  useEffect(() => { setV(String(value ?? '')) }, [value])
  const commit = () => {
    const n = Math.min(max, Math.max(min, parseInt(v, 10) || 0))
    setV(String(n))
    if (n !== Number(value)) onSave(n)
  }
  return (
    <input
      type="number" inputMode="numeric" min={min} max={max}
      className={cx(bare ? s.inputBare : s.input, s.num, className)} style={{ textAlign: 'right', ...style }}
      value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      {...rest}
    />
  )
}

export function Card({ title, sub, actions, children, tight, className, id }) {
  return (
    <section className={cx(s.card, tight && s.cardTight, className)} id={id}>
      {(title || actions) && (
        <div className={s.cardHead}>
          <div className={s.grow}>
            {title && <h2 className={s.cardTitle}>{title}</h2>}
            {sub && <p className={s.cardSub}>{sub}</p>}
          </div>
          {actions && <div className={s.rowWrap}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

// A big number with its currency in small type ("13 550 000 FCFA"), so long
// amounts still fit a narrow card.
export function Amount({ value, currency }) {
  const { lang } = useI18n()
  const p = moneyParts(value, currency, lang)
  const unit = <small className={s.unit}>{p.unit}</small>
  return p.before
    ? <span className={s.nowrap}>{p.sign}{unit}{p.num}</span>
    : <><span className={s.nowrap}>{p.sign}{p.num}</span> {unit}</>
}

// Pass `amount` (+ `currency`) for money, `value` for anything else.
export function Stat({ value, amount, currency, label, sub, tone }) {
  const { lang } = useI18n()
  const text = amount != null ? moneyParts(amount, currency, lang).num : typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  const size = text.length > 11 ? s.statValXs : text.length > 8 ? s.statValSm : null
  return (
    <div className={s.stat}>
      <div className={cx(s.statVal, size)} style={tone ? { color: tone } : undefined}>
        {amount != null ? <Amount value={amount} currency={currency} /> : value}
      </div>
      <div className={s.statLabel}>{label}</div>
      {sub && <div className={s.statSub}>{sub}</div>}
    </div>
  )
}

// parts: [{ value, className }], drawn against max(total, sum)
export function Progress({ parts, total, label }) {
  const sum = parts.reduce((a, p) => a + (p.value || 0), 0)
  const denom = Math.max(total || 0, sum) || 1
  return (
    <div className={cx(s.progress, total && sum > total && s.progressOver)} role="img" aria-label={label}>
      {parts.map((p, i) => <i key={i} className={p.className} style={{ width: `${(100 * (p.value || 0)) / denom}%` }} />)}
    </div>
  )
}

const TONE = { groom: s.chipGroom, bride: s.chipBride, good: s.chipGood, bad: s.chipBad, info: s.chipInfo, gold: s.chipGold, plum: s.chipPlum }
export function Chip({ tone, children, onClick, title, className }) {
  const Tag = onClick ? 'button' : 'span'
  return <Tag type={onClick ? 'button' : undefined} className={cx(s.chip, TONE[tone], className)} onClick={onClick} title={title}>{children}</Tag>
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Empty({ icon, children, action }) {
  return (
    <div className={s.empty}>
      {icon && <span className={s.emptyIcon} aria-hidden="true">{icon}</span>}
      <div>{children}</div>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

export function PageHead({ title, sub, actions }) {
  return (
    <header className={s.pageHead}>
      <div>
        <h1 className={s.pageTitle}>{title}</h1>
        {sub && <p className={s.pageSub}>{sub}</p>}
      </div>
      {actions && <div className={s.pageActions}>{actions}</div>}
    </header>
  )
}

export function Names({ wedding, size = '1.6rem', className }) {
  const a = firstWord(wedding?.groom_name), b = firstWord(wedding?.bride_name)
  return (
    <span className={cx(s.names, className)} style={{ fontSize: size }}>
      {a || '…'}<span className={s.amp}>&amp;</span>{b || '…'}
    </span>
  )
}

export function Sheet({ open, onClose, title, sub, size = 'md', children }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} size={size}>
      <ModalHeader title={title} subtitle={sub} />
      <ModalBody>{children}</ModalBody>
    </Modal>
  )
}

// Two taps to delete: avoids losing data to a stray tap on a phone.
export function ConfirmBtn({ onConfirm, children, confirmLabel, size = 'sm', variant = 'danger', ...rest }) {
  const { tx } = useI18n()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <Btn variant={variant} size={size} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))} {...rest}>
      {armed ? (confirmLabel || tx('Confirmer ?', 'Confirm?')) : children}
    </Btn>
  )
}

export function Spinner({ label }) {
  return (
    <div className={s.loader}>
      <div className={s.spin} />
      {label && <div className={s.small}>{label}</div>}
    </div>
  )
}

// Copies text and tells the person it worked.
export async function copyText(text, toast, tx) {
  try {
    await navigator.clipboard.writeText(text)
    toast?.(tx('Copié ✓', 'Copied ✓'), 'success')
  } catch {
    toast?.(tx('Impossible de copier', 'Could not copy'), 'error')
  }
}
