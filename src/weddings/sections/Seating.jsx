import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, ConfirmBtn, Empty, InlineNumber, InlineText, PageHead, Progress, cx, styles as s } from '../components/ui.jsx'
import { autoSeat, seatable, seatsOf, sumSeats, tableFill, tablesNeeded } from '../lib/guests.js'
import { useSideLabels } from './Guests.jsx'

export function Seating() {
  const { tx } = useI18n()
  const { rows, canEdit, add, update, updateMany, remove } = useWedding()
  const { toast, go } = useUI()
  const sides = useSideLabels()
  const [picked, setPicked] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const tables = rows.tables.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0) || String(a.created_at).localeCompare(String(b.created_at)))
  const people = seatable(rows.guests)
  const fill = tableFill(tables, rows.guests)
  const unseated = people.filter((g) => !g.table_id || !(g.table_id in fill))
    .sort((a, b) => a.side.localeCompare(b.side) || a.name.localeCompare(b.name))
  const totalSeats = sumSeats(people)
  const seated = totalSeats - sumSeats(unseated)
  const capacity = tables.reduce((a, t) => a + t.capacity, 0)

  const addTable = (name, capacity = 10) => add('tables', { name, capacity, shape: 'round', sort: tables.length + 1 })
  const createTables = async () => {
    const n = tablesNeeded(totalSeats, 10)
    const list = [{ name: tx("Table d'honneur", 'Top table'), capacity: 10, shape: 'rect', sort: 0 }]
    for (let i = 1; i <= n; i++) list.push({ name: `Table ${i}`, capacity: 10, shape: 'round', sort: i })
    if (await add('tables', list)) toast(tx(`${list.length} tables créées.`, `${list.length} tables created.`), 'success')
  }
  const seatAll = async () => {
    const plan = autoSeat(rows.guests, tables)
    if (!plan.length) { toast(tx("Plus de place libre à une table pour les invités restants.", 'No free table space left for the remaining guests.'), 'info'); return }
    if (await updateMany('guests', plan.map((p) => ({ id: p.id, patch: { table_id: p.table_id } })))) {
      const left = unseated.length - plan.length
      toast(left > 0 ? tx(`${plan.length} placé(s), ${left} sans place : ajoutez une table.`, `${plan.length} seated, ${left} without a seat: add a table.`) : tx('Tout le monde est placé ✓', 'Everyone is seated ✓'), left > 0 ? 'info' : 'success')
    }
  }
  const clearAll = () => updateMany('guests', people.filter((g) => g.table_id).map((g) => ({ id: g.id, patch: { table_id: null } })))
  const seat = (guestId, tableId) => {
    const g = rows.guests.find((x) => x.id === guestId)
    if (!g || g.table_id === tableId) return
    update('guests', guestId, { table_id: tableId })
    setPicked(null)
  }

  if (!people.length) {
    return (
      <>
        <PageHead title={tx('Plan de table', 'Seating plan')} />
        <Card><Empty icon="🪑" action={<Btn variant="primary" onClick={() => go('invites')}>{tx('Aller aux invités', 'Go to guests')}</Btn>}>
          {tx('Le plan de table se remplit avec vos invités retenus. Passez des invités dans la colonne « Invités » pour commencer.', 'The seating plan fills with your invited guests. Move people to the "Invited" column to start.')}
        </Empty></Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={tx('Plan de table', 'Seating plan')}
        sub={tx('Touchez un invité puis une table pour le placer, ou glissez-le. Les invités qui ont décliné ne sont pas comptés.', 'Tap a guest then a table to seat them, or drag them. Guests who declined are not counted.')}
        actions={canEdit && (
          <>
            {tables.length === 0
              ? <Btn size="sm" variant="primary" onClick={createTables}>{tx(`Créer ${tablesNeeded(totalSeats) + 1} tables`, `Create ${tablesNeeded(totalSeats) + 1} tables`)}</Btn>
              : <Btn size="sm" variant="ghost" onClick={() => addTable(`Table ${tables.length + 1}`)}>+ {tx('Table', 'Table')}</Btn>}
            {tables.length > 0 && <Btn size="sm" variant="accent" onClick={seatAll} disabled={!unseated.length}>{tx('Placer automatiquement', 'Seat everyone')}</Btn>}
            {seated > 0 && <ConfirmBtn variant="ghost" onConfirm={clearAll}>{tx('Vider le plan', 'Clear the plan')}</ConfirmBtn>}
          </>
        )}
      />

      <div className={s.stats}>
        <div className={s.stat}>
          <div className={s.statVal}>{seated}/{totalSeats}</div>
          <div className={s.statLabel}>{tx('personnes placées', 'people seated')}</div>
          <div className={s.statSub}><Progress parts={[{ value: seated, className: s.pGold }]} total={totalSeats} /></div>
        </div>
        <div className={s.stat}><div className={s.statVal}>{tables.length}</div><div className={s.statLabel}>{tx('tables', 'tables')}</div></div>
        <div className={s.stat}>
          <div className={s.statVal} style={{ color: capacity < totalSeats ? 'var(--w-bad)' : undefined }}>{capacity}</div>
          <div className={s.statLabel}>{tx('places aux tables', 'seats at tables')}</div>
          {capacity < totalSeats && <div className={s.statSub} style={{ color: 'var(--w-bad)' }}>{tx(`Il manque ${totalSeats - capacity} places`, `${totalSeats - capacity} seats short`)}</div>}
        </div>
      </div>

      <div className={s.seatLayout}>
        <Card title={tx(`À placer (${sumSeats(unseated)})`, `To seat (${sumSeats(unseated)})`)} tight>
          {unseated.length === 0 ? <p className={s.small + ' ' + s.muted}>{tx('Tout le monde a sa place', 'Everyone has a seat')}</p> : (
            <div className={s.stackSm}>
              {unseated.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={cx(s.pickable, picked === g.id && s.picked)}
                  draggable={canEdit}
                  disabled={!canEdit}
                  aria-pressed={picked === g.id}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', g.id); e.dataTransfer.effectAllowed = 'move' }}
                  onClick={() => setPicked(picked === g.id ? null : g.id)}
                >
                  <span className={s.ellipsis}>{g.name}</span>
                  <span className={s.row} style={{ gap: 6, flexShrink: 0 }}>
                    <Chip tone={g.side === 'groom' ? 'groom' : g.side === 'bride' ? 'bride' : undefined}>{sides[g.side]}</Chip>
                    <b className={s.num}>{seatsOf(g)}</b>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {tables.length === 0 ? (
          <Card><Empty icon="🪑">{tx('Pas encore de table. Créez-les en un clic : une table d’honneur et des tables de 10.', 'No tables yet. Create them in one click: a top table and tables of 10.')}</Empty></Card>
        ) : (
          <div className={s.tablesGrid}>
            {tables.map((t) => {
              const guests = rows.guests.filter((g) => g.table_id === t.id && g.status === 'in' && g.rsvp !== 'no')
              const used = fill[t.id] || 0
              const target = picked && (t.capacity - used) >= seatsOf(rows.guests.find((g) => g.id === picked) || {})
              return (
                <div
                  key={t.id}
                  className={cx(s.tableCard, target && s.tableTarget, used === t.capacity && s.tableFull, used > t.capacity && s.tableOver, dragOver === t.id && s.tableTarget)}
                  onClick={() => { if (picked && canEdit) seat(picked, t.id) }}
                  onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOver(t.id) } }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); seat(e.dataTransfer.getData('text/plain'), t.id) }}
                >
                  <div className={s.row}>
                    <span className={cx(s.tableRing, t.shape === 'rect' && s.tableRect)}>{used}/{t.capacity}</span>
                    <div className={s.grow} onClick={(e) => e.stopPropagation()}>
                      {canEdit ? <InlineText value={t.name} maxLength={60} onSave={(name) => name && update('tables', t.id, { name })} style={{ fontWeight: 700 }} /> : <b>{t.name}</b>}
                      <div className={s.row} style={{ gap: 4, paddingLeft: 7 }}>
                        <span className={s.tiny + ' ' + s.muted}>{tx('places', 'seats')}</span>
                        {canEdit ? <InlineNumber value={t.capacity} min={1} max={100} onSave={(capacity) => update('tables', t.id, { capacity })} style={{ width: 52, fontSize: '.8rem' }} aria-label={tx('Nombre de places', 'Number of seats')} /> : t.capacity}
                      </div>
                    </div>
                    {canEdit && <span onClick={(e) => e.stopPropagation()}><ConfirmBtn variant="subtle" confirmLabel="✕ ?" aria-label={tx('Supprimer la table', 'Delete table')} onConfirm={() => remove('tables', t.id)}>✕</ConfirmBtn></span>}
                  </div>
                  <div className={s.seatChips}>
                    {guests.map((g) => (
                      <span key={g.id} className={s.seatChip} style={{ borderColor: g.side === 'groom' ? 'var(--w-groom-soft)' : g.side === 'bride' ? 'var(--w-bride-soft)' : undefined }}>
                        {g.name}{seatsOf(g) > 1 ? ` ·${seatsOf(g)}` : ''}
                        {canEdit && <button type="button" aria-label={tx(`Retirer ${g.name}`, `Remove ${g.name}`)} onClick={(e) => { e.stopPropagation(); update('guests', g.id, { table_id: null }) }}>✕</button>}
                      </span>
                    ))}
                    {!guests.length && <span className={s.tiny + ' ' + s.muted}>{picked ? tx('Touchez pour placer ici', 'Tap to seat here') : tx('Table vide', 'Empty table')}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
