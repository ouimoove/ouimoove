import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { Btn, Card, Chip, ConfirmBtn, Empty, Field, Input, PageHead, Select, Seg, InlineText, cx, styles as s } from '../components/ui.jsx'
import { STEPS, ASSIGNEES } from '../data/templates.js'
import { taskTitle } from '../lib/plan.js'
import { todayISO, addDays } from '../lib/basics.js'

export function Tasks() {
  const { tx, L, lang, shortDate } = useI18n()
  const { rows, canEdit, add, update, remove } = useWedding()
  const [filter, setFilter] = useState('all')
  const [showDone, setShowDone] = useState(false)
  const [draft, setDraft] = useState({ title: '', event_kind: '', due_date: '', assignee: 'both' })

  const today = todayISO()
  const soon = addDays(today, 30)
  const later = addDays(today, 90)
  const kinds = useMemo(() => {
    const ks = [...new Set(rows.tasks.map((t) => t.event_kind || ''))]
    return ks.sort((a, b) => (STEPS[a]?.order || 0) - (STEPS[b]?.order || 0))
  }, [rows.tasks])

  const visible = rows.tasks
    .filter((t) => filter === 'all' || (t.event_kind || '') === filter)
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || (a.sort || 0) - (b.sort || 0))
  const open = visible.filter((t) => !t.done)
  const done = visible.filter((t) => t.done)
  const groups = [
    { id: 'now', title: tx('À faire dès que possible', 'Do as soon as you can'), list: open.filter((t) => t.due_date && t.due_date <= today) },
    { id: 'month', title: tx('Dans les 30 jours', 'In the next 30 days'), list: open.filter((t) => t.due_date && t.due_date > today && t.due_date <= soon) },
    { id: 'q', title: tx('Dans 1 à 3 mois', 'In 1 to 3 months'), list: open.filter((t) => t.due_date && t.due_date > soon && t.due_date <= later) },
    { id: 'later', title: tx('Plus tard', 'Later'), list: open.filter((t) => t.due_date && t.due_date > later) },
    { id: 'nodate', title: tx('Sans date (ajoutez les dates de vos étapes)', 'No date yet (add your step dates)'), list: open.filter((t) => !t.due_date) },
  ].filter((g) => g.list.length)

  const stepLabel = (k) => (k ? `${STEPS[k]?.icon || '✨'} ${L(STEPS[k] || STEPS.custom)}` : tx('🗂️ Général', '🗂️ General'))
  const toggle = (t) => update('tasks', t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() })

  const addTask = async (e) => {
    e.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    const ok = await add('tasks', { title, event_kind: draft.event_kind || null, due_date: draft.due_date || null, assignee: draft.assignee || null, done: false, sort: 1000 + rows.tasks.length })
    if (ok) setDraft((d) => ({ ...d, title: '' }))
  }

  const row = (t) => (
    <div key={t.id} className={s.listItem} style={{ alignItems: 'flex-start' }}>
      <input type="checkbox" checked={!!t.done} disabled={!canEdit} onChange={() => toggle(t)} aria-label={tx('Fait', 'Done')} style={{ width: 18, height: 18, marginTop: 6, accentColor: 'var(--purple)' }} />
      <div className={s.grow}>
        {canEdit ? (
          <InlineText value={taskTitle(t, lang)} maxLength={200} onSave={(title) => title && update('tasks', t.id, { title })} style={t.done ? { textDecoration: 'line-through', opacity: 0.6 } : undefined} />
        ) : <div className={s.small} style={{ padding: '5px 7px' }}>{taskTitle(t, lang)}</div>}
        <div className={s.rowWrap} style={{ paddingLeft: 7 }}>
          <Chip>{stepLabel(t.event_kind)}</Chip>
          {t.assignee && <Chip tone={t.assignee === 'groom' ? 'groom' : t.assignee === 'bride' ? 'bride' : undefined}>{L(ASSIGNEES[t.assignee])}</Chip>}
          {t.due_date && !t.done && t.due_date < today && <Chip tone="bad">{tx('en retard', 'overdue')}</Chip>}
        </div>
      </div>
      {canEdit ? (
        <div className={s.rowWrap} style={{ justifyContent: 'flex-end' }}>
          <input type="date" className={s.inputBare} style={{ width: 140 }} value={t.due_date || ''} aria-label={tx('Échéance', 'Due date')} onChange={(e) => update('tasks', t.id, { due_date: e.target.value || null })} />
          <Select value={t.assignee || ''} aria-label={tx('Qui ?', 'Who?')} style={{ width: 128, padding: '6px 8px' }} onChange={(e) => update('tasks', t.id, { assignee: e.target.value || null })}>
            <option value="">—</option>
            {Object.entries(ASSIGNEES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
          </Select>
          <ConfirmBtn variant="subtle" onConfirm={() => remove('tasks', t.id)} confirmLabel="✕ ?" aria-label={tx('Supprimer', 'Delete')}>✕</ConfirmBtn>
        </div>
      ) : <span className={s.tiny + ' ' + s.muted}>{t.due_date ? shortDate(t.due_date) : ''}</span>}
    </div>
  )

  return (
    <>
      <PageHead
        title={tx('Tâches', 'Checklist')}
        sub={tx("Chaque tâche est datée à partir de la date de son étape. Changez une date d'étape et les tâches suivent.", 'Each task is dated from its step date. Change a step date and the tasks follow.')}
      />
      <div className={s.spread}>
        <Seg
          label={tx('Filtrer par étape', 'Filter by step')}
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: tx('Toutes', 'All') }, ...kinds.map((k) => ({ value: k, label: k ? (STEPS[k]?.icon || '✨') + ' ' + L(STEPS[k] || STEPS.custom) : tx('Général', 'General') }))]}
        />
        <span className={s.small + ' ' + s.muted}>{tx(`${rows.tasks.filter((t) => t.done).length} faites sur ${rows.tasks.length}`, `${rows.tasks.filter((t) => t.done).length} of ${rows.tasks.length} done`)}</span>
      </div>

      {canEdit && (
        <Card tight>
          <form className={s.rowWrap} onSubmit={addTask}>
            <Field label={tx('Nouvelle tâche', 'New task')} className={s.growWide}>
              <Input value={draft.title} maxLength={200} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={tx('Ex. : choisir les alliances avec Keli', 'e.g. pick the rings together')} />
            </Field>
            <Field label={tx('Étape', 'Step')}>
              <Select value={draft.event_kind} onChange={(e) => setDraft({ ...draft, event_kind: e.target.value })}>
                <option value="">{tx('Général', 'General')}</option>
                {Object.keys(STEPS).filter((k) => k !== 'custom').map((k) => <option key={k} value={k}>{L(STEPS[k])}</option>)}
              </Select>
            </Field>
            <Field label={tx('Pour le', 'Due')}><Input type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></Field>
            <Btn type="submit" variant="primary" style={{ alignSelf: 'flex-end' }}>{tx('Ajouter', 'Add')}</Btn>
          </form>
        </Card>
      )}

      {groups.length === 0 && done.length === 0 && <Card><Empty icon="✅">{tx('Aucune tâche ici.', 'No tasks here.')}</Empty></Card>}
      {groups.map((g) => (
        <Card key={g.id} title={g.title} actions={<Chip tone={g.id === 'now' ? 'bad' : undefined}>{g.list.length}</Chip>}>
          <div className={s.list}>{g.list.map(row)}</div>
        </Card>
      ))}
      {done.length > 0 && (
        <Card
          title={tx(`Terminées (${done.length})`, `Done (${done.length})`)}
          actions={<Btn size="sm" variant="subtle" onClick={() => setShowDone((v) => !v)}>{showDone ? tx('Masquer', 'Hide') : tx('Afficher', 'Show')}</Btn>}
          className={cx(!showDone && s.cardTight)}
        >
          {showDone && <div className={s.list}>{done.map(row)}</div>}
        </Card>
      )}
    </>
  )
}
