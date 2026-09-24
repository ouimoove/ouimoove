import { describe, it, expect, vi } from 'vitest'
import { clickable, edgeErrorMessage } from '../utils/helpers.js'

// These import the real helpers (unlike the older tests, which re-implement
// their logic inline and so can't catch regressions in the actual code).

describe('clickable()', () => {
  it('makes an element a focusable button', () => {
    const props = clickable(() => {})
    expect(props.role).toBe('button')
    expect(props.tabIndex).toBe(0)
  })

  it('fires on click', () => {
    const fn = vi.fn()
    clickable(fn).onClick('evt')
    expect(fn).toHaveBeenCalledWith('evt')
  })

  it.each(['Enter', ' '])('fires on the %j key and prevents default scrolling', (key) => {
    const fn = vi.fn()
    const preventDefault = vi.fn()
    clickable(fn).onKeyDown({ key, preventDefault })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('ignores other keys', () => {
    const fn = vi.fn()
    clickable(fn).onKeyDown({ key: 'Tab', preventDefault: vi.fn() })
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('edgeErrorMessage()', () => {
  it('prefers the error in the response data', async () => {
    expect(await edgeErrorMessage(null, { error: 'Panier vide.' })).toBe('Panier vide.')
  })

  it('reads the JSON body of a non-2xx response', async () => {
    const error = { message: 'Edge Function returned a non-2xx status code', context: { json: async () => ({ error: 'Billet introuvable.' }) } }
    expect(await edgeErrorMessage(error, null)).toBe('Billet introuvable.')
  })

  it('falls back to the generic message when the body is not JSON', async () => {
    const error = { message: 'boom', context: { json: async () => { throw new Error('not json') } } }
    expect(await edgeErrorMessage(error, null)).toBe('boom')
  })

  it('returns null when there is nothing to report', async () => {
    expect(await edgeErrorMessage(null, null)).toBeNull()
  })
})
