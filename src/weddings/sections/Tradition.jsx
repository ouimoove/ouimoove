import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Empty, Field, Input, InlineMoney, InlineNumber, InlineText, PageHead, Select, Seg, Stat, ConfirmBtn, copyText, cx, styles as s } from '../components/ui.jsx'
import { StepGuide } from '../components/Events.jsx'
import { CULTURES, cultureOf, COUNTRY_NOTES } from '../data/cultures.js'
import { RECIPIENTS, DOWRY_CATEGORIES, DOWRY_STATUSES, UNITS, qtyLabel } from '../data/templates.js'
import { buildDowryItems } from '../lib/plan.js'
import { coupleNames } from '../lib/basics.js'
import { PUBLIC_URL } from '../../utils/helpers.js'

const RECIPIENT_ORDER = Object.keys(RECIPIENTS)

export function Tradition() {
  const { tx, L, lang, money } = useI18n()
  const { wedding, rows, canEdit, add, update, remove } = useWedding()
  const { toast } = useUI()
  const [stage, setStage] = useState('dowry')
  const [guide, setGuide] = useState(null)
  const [fromCulture, setFromCulture] = useState(wedding.bride_culture || wedding.groom_culture || 'other')
  const [draft, setDraft] = useState({ label: '', qty: 1, unit: '', recipient: 'bride', category: 'other', est_cost: 0 })

  const bride = cultureOf(wedding.bride_culture || wedding.groom_culture)
  const groom = wedding.groom_culture && wedding.groom_culture !== wedding.bride_culture ? cultureOf(wedding.groom_culture) : null
  const items = rows.dowry.filter((d) => d.stage === stage).sort((a, b) => (a.sort || 0) - (b.sort || 0))
  const groups = useMemo(() => RECIPIENT_ORDER.map((r) => ({ r, list: items.filter((d) => d.recipient === r) })).filter((g) => g.list.length), [items])
  const total = items.reduce((a, d) => a + (Number(d.est_cost) || 0), 0)
  const ready = items.filter((d) => d.status !== 'todo').length
  const eventOf = (k) => rows.events.find((e) => e.kind === k) || { kind: k }
  const note = COUNTRY_NOTES[wedding.country]

  const shareText = () => {
    const title = stage === 'knocking' ? tx('À apporter pour toquer à la porte', 'To bring for the knocking') : tx('Liste de la dot', 'Dowry list')
    const lines = [`🎁 ${title} — ${coupleNames(wedding)}`, '']
    groups.forEach(({ r, list }) => {
      lines.push(`${tx('Pour', 'For')} ${L(RECIPIENTS[r]).toLowerCase()} :`)
      list.forEach((d) => lines.push(`• ${d.label}${qtyLabel(d.qty, d.unit, lang) ? ` — ${qtyLabel(d.qty, d.unit, lang)}` : ''}${d.status !== 'todo' ? ' ✓' : ''}`))
      lines.push('')
    })
    lines.push(`${tx('Préparé avec Ouimoove Weddings', 'Prepared with Ouimoove Weddings')} — ${PUBLIC_URL.replace('https://', '')}/mariage`)
    return lines.join('\n')
  }

  const addItem = async (e) => {
    e.preventDefault()
    const label = draft.label.trim()
    if (!label) return
    const ok = await add('dowry', { stage, label, qty: Math.max(0, Number(draft.qty) || 0), unit: draft.unit || null, recipient: draft.recipient, category: draft.category, est_cost: draft.est_cost || 0, status: 'todo', sort: rows.dowry.length + 1 })
    if (ok) setDraft((d) => ({ ...d, label: '', qty: 1, est_cost: 0 }))
  }

  const addTemplate = async () => {
    const have = new Set(items.map((d) => d.label.toLowerCase()))
    const fresh = buildDowryItems(wedding.id, fromCulture, lang, [stage]).filter((d) => !have.has(d.label.toLowerCase()))
      .map((d, i) => ({ ...d, sort: rows.dowry.length + i + 1 }))
    if (!fresh.length) { toast(tx('Tous ces articles sont déjà dans votre liste.', 'All of these items are already on your list.'), 'info'); return }
    if (await add('dowry', fresh)) toast(tx(`${fresh.length} article(s) ajouté(s).`, `${fresh.length} item(s) added.`), 'success')
  }

  return (
    <>
      <PageHead
        title={tx('Tradition & dot', 'Tradition & dowry')}
        sub={tx("Ce qu'il faut apporter pour toquer à la porte et la liste de la dot. La famille de la mariée donne la liste officielle : remplacez ces exemples par ce qu'elle demande.", "What to bring to the knocking and the dowry list. The bride's family gives the official list: replace these examples with what they ask for.")}
        actions={(
          <>
            <Btn size="sm" variant="subtle" onClick={() => setGuide(eventOf('knocking'))}>📘 {tx('Guide : toquer', 'Guide: knocking')}</Btn>
            <Btn size="sm" variant="subtle" onClick={() => setGuide(eventOf('dowry'))}>📘 {tx('Guide : la dot', 'Guide: dowry')}</Btn>
          </>
        )}
      />

      <div className={s.rowWrap}>
        <Chip tone="bride">{tx('Famille de la mariée', "Bride's family")} · {L(bride.name)}</Chip>
        {groom && <Chip tone="groom">{tx('Famille du marié', "Groom's family")} · {L(groom.name)}</Chip>}
      </div>

      <div className={s.spread}>
        <Seg
          label={tx('Moment', 'Moment')}
          value={stage}
          onChange={setStage}
          options={[{ value: 'knocking', label: `🚪 ${tx('Toquer à la porte', 'Knocking')}` }, { value: 'dowry', label: `🎁 ${tx('Dot', 'Dowry')}` }]}
        />
        <div className={s.rowWrap}>
          <Btn size="sm" variant="ghost" disabled={!items.length} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank', 'noopener')}>💬 WhatsApp</Btn>
          <Btn size="sm" variant="ghost" disabled={!items.length} onClick={() => copyText(shareText(), toast, tx)}>{tx('Copier la liste', 'Copy list')}</Btn>
        </div>
      </div>

      <div className={s.stats}>
        <Stat value={items.length} label={tx('articles', 'items')} />
        <Stat value={`${ready}/${items.length}`} label={tx('achetés ou emballés', 'bought or packed')} />
        <Stat amount={total} currency={wedding.currency} label={tx('coût estimé', 'estimated cost')} />
      </div>

      {note && stage === 'dowry' && <div className={cx(s.banner, s.bannerWarn)}>{L(note)}</div>}

      <Card>
        {items.length === 0 ? (
          <Empty icon="🎁">{tx('Aucun article pour ce moment. Ajoutez-les ci-dessous ou partez du modèle de votre culture.', 'No items for this moment yet. Add them below or start from your culture\'s template.')}</Empty>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.dataTable}>
              <thead>
                <tr>
                  <th>{tx('Statut', 'Status')}</th>
                  <th>{tx('Article', 'Item')}</th>
                  <th>{tx('Qté', 'Qty')}</th>
                  <th>{tx('Pour', 'For')}</th>
                  <th>{tx('Type', 'Type')}</th>
                  <th style={{ textAlign: 'right' }}>{tx('Coût estimé', 'Est. cost')}</th>
                  <th />
                </tr>
              </thead>
              {groups.map(({ r, list }) => (
                <tbody key={r}>
                  <tr><td colSpan={7} className={s.tiny + ' ' + s.strong} style={{ paddingTop: 14, color: 'var(--purple3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{L(RECIPIENTS[r])} · {money(list.reduce((a, d) => a + (Number(d.est_cost) || 0), 0), wedding.currency)}</td></tr>
                  {list.map((d) => (
                    <tr key={d.id} className={cx(d.status !== 'todo' && s.rowDone)}>
                      <td style={{ width: 120 }}>
                        <Select value={d.status} disabled={!canEdit} aria-label={tx('Statut', 'Status')} style={{ padding: '5px 6px', fontSize: '.8rem' }} onChange={(e) => update('dowry', d.id, { status: e.target.value })}>
                          {Object.entries(DOWRY_STATUSES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                        </Select>
                      </td>
                      <td>{canEdit ? <InlineText value={d.label} maxLength={160} onSave={(label) => label && update('dowry', d.id, { label })} /> : d.label}</td>
                      <td style={{ width: 150 }}>
                        <div className={s.row} style={{ gap: 4 }}>
                          <InlineNumber style={{ width: 56 }} disabled={!canEdit} value={d.qty} aria-label={tx('Quantité', 'Quantity')} onSave={(qty) => update('dowry', d.id, { qty })} />
                          <span className={s.tiny + ' ' + s.muted}>{d.unit ? qtyLabel(d.qty, d.unit, lang).replace(/^\d+\s/, '') : ''}</span>
                        </div>
                      </td>
                      <td style={{ width: 120 }}>
                        <Select value={d.recipient} disabled={!canEdit} aria-label={tx('Pour', 'For')} style={{ padding: '5px 6px', fontSize: '.8rem' }} onChange={(e) => update('dowry', d.id, { recipient: e.target.value })}>
                          {Object.entries(RECIPIENTS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                        </Select>
                      </td>
                      <td className={s.small}>{DOWRY_CATEGORIES[d.category]?.icon} {L(DOWRY_CATEGORIES[d.category])}</td>
                      <td style={{ width: 150 }}>{canEdit ? <InlineMoney value={d.est_cost} onSave={(n) => update('dowry', d.id, { est_cost: n })} aria-label={tx('Coût estimé', 'Estimated cost')} /> : money(d.est_cost, wedding.currency)}</td>
                      <td style={{ width: 44 }}>{canEdit && <ConfirmBtn variant="subtle" confirmLabel="✕ ?" aria-label={tx('Supprimer', 'Delete')} onConfirm={() => remove('dowry', d.id)}>✕</ConfirmBtn>}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </Card>

      {canEdit && (
        <Card title={tx('Ajouter un article', 'Add an item')}>
          <form className={s.stack} onSubmit={addItem}>
            <div className={s.formGrid}>
              <Field label={tx('Article', 'Item')}><Input value={draft.label} maxLength={160} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder={tx('Ex. : 2 bouteilles de Martini', 'e.g. 2 bottles of Martini')} /></Field>
              <Field label={tx('Quantité', 'Quantity')}><Input type="number" min={0} value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} /></Field>
              <Field label={tx('Unité', 'Unit')}>
                <Select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
                  <option value="">—</option>
                  {Object.entries(UNITS).map(([id, u]) => <option key={id} value={id}>{lang === 'en' ? u.en : u.fr}</option>)}
                </Select>
              </Field>
              <Field label={tx('Pour', 'For')}>
                <Select value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value })}>
                  {Object.entries(RECIPIENTS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                </Select>
              </Field>
              <Field label={tx('Type', 'Type')}>
                <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {Object.entries(DOWRY_CATEGORIES).map(([id, v]) => <option key={id} value={id}>{v.icon} {L(v)}</option>)}
                </Select>
              </Field>
            </div>
            <div className={s.spread}>
              <div className={s.rowWrap}>
                <span className={s.small + ' ' + s.muted}>{tx('Ou repartir du modèle :', 'Or start from the template:')}</span>
                <Select value={fromCulture} onChange={(e) => setFromCulture(e.target.value)} style={{ width: 'auto' }} aria-label={tx('Culture du modèle', 'Template culture')}>
                  {CULTURES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
                </Select>
                <Btn size="sm" variant="subtle" onClick={addTemplate}>{tx('Ajouter les articles manquants', 'Add missing items')}</Btn>
              </div>
              <Btn type="submit" variant="primary">{tx('Ajouter', 'Add')}</Btn>
            </div>
          </form>
        </Card>
      )}

      {guide && <StepGuide event={guide} onClose={() => setGuide(null)} />}
    </>
  )
}
