import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Chip, Field, Input, MoneyInput, Select, Seg, cx, styles as s } from '../components/ui.jsx'
import { CULTURES, REGIONS, cultureOf, culturesForCountry } from '../data/cultures.js'
import { STEPS, STEP_KINDS, RELIGIOUS_VARIANTS, BUDGET_CATEGORIES, COUNTRIES, COUNTRY_BY_CODE, CURRENCIES } from '../data/templates.js'
import { buildPlan, allocateBudget, suggestedExtras, dateWarnings } from '../lib/plan.js'
import { formatMoney } from '../lib/basics.js'
import { Icon } from '../../components/Icon.jsx'

const DRAFT_KEY = 'om_wedding_draft'
const DEFAULTS = {
  groomName: '', brideName: '', familyName: '', role: 'groom',
  country: 'TG', city: '', groomCulture: '', brideCulture: '', currency: 'XOF',
  steps: Object.fromEntries(STEP_KINDS.map((k) => [k, { on: true }])),
  extras: [],
  guestTarget: 200, budgetTotal: 0, splurge: [], save: [],
}
const loadDraft = () => { try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d ? { ...DEFAULTS, ...d } : null } catch { return null } }
const saveDraft = (a) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(a)) } catch { /* ignore */ } }
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }

const ROLES = [
  { id: 'groom', icon: '🤵', fr: 'Le marié', en: 'The groom' },
  { id: 'bride', icon: '👰', fr: 'La mariée', en: 'The bride' },
  { id: 'planner', icon: '🗂️', fr: 'Organisateur·rice', en: 'Planner' },
  { id: 'family', icon: '👪', fr: 'Un proche', en: 'Family or friend' },
]

