import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Amount, Btn, Card, Chip, ConfirmBtn, Empty, Field, Input, InlineMoney, InlineText, MoneyInput, PageHead, Progress, Select, Seg, Stat, cx, styles as s } from '../components/ui.jsx'
import { BUDGET_CATEGORIES, BUDGET_CAT_BY_ID, BOOKING_STATUSES, STEPS } from '../data/templates.js'
import { budgetSummary, lineCost, paymentsDue } from '../lib/budget.js'
import { allocateBudget } from '../lib/plan.js'
import { todayISO, waLink } from '../lib/basics.js'

export function Budget() {
  const { tx, L, money, date } = useI18n()
  const { wedding, rows, canEdit, add, update, remove, updateWedding } = useWedding()
  const { go, toast } = useUI()
  const [view, setView] = useState('envelopes')
  const [catFilter, setCatFilter] = useState('all')
  const [draft, setDraft] = useState({ label: '', category: 'venue', event_kind: '', estimated: 0 })
  const cur = wedding.currency
  const b = budgetSummary(rows.budget, rows.dowry, wedding)
  const alloc = wedding.prefs?.alloc || {}
  const kinds = rows.events.filter((e) => e.included !== false && e.kind !== 'custom').map((e) => e.kind)
  const cats = BUDGET_CATEGORIES.filter((c) => alloc[c.id] != null || b.byCat[c.id])
  const due = paymentsDue(rows.budget)
  const today = todayISO()

  const setAlloc = (id, n) => updateWedding({ prefs: { ...(wedding.prefs || {}), alloc: { ...alloc, [id]: n } } })
  const redistribute = async () => {
    const next = allocateBudget(b.total, kinds, wedding.prefs?.splurge || [], wedding.prefs?.save || [])
    if (await updateWedding({ prefs: { ...(wedding.prefs || {}), alloc: next } })) toast(tx('Enveloppes recalculées.', 'Envelopes recalculated.'), 'success')
  }
  const addLine = async (e) => {
    e.preventDefault()
    const label = draft.label.trim()
    if (!label) return
    const ok = await add('budget', { label, category: draft.category, event_kind: draft.event_kind || null, estimated: draft.estimated || 0, paid: 0, status: 'planned' })
    if (ok) setDraft((d) => ({ ...d, label: '', estimated: 0 }))
  }
  const lines = rows.budget
    .filter((i) => catFilter === 'all' || i.category === catFilter)
    .sort((x, y) => (BUDGET_CATEGORIES.findIndex((c) => c.id === x.category) - BUDGET_CATEGORIES.findIndex((c) => c.id === y.category)) || String(x.created_at).localeCompare(String(y.created_at)))

  return (
    <>
      <PageHead
        title={tx('Budget & réservations', 'Budget & bookings')}
        sub={tx('Une enveloppe par poste, chaque prestataire avec son statut, ses acomptes et ce qu’il reste à payer. La liste de la dot est comptée dans « Cérémonies traditionnelles ».', 'One envelope per category, each vendor with its status, deposits and what is left to pay. The dowry list counts towards "Traditional ceremonies".')}
        actions={<Btn size="sm" variant="ghost" onClick={() => go('prestataires')}>🤝 {tx('Trouver des prestataires', 'Find vendors')}</Btn>}
      />

      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.label}>{tx('Budget total', 'Total budget')}</div>
          {canEdit ? <InlineMoney bare={false} value={b.total} onSave={(n) => updateWedding({ budget_total: n })} aria-label={tx('Budget total', 'Total budget')} style={{ marginTop: 6, fontWeight: 700, textAlign: 'left' }} /> : <div className={cx(s.statVal, s.statValSm)}><Amount value={b.total} currency={cur} /></div>}
          <div className={s.statSub}>{cur === 'XOF' || cur === 'XAF' ? 'FCFA' : cur}</div>
        </div>
        <Stat amount={b.forecast} currency={cur} label={tx('prévu (devis et estimations)', 'planned (quotes and estimates)')} />
        <Stat amount={b.paid} currency={cur} label={tx('déjà payé', 'already paid')} sub={<Progress parts={[{ value: b.paid, className: s.pGood }]} total={b.forecast} />} />
        <Stat amount={Math.abs(b.remaining)} currency={cur} label={b.remaining >= 0 ? tx('marge restante', 'left to allocate') : tx('au-dessus du budget', 'over budget')} tone={b.remaining < 0 ? 'var(--w-bad)' : 'var(--w-good)'} />
      </div>

      <Seg label={tx('Vue', 'View')} value={view} onChange={setView} options={[
        { value: 'envelopes', label: tx('Enveloppes', 'Envelopes') },
        { value: 'lines', label: tx('Réservations & dépenses', 'Bookings & costs') },
        { value: 'due', label: `${tx('Paiements à venir', 'Payments due')}${due.length ? ` (${due.length})` : ''}` },
      ]} />

      {view === 'envelopes' && (
        <Card
          title={tx('Enveloppes par poste', 'Envelopes by category')}
          sub={tx('Prévu = devis ou estimations des lignes du poste. Ajustez l’enveloppe librement.', 'Planned = quotes or estimates of the lines in that category. Adjust the envelope freely.')}
          actions={canEdit && b.total > 0 && <ConfirmBtn variant="subtle" onConfirm={redistribute} confirmLabel={tx('Recalculer ?', 'Recalculate?')}>{tx('Répartir le budget', 'Split the budget')}</ConfirmBtn>}
        >
          <div className={s.envList}>
            {cats.map((c) => {
              const data = b.byCat[c.id] || { alloc: 0, forecast: 0, paid: 0 }
              const envelope = Number(alloc[c.id]) || 0
              const over = envelope > 0 && data.forecast > envelope
              return (
                <div key={c.id} className={s.env}>
                  <span className={s.envIcon} aria-hidden="true">{c.icon}</span>
                  <div className={s.grow}>
                    <div className={s.strong + ' ' + s.small}>{L(c)}</div>
                    <div className={s.tiny} style={{ color: over ? 'var(--w-bad)' : 'var(--muted)' }}>
                      {tx('Prévu', 'Planned')} {money(data.forecast, cur)} · {tx('payé', 'paid')} {money(data.paid, cur)}{over ? ` · ${tx('dépasse de', 'over by')} ${money(data.forecast - envelope, cur)}` : ''}
                    </div>
                  </div>
                  <div style={{ width: 150 }}>
                    {canEdit ? <InlineMoney value={envelope} onSave={(n) => setAlloc(c.id, n)} aria-label={tx(`Enveloppe ${L(c)}`, `${L(c)} envelope`)} /> : <span className={s.num}>{money(envelope, cur)}</span>}
                  </div>
                  <Progress parts={[{ value: data.paid, className: s.pGood }, { value: Math.max(0, data.forecast - data.paid), className: s.pGold }]} total={envelope || data.forecast} />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {view === 'lines' && (
        <>
          <div className={s.rowWrap}>
            <Chip tone={catFilter === 'all' ? 'plum' : undefined} onClick={() => setCatFilter('all')}>{tx('Tout', 'All')}</Chip>
            {BUDGET_CATEGORIES.filter((c) => rows.budget.some((i) => i.category === c.id)).map((c) => (
              <Chip key={c.id} tone={catFilter === c.id ? 'plum' : undefined} onClick={() => setCatFilter(c.id)}>{c.icon} {L(c)}</Chip>
            ))}
          </div>
          <Card>
            {lines.length === 0 ? <Empty icon="🧾">{tx('Aucune ligne. Ajoutez vos prestataires et dépenses ci-dessous.', 'No lines yet. Add your vendors and costs below.')}</Empty> : (
              <div className={s.tableWrap}>
                <table className={s.dataTable} style={{ minWidth: 900 }}>
                  <thead><tr>
                    <th>{tx('Poste', 'Item')}</th><th>{tx('Prestataire', 'Vendor')}</th><th>{tx('Statut', 'Status')}</th>
                    <th style={{ textAlign: 'right' }}>{tx('Estimé', 'Estimate')}</th><th style={{ textAlign: 'right' }}>{tx('Prix final', 'Final price')}</th>
                    <th style={{ textAlign: 'right' }}>{tx('Payé', 'Paid')}</th><th>{tx('Échéance', 'Due')}</th><th />
                  </tr></thead>
                  <tbody>
                    {lines.map((i) => (
                      <tr key={i.id} className={cx(i.status === 'cancelled' && s.rowDone)}>
                        <td style={{ minWidth: 170 }}>
                          {canEdit ? <InlineText value={i.label} maxLength={120} onSave={(label) => label && update('budget', i.id, { label })} /> : i.label}
                          <div className={s.tiny + ' ' + s.muted} style={{ paddingLeft: 7 }}>{BUDGET_CAT_BY_ID[i.category]?.icon} {L(BUDGET_CAT_BY_ID[i.category]) || i.category}{i.event_kind && STEPS[i.event_kind] ? ` · ${L(STEPS[i.event_kind])}` : ''}</div>
                        </td>
                        <td style={{ minWidth: 170 }}>
                          {canEdit ? (
                            <>
                              <InlineText value={i.vendor_name || ''} maxLength={120} placeholder={tx('Nom', 'Name')} onSave={(v) => update('budget', i.id, { vendor_name: v || null })} />
                              <InlineText value={i.vendor_phone || ''} maxLength={40} placeholder={tx('Téléphone', 'Phone')} onSave={(v) => update('budget', i.id, { vendor_phone: v || null })} style={{ fontSize: '.78rem' }} />
                            </>
                          ) : <>{i.vendor_name}<div className={s.tiny}>{i.vendor_phone}</div></>}
                        </td>
                        <td>
                          <Select value={i.status} disabled={!canEdit} style={{ padding: '5px 6px', fontSize: '.8rem', width: 130 }} onChange={(e) => update('budget', i.id, { status: e.target.value })} aria-label={tx('Statut', 'Status')}>
                            {Object.entries(BOOKING_STATUSES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                          </Select>
                        </td>
                        <td style={{ width: 130 }}>{canEdit ? <InlineMoney value={i.estimated} onSave={(n) => update('budget', i.id, { estimated: n })} aria-label={tx('Estimé', 'Estimate')} /> : money(i.estimated, cur)}</td>
                        <td style={{ width: 130 }}>{canEdit ? <InlineMoney value={i.actual ?? ''} onSave={(n) => update('budget', i.id, { actual: n || null })} aria-label={tx('Prix final', 'Final price')} /> : (i.actual != null ? money(i.actual, cur) : '—')}</td>
                        <td style={{ width: 130 }}>{canEdit ? <InlineMoney value={i.paid} onSave={(n) => update('budget', i.id, { paid: n, ...(n > 0 && n >= lineCost(i) ? { status: 'paid' } : {}) })} aria-label={tx('Payé', 'Paid')} /> : money(i.paid, cur)}</td>
                        <td style={{ width: 140 }}><input type="date" className={s.inputBare} disabled={!canEdit} value={i.due_date || ''} onChange={(e) => update('budget', i.id, { due_date: e.target.value || null })} aria-label={tx('Échéance', 'Due date')} /></td>
                        <td>
                          <div className={s.row} style={{ gap: 4 }}>
                            {i.vendor_phone && <Btn size="icon" variant="subtle" title="WhatsApp" aria-label={`WhatsApp ${i.vendor_name || ''}`} onClick={() => window.open(waLink(i.vendor_phone, tx(`Bonjour, je vous contacte pour notre mariage (${i.label}).`, `Hello, I'm reaching out about our wedding (${i.label}).`), wedding.country), '_blank', 'noopener')}>💬</Btn>}
                            {canEdit && <ConfirmBtn variant="subtle" confirmLabel="✕ ?" aria-label={tx('Supprimer', 'Delete')} onConfirm={() => remove('budget', i.id)}>✕</ConfirmBtn>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {canEdit && (
            <Card title={tx('Ajouter une dépense ou un prestataire', 'Add a cost or vendor')} tight>
              <form className={s.rowWrap} style={{ alignItems: 'flex-end' }} onSubmit={addLine}>
                <Field label={tx('Poste', 'Item')} className={s.growWide}><Input value={draft.label} maxLength={120} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder={tx('Ex. : location des chaises', 'e.g. chair rental')} /></Field>
                <Field label={tx('Catégorie', 'Category')}>
                  <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{BUDGET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {L(c)}</option>)}</Select>
                </Field>
                <Field label={tx('Étape', 'Step')}>
                  <Select value={draft.event_kind} onChange={(e) => setDraft({ ...draft, event_kind: e.target.value })}>
                    <option value="">—</option>
                    {kinds.map((k) => <option key={k} value={k}>{L(STEPS[k])}</option>)}
                  </Select>
                </Field>
                <Field label={tx('Estimé', 'Estimate')}><MoneyInput value={draft.estimated} onChange={(n) => setDraft({ ...draft, estimated: n })} style={{ width: 150 }} /></Field>
                <Btn type="submit" variant="primary">{tx('Ajouter', 'Add')}</Btn>
              </form>
            </Card>
          )}
        </>
      )}

      {view === 'due' && (
        <Card title={tx('Ce qu’il reste à payer', 'What is left to pay')} sub={tx('Les prestataires réservés dont le solde n’est pas réglé, par date d’échéance.', 'Booked vendors with a balance outstanding, by due date.')}>
          {due.length === 0 ? <Empty icon="✅">{tx('Rien à payer pour l’instant. Marquez vos prestataires « Réservé » pour suivre leurs soldes.', 'Nothing to pay for now. Mark vendors as "Booked" to track their balances.')}</Empty> : (
            <div className={s.list}>
              {due.map((i) => (
                <div key={i.id} className={s.listItem}>
                  <div className={s.grow}>
                    <div className={s.strong}>{i.label}{i.vendor_name ? ` · ${i.vendor_name}` : ''}</div>
                    <div className={s.tiny} style={{ color: i.due_date && i.due_date < today ? 'var(--w-bad)' : 'var(--muted)' }}>
                      {i.due_date ? `${tx('Échéance', 'Due')} ${date(i.due_date)}` : tx('Sans échéance', 'No due date')} · {tx('payé', 'paid')} {money(i.paid, cur)} {tx('sur', 'of')} {money(lineCost(i), cur)}
                    </div>
                  </div>
                  <span className={s.strong + ' ' + s.num}>{money(lineCost(i) - (i.paid || 0), cur)}</span>
                  {canEdit && <Btn size="sm" variant="ghost" onClick={() => update('budget', i.id, { paid: lineCost(i), status: 'paid' })}>{tx('Soldé', 'Paid off')}</Btn>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      <p className={s.tiny + ' ' + s.muted}>{tx('Les montants proposés sont des repères pour démarrer, pas des conseils financiers : ajustez-les à vos devis.', 'Suggested amounts are starting points, not financial advice: adjust them to your quotes.')}</p>
    </>
  )
}