export function Wizard() {
  const { tx, L, lang } = useI18n()
  const store = useWedding()
  const { go, toast } = useUI()
  const [step, setStep] = useState(0)
  const [a, setA] = useState(() => loadDraft() || DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [customExtra, setCustomExtra] = useState('')
  useEffect(() => { saveDraft(a) }, [a])

  const set = (patch) => setA((prev) => ({ ...prev, ...patch }))
  const setStepField = (kind, patch) => setA((prev) => ({ ...prev, steps: { ...prev.steps, [kind]: { ...prev.steps[kind], ...patch } } }))
  const mainCulture = a.brideCulture || a.groomCulture || 'other'
  const variant = a.steps.religious?.variant || cultureOf(mainCulture).religious || 'church'
  const kinds = STEP_KINDS.filter((k) => a.steps[k]?.on)
  const answers = useMemo(() => ({ ...a, steps: { ...a.steps, religious: { ...a.steps.religious, variant } } }), [a, variant])
  const preview = useMemo(() => (step === 5 ? buildPlan(answers, lang) : null), [step, answers, lang])

  const SCREENS = [
    { q: tx('Qui se marie ?', "Who's getting married?"), ok: !!(a.groomName.trim() || a.brideName.trim()) },
    { q: tx("D'où viennent vos familles ?", 'Where are your families from?'), ok: !!(a.groomCulture || a.brideCulture) },
    { q: tx('Quelles étapes allez-vous célébrer ?', 'Which steps will you celebrate?'), ok: kinds.length > 0 },
    { q: tx('Quand ?', 'When?'), ok: true },
    { q: tx('Combien d’invités, et quel budget ?', 'How many guests, and what budget?'), ok: true },
    { q: tx('Votre plan est prêt', 'Your plan is ready'), ok: true },
  ]
  const screen = SCREENS[step]

  const create = async () => {
    setBusy(true)
    const id = await store.createWedding(buildPlan(answers, lang))
    setBusy(false)
    if (id) {
      clearDraft()
      toast(tx('Votre mariage est prêt', 'Your wedding is ready'), 'success')
      go('')
    }
  }

  const cultureSelect = (value, onChange, label) => {
    const local = culturesForCountry(a.country)
    return (
      <Field label={label}>
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{tx('Choisir…', 'Choose…')}</option>
          {local.length > 0 && (
            <optgroup label={`${tx('Suggestions', 'Suggested')} · ${L(COUNTRY_BY_CODE[a.country]) || a.country}`}>
              {local.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </optgroup>
          )}
          {REGIONS.map((r) => (
            <optgroup key={r.id} label={L(r)}>
              {CULTURES.filter((c) => c.region === r.id).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </optgroup>
          ))}
        </Select>
      </Field>
    )
  }

  const extras = suggestedExtras(a.groomCulture, a.brideCulture)
  const hasExtra = (id) => a.extras.some((x) => x.id === id)
  const toggleExtra = (x) => set({ extras: hasExtra(x.id) ? a.extras.filter((e) => e.id !== x.id) : [...a.extras, { id: x.id, title: L(x), date: '' }] })
  const warnings = dateWarnings(a.steps)
  const plannedCats = BUDGET_CATEGORIES.filter((c) => !c.needs || c.needs.some((k) => kinds.includes(k)))
  const toggleIn = (key, id) => set({ [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id], ...(key === 'splurge' ? { save: a.save.filter((x) => x !== id) } : { splurge: a.splurge.filter((x) => x !== id) }) })

  return (
    <div className={s.wizard}>
      <div className={s.wizTop}>
        <div className={s.wizDots} aria-label={tx(`Étape ${step + 1} sur 6`, `Step ${step + 1} of 6`)}>
          {SCREENS.map((_, i) => <span key={i} className={cx(s.wizDot, i === step && s.wizDotOn, i < step && s.wizDotDone)} />)}
        </div>
        <Btn size="sm" variant="subtle" onClick={() => go('')}>{tx('Quitter', 'Exit')}</Btn>
      </div>

      <h1 className={s.wizQ}>{screen.q}</h1>

      {step === 0 && (
        <div className={s.stack}>
          <p className={s.muted}>{tx('Les prénoms servent au site, au hashtag et à votre mémoire.', 'First names are used for your website, hashtag and memoir.')}</p>
          <div className={s.grid2}>
            <Field label={tx('Prénom du marié', "Groom's first name")}><Input value={a.groomName} maxLength={80} onChange={(e) => set({ groomName: e.target.value })} placeholder="Desire" /></Field>
            <Field label={tx('Prénom de la mariée', "Bride's first name")}><Input value={a.brideName} maxLength={80} onChange={(e) => set({ brideName: e.target.value })} placeholder="Keli" /></Field>
          </div>
          <Field label={tx('Nom de famille (facultatif)', 'Family name (optional)')} hint={tx('Pour des hashtags comme #DevenirAkoda.', 'For hashtags like #BecomingAkoda.')}>
            <Input value={a.familyName} maxLength={80} onChange={(e) => set({ familyName: e.target.value })} />
          </Field>
          <div className={s.label}>{tx('Vous êtes…', 'You are…')}</div>
          <div className={s.optionGrid}>
            {ROLES.map((r) => (
              <button key={r.id} type="button" className={cx(s.option, a.role === r.id && s.optionOn)} aria-pressed={a.role === r.id} onClick={() => set({ role: r.id })}>
                <span className={s.optionIcon} aria-hidden="true"><Icon glyph={r.icon} /></span>
                <span className={s.optionTitle}>{L(r)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={s.stack}>
          <div className={s.grid2}>
            <Field label={tx('Pays du mariage', 'Wedding country')}>
              <Select value={a.country} onChange={(e) => set({ country: e.target.value, currency: COUNTRY_BY_CODE[e.target.value]?.currency || a.currency })}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{L(c)}</option>)}
              </Select>
            </Field>
            <Field label={tx('Ville', 'City')}><Input value={a.city} maxLength={80} onChange={(e) => set({ city: e.target.value })} placeholder="Lomé" /></Field>
          </div>
          <div className={s.grid2}>
            {cultureSelect(a.groomCulture, (v) => set({ groomCulture: v }), tx('Famille du marié', "Groom's family"))}
            {cultureSelect(a.brideCulture, (v) => set({ brideCulture: v }), tx('Famille de la mariée', "Bride's family"))}
          </div>
          <div className={cx(s.banner, s.bannerInfo)}>
            {tx(
              "La dot suit en général les coutumes de la famille de la mariée : c'est elle qui donne la liste. Votre première liste partira de sa culture, et vous pourrez tout modifier.",
              "The dowry usually follows the customs of the bride's family: they give the list. Your first list will start from her family's culture, and you can change everything.",
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={s.stack}>
          <div className={s.optionGrid}>
            {STEP_KINDS.map((k) => {
              const on = !!a.steps[k]?.on
              const term = cultureOf(mainCulture).terms?.[k]
              const icon = k === 'religious' ? RELIGIOUS_VARIANTS[variant].icon : STEPS[k].icon
              return (
                <button key={k} type="button" className={cx(s.option, on && s.optionOn)} aria-pressed={on} onClick={() => setStepField(k, { on: !on })}>
                  <span className={s.optionIcon} aria-hidden="true"><Icon glyph={icon} /></span>
                  <span>
                    <span className={s.optionTitle}>{L(STEPS[k])}{term && L(term) !== L(STEPS[k]) && <span className={s.muted} style={{ fontWeight: 500 }}> · {L(term)}</span>}</span>
                    <span className={s.optionText} style={{ display: 'block' }}>{L(STEPS[k].blurb)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {a.steps.religious?.on && (
            <Field group label={tx('Cérémonie religieuse', 'Religious ceremony')}>
              <div><Seg value={variant} onChange={(v) => setStepField('religious', { variant: v })} options={Object.entries(RELIGIOUS_VARIANTS).map(([id, v]) => ({ value: id, label: `${L(v)}` }))} /></div>
            </Field>
          )}
          <div>
            <div className={s.label} style={{ marginBottom: 8 }}>{tx('Autres moments à prévoir ?', 'Other events to plan?')}</div>
            <div className={s.rowWrap}>
              {extras.map((x) => <Chip key={x.id} tone={hasExtra(x.id) ? 'plum' : undefined} onClick={() => toggleExtra(x)}>{hasExtra(x.id) ? '✓ ' : '+ '}{L(x)}</Chip>)}
              {a.extras.filter((x) => !extras.some((e) => e.id === x.id)).map((x) => (
                <Chip key={x.id} tone="plum" onClick={() => set({ extras: a.extras.filter((e) => e.id !== x.id) })}>✓ {x.title}</Chip>
              ))}
            </div>
            <form className={s.row} style={{ marginTop: 10, maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); const t = customExtra.trim(); if (t) { set({ extras: [...a.extras, { id: `custom-${Date.now()}`, title: t, date: '' }] }); setCustomExtra('') } }}>
              <Input value={customExtra} maxLength={80} onChange={(e) => setCustomExtra(e.target.value)} placeholder={tx('Ex. : messe d’action de grâce', 'e.g. thanksgiving service')} />
              <Btn type="submit" size="sm">{tx('Ajouter', 'Add')}</Btn>
            </form>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={s.stack}>
          <p className={s.muted}>{tx('Pas encore décidé ? Laissez vide : vous ajouterez les dates plus tard, et vos tâches se dateront toutes seules.', "Not decided yet? Leave it empty: add the dates later and your tasks will date themselves.")}</p>
          <div className={s.card}>
            {kinds.map((k) => (
              <div key={k} className={s.stepRow}>
                <div className={s.strong}><Icon glyph={k === 'religious' ? RELIGIOUS_VARIANTS[variant].icon : STEPS[k].icon} /> {k === 'religious' ? L(RELIGIOUS_VARIANTS[variant]) : L(STEPS[k])}</div>
                <Field label={k === 'honeymoon' ? tx('Départ', 'Departure') : 'Date'}>
                  <Input type="date" value={a.steps[k]?.date || ''} onChange={(e) => setStepField(k, { date: e.target.value })} />
                </Field>
                {k === 'honeymoon' ? (
                  <Field label={tx('Retour', 'Return')}><Input type="date" value={a.steps[k]?.endDate || ''} min={a.steps[k]?.date || undefined} onChange={(e) => setStepField(k, { endDate: e.target.value })} /></Field>
                ) : (
                  <Field label={tx('Ville ou lieu', 'City or venue')}><Input value={a.steps[k]?.city ?? ''} maxLength={80} placeholder={a.city || ''} onChange={(e) => setStepField(k, { city: e.target.value })} /></Field>
                )}
              </div>
            ))}
            {a.steps.honeymoon?.on && (
              <div className={s.stepRow}>
                <div className={s.muted}>{tx('Destination', 'Destination')}</div>
                <Field label={tx('Où ?', 'Where?')}><Input value={a.steps.honeymoon.venue || ''} maxLength={80} placeholder="Zanzibar, Bahamas…" onChange={(e) => setStepField('honeymoon', { venue: e.target.value })} /></Field>
                <span />
              </div>
            )}
            {a.extras.map((x, i) => (
              <div key={x.id} className={s.stepRow}>
                <div className={s.strong}><Icon name="sparkles" /> {x.title}</div>
                <Field label="Date"><Input type="date" value={x.date || ''} onChange={(e) => set({ extras: a.extras.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)) })} /></Field>
                <span />
              </div>
            ))}
          </div>
          {warnings.length > 0 && (
            <div className={cx(s.banner, s.bannerWarn)}>
              {warnings.map(([x, y]) => (x === y
                ? tx('Le retour de lune de miel est avant le départ.', 'The honeymoon return is before the departure.')
                : tx(`« ${L(STEPS[y])} » est avant « ${L(STEPS[x])} » : c'est voulu ?`, `"${L(STEPS[y])}" is before "${L(STEPS[x])}": is that intended?`))).join(' ')}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className={s.stack}>
          <div className={s.grid2}>
            <Field label={tx("Nombre d'invités (environ)", 'Number of guests (roughly)')} hint={tx('Ou la capacité de votre salle. Vous ferez la liste ensuite.', 'Or your venue capacity. You will build the list next.')}>
              <Input type="number" min={0} max={100000} inputMode="numeric" value={a.guestTarget} onChange={(e) => set({ guestTarget: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
            </Field>
            <div className={s.rowWrap} style={{ alignSelf: 'end' }}>
              {[50, 100, 200, 300, 500].map((n) => <Chip key={n} tone={a.guestTarget === n ? 'plum' : undefined} onClick={() => set({ guestTarget: n })}>{n}</Chip>)}
            </div>
          </div>
          <div className={s.grid2}>
            <Field label={tx('Budget total', 'Total budget')} hint={tx('Toutes cérémonies comprises. Une estimation suffit.', 'All ceremonies included. An estimate is fine.')}>
              <MoneyInput value={a.budgetTotal} onChange={(n) => set({ budgetTotal: n })} placeholder="15 000 000" />
            </Field>
            <Field label={tx('Devise', 'Currency')}>
              <Select value={a.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c === 'XOF' || c === 'XAF' ? `${c} (FCFA)` : c}</option>)}
              </Select>
            </Field>
          </div>
          <div>
            <div className={s.label} style={{ marginBottom: 8 }}>{tx('Où voulez-vous mettre le paquet ?', 'Where do you want to splurge?')}</div>
            <div className={s.rowWrap}>{plannedCats.map((c) => <Chip key={c.id} tone={a.splurge.includes(c.id) ? 'gold' : undefined} onClick={() => toggleIn('splurge', c.id)}><Icon glyph={c.icon} /> {L(c)}</Chip>)}</div>
          </div>
          <div>
            <div className={s.label} style={{ marginBottom: 8 }}>{tx('Où pouvez-vous économiser ?', 'Where can you save?')}</div>
            <div className={s.rowWrap}>{plannedCats.map((c) => <Chip key={c.id} tone={a.save.includes(c.id) ? 'info' : undefined} onClick={() => toggleIn('save', c.id)}><Icon glyph={c.icon} /> {L(c)}</Chip>)}</div>
          </div>
        </div>
      )}

      {step === 5 && preview && (
        <Summary plan={preview} answers={answers} isLocal={!store.user} />
      )}

      <div className={s.wizFoot}>
        <Btn variant="ghost" onClick={() => (step ? setStep(step - 1) : go(''))}>{step ? tx('← Retour', '← Back') : tx('Annuler', 'Cancel')}</Btn>
        {step < 5 ? (
          <Btn variant="primary" disabled={!screen.ok} onClick={() => setStep(step + 1)}>{tx('Continuer', 'Continue')} →</Btn>
        ) : (
          <Btn variant="accent" disabled={busy} onClick={create}>{busy ? '…' : tx('Créer mon mariage', 'Create my wedding')}</Btn>
        )}
      </div>
    </div>
  )
}

function Summary({ plan, answers, isLocal }) {
  const { tx, L, lang, date } = useI18n()
  const kinds = plan.events.filter((e) => e.included && e.kind !== 'custom').map((e) => e.kind)
  const alloc = allocateBudget(plan.wedding.budget_total, kinds, answers.splurge, answers.save)
  const top = Object.entries(alloc).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).slice(0, 6)
  const events = plan.events.filter((e) => e.included).sort((x, y) => (x.event_date || '9999').localeCompare(y.event_date || '9999') || x.sort - y.sort)
  return (
    <div className={s.stack}>
      <p className={s.muted}>{tx('Voici ce que Ouimoove a préparé. Tout reste modifiable.', 'Here is what Ouimoove prepared. Everything stays editable.')}</p>
      <div className={s.summary}>
        <div className={s.stat}><div className={s.statVal}>{events.length}</div><div className={s.statLabel}>{tx('étapes', 'steps')}</div></div>
        <div className={s.stat}><div className={s.statVal}>{plan.tasks.length}</div><div className={s.statLabel}>{tx('tâches datées', 'dated tasks')}</div></div>
        <div className={s.stat}><div className={s.statVal}>{plan.dowry.length}</div><div className={s.statLabel}>{tx('articles de dot à valider', 'dowry items to confirm')}</div></div>
        <div className={s.stat}><div className={s.statVal}>{plan.wedding.guest_target}</div><div className={s.statLabel}>{tx('invités visés', 'target guests')}</div></div>
      </div>
      <div className={s.card}>
        <div className={s.cardTitle} style={{ marginBottom: 8 }}>{tx('Votre parcours', 'Your journey')}</div>
        <div className={s.list}>
          {events.map((e) => (
            <div key={e.id} className={s.listItem}>
              <span aria-hidden="true"><Icon glyph={e.kind === 'religious' ? RELIGIOUS_VARIANTS[e.variant]?.icon : (STEPS[e.kind] || STEPS.custom).icon} /></span>
              <span className={s.grow}>{e.kind === 'custom' ? e.title : e.kind === 'religious' ? L(RELIGIOUS_VARIANTS[e.variant]) : L(STEPS[e.kind])}</span>
              <span className={s.small + ' ' + s.muted}>{e.event_date ? date(e.event_date) : tx('date à fixer', 'date to set')}</span>
            </div>
          ))}
        </div>
      </div>
      {plan.wedding.budget_total > 0 && (
        <div className={s.card}>
          <div className={s.cardTitle} style={{ marginBottom: 8 }}>{tx('Premières enveloppes de budget', 'First budget envelopes')}</div>
          <div className={s.list}>
            {top.map(([id, v]) => {
              const c = BUDGET_CATEGORIES.find((x) => x.id === id)
              return (
                <div key={id} className={s.listItem}>
                  <span aria-hidden="true"><Icon glyph={c.icon} /></span>
                  <span className={s.grow}>{L(c)}</span>
                  <span className={s.num + ' ' + s.strong}>{formatMoney(v, plan.wedding.currency, lang)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {isLocal && (
        <p className={s.small + ' ' + s.muted}>{tx("Sans compte, votre plan reste sur cet appareil. Créez un compte quand vous voulez pour le sauvegarder et le partager.", 'Without an account, your plan stays on this device. Create an account any time to save and share it.')}</p>
      )}
    </div>
  )
}
