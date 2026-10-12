import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, ConfirmBtn, Empty, Field, Input, InlineNumber, PageHead, Progress, Select, Seg, Sheet, Textarea, cx, styles as s } from '../components/ui.jsx'
import { GUEST_GROUPS, PRIORITIES, RSVP_LABELS } from '../data/templates.js'
import { guestStats, seatsOf, sortGuests, suggestCut } from '../lib/guests.js'
import { firstWord, coupleNames, csv, downloadBlob, waLink } from '../lib/basics.js'
import { mainDate, stepTitle } from '../lib/plan.js'
import { PUBLIC_URL } from '../../utils/helpers.js'

const COLS = [
  { k: 'list', fr: 'Liste de souhaits', en: 'Wish list', cls: null },
  { k: 'in', fr: 'Invités', en: 'Invited', cls: 'colIn' },
  { k: 'out', fr: 'Ne passent pas', en: 'Cut', cls: 'colOut' },
]

export function useSideLabels() {
  const { tx } = useI18n()
  const { wedding } = useWedding()
  const g = firstWord(wedding.groom_name), b = firstWord(wedding.bride_name)
  return {
    groom: g || tx('Lui', 'His'),
    bride: b || tx('Elle', 'Hers'),
    both: tx('Les deux', 'Both'),
    long: { groom: tx(`Côté ${g || 'marié'}`, `${g ? `${g}'s` : "Groom's"} side`), bride: tx(`Côté ${b || 'mariée'}`, `${b ? `${b}'s` : "Bride's"} side`), both: tx('Les deux familles', 'Both families') },
  }
}

export function Guests() {
  const { tx, L } = useI18n()
  const { wedding, rows, canEdit, isLocal, add, update, updateMany, updateWedding } = useWedding()
  const { toast } = useUI()
  const sides = useSideLabels()
  const [view, setView] = useState('board')
  const [sideFilter, setSideFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [bulk, setBulk] = useState(false)
  const [undo, setUndo] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [draft, setDraft] = useState({ name: '', side: 'groom', grp: 'family', seats: 1, priority: 2 })

  const cap = wedding.guest_target || 0
  const st = guestStats(rows.guests)
  const over = cap > 0 && st.invitedSeats > cap
  const shown = rows.guests.filter((g) => (sideFilter === 'all' || g.side === sideFilter) && (!query || g.name.toLowerCase().includes(query.toLowerCase())))
  const newRsvps = rows.rsvps.filter((r) => !r.guest_id).length

  const addGuest = async (e) => {
    e.preventDefault()
    const name = draft.name.trim()
    if (!name) return
    const ok = await add('guests', { name, side: draft.side, grp: draft.grp, seats: Math.max(1, Number(draft.seats) || 1), priority: Number(draft.priority), status: 'list', rsvp: 'pending' })
    if (ok) setDraft((d) => ({ ...d, name: '', seats: 1 }))
  }
  const move = (g, status) => { if (g.status !== status) update('guests', g.id, { status }) }
  const cut = async () => {
    const changes = suggestCut(rows.guests, cap)
    if (!changes.length) { toast(tx('Vos listes respectent déjà la capacité, par priorité.', 'Your lists already fit the capacity, by priority.'), 'info'); return }
    const ok = await updateMany('guests', changes.map((c) => ({ id: c.id, patch: { status: c.to } })))
    if (ok) setUndo(changes)
  }
  const undoCut = async () => {
    if (!undo) return
    await updateMany('guests', undo.map((c) => ({ id: c.id, patch: { status: c.from } })))
    setUndo(null)
  }
  const exportCsv = () => {
    const header = [tx('Nom', 'Name'), tx('Côté', 'Side'), tx('Groupe', 'Group'), tx('Places', 'Seats'), tx('Liste', 'List'), 'RSVP', tx('Téléphone', 'Phone'), 'Email', tx('Table', 'Table')]
    const tables = Object.fromEntries(rows.tables.map((t) => [t.id, t.name]))
    const data = sortGuests(rows.guests).map((g) => [g.name, sides.long[g.side], L(GUEST_GROUPS[g.grp]) || g.grp, seatsOf(g), L(COLS.find((c) => c.k === g.status)), L(RSVP_LABELS[g.rsvp]), g.phone || '', g.email || '', tables[g.table_id] || ''])
    downloadBlob(`invites-${coupleNames(wedding, '-').toLowerCase() || 'mariage'}.csv`, csv([header, ...data]), 'text/csv;charset=utf-8')
  }

  const message = over
    ? tx(`${st.invitedSeats - cap} place(s) de trop. Déplacez des invités vers « Ne passent pas » ou laissez Ouimoove proposer.`, `${st.invitedSeats - cap} seat(s) over capacity. Move people to "Cut" or let Ouimoove suggest the cut.`)
    : st.wishSeats ? tx(`${st.wishSeats} place(s) encore en liste de souhaits.`, `${st.wishSeats} seat(s) still on the wish list.`)
      : rows.guests.length ? tx('Tout le monde est trié.', 'Everyone has been sorted.') : tx("Commencez par les personnes sans qui la journée n'aurait pas de sens.", "Start with the people you can't imagine the day without.")

  return (
    <>
      <PageHead
        title={tx('Invités', 'Guests')}
        sub={tx('Ajoutez tous ceux que vous pourriez inviter, puis triez : invités ou pas, jusqu’à ce que les places tombent juste.', 'Add everyone you could invite, then sort them: invited or cut, until the seats add up.')}
        actions={(
          <>
            <Btn size="sm" variant="ghost" onClick={exportCsv} disabled={!rows.guests.length}>{tx('Exporter (CSV)', 'Export (CSV)')}</Btn>
            {canEdit && <Btn size="sm" variant="ghost" onClick={() => setBulk(true)}>{tx('Ajouter une liste', 'Paste a list')}</Btn>}
          </>
        )}
      />

      <Card>
        <div className={s.meterRow}>
          <div className={s.stackSm}>
            <div className={s.rowWrap} style={{ alignItems: 'baseline', gap: 18 }}>
              <span><span className={s.statVal}>{st.invitedSeats}</span> <span className={s.muted}>/ {cap || '—'} {tx('places', 'seats')}</span></span>
              <span className={s.small} style={{ color: 'var(--w-groom)' }}>{sides.groom} <b>{st.groomSeats}</b></span>
              <span className={s.small} style={{ color: 'var(--w-bride)' }}>{sides.bride} <b>{st.brideSeats}</b></span>
              {st.bothSeats > 0 && <span className={s.small}>{sides.both} <b>{st.bothSeats}</b></span>}
              <span className={s.small + ' ' + s.muted}>{tx('Restant', 'Left')} <b>{Math.max(0, cap - st.invitedSeats)}</b></span>
            </div>
            <Progress label={tx('Places par côté', 'Seats by side')} total={cap} parts={[{ value: st.groomSeats, className: s.pGroom }, { value: st.brideSeats, className: s.pBride }, { value: st.bothSeats }]} />
            <div className={s.small} style={{ color: over ? 'var(--w-bad)' : 'var(--muted)', fontWeight: over ? 700 : 400 }}>{message}</div>
          </div>
          <Field label={tx('Capacité de la salle', 'Venue capacity')}>
            <InlineNumber value={cap} min={0} max={100000} bare={false} disabled={!canEdit} onSave={(n) => updateWedding({ guest_target: n })} style={{ width: 120, textAlign: 'center' }} />
          </Field>
        </div>
      </Card>

      {canEdit && (
        <Card tight>
          <form className={s.rowWrap} onSubmit={addGuest} style={{ alignItems: 'flex-end' }}>
            <Field label={tx('Nom', 'Name')} className={s.growWide}><Input value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={tx('Ex. : Tonton Kodjo et Tata Ama', 'e.g. Uncle Kodjo and Auntie Ama')} /></Field>
            <Field group label={tx('Côté', 'Side')}>
              <Seg value={draft.side} onChange={(v) => setDraft({ ...draft, side: v })} options={[{ value: 'groom', label: sides.groom }, { value: 'bride', label: sides.bride }, { value: 'both', label: sides.both }]} />
            </Field>
            <Field label={tx('Groupe', 'Group')}>
              <Select value={draft.grp} onChange={(e) => setDraft({ ...draft, grp: e.target.value })}>{Object.entries(GUEST_GROUPS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select>
            </Field>
            <Field label={tx('Places', 'Seats')} hint={tx('+1, enfants…', '+1, children…')}><Input type="number" min={1} max={50} value={draft.seats} onChange={(e) => setDraft({ ...draft, seats: e.target.value })} style={{ width: 80 }} /></Field>
            <Field label={tx('Priorité', 'Priority')}>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{Object.entries(PRIORITIES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select>
            </Field>
            <Btn type="submit" variant="primary">{tx('Ajouter', 'Add')}</Btn>
          </form>
        </Card>
      )}

      <div className={s.spread}>
        <div className={s.rowWrap}>
          <Seg label={tx('Vue', 'View')} value={view} onChange={setView} options={[
            { value: 'board', label: tx('Qui est invité ?', 'Who makes the cut?') },
            { value: 'table', label: tx('Liste détaillée', 'Detailed list') },
            { value: 'rsvp', label: `${tx('Réponses du site', 'Website replies')}${newRsvps ? ` (${newRsvps})` : ''}` },
          ]} />
          <Seg label={tx('Côté', 'Side')} value={sideFilter} onChange={setSideFilter} options={[{ value: 'all', label: tx('Tous', 'All') }, { value: 'groom', label: sides.groom }, { value: 'bride', label: sides.bride }]} />
        </div>
        <div className={s.rowWrap}>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx('Rechercher…', 'Search…')} style={{ width: 180 }} aria-label={tx('Rechercher un invité', 'Search guests')} />
          {canEdit && view === 'board' && undo && <Btn size="sm" variant="ghost" onClick={undoCut}>{tx('Annuler', 'Undo')}</Btn>}
          {canEdit && view === 'board' && <Btn size="sm" variant="accent" onClick={cut} disabled={!cap}>{tx('Proposer la sélection', 'Suggest the cut')}</Btn>}
        </div>
      </div>

      {view === 'board' && (
        <div className={s.board}>
          {COLS.map((c) => {
            const list = sortGuests(shown.filter((g) => g.status === c.k))
            const seats = list.reduce((a, g) => a + seatsOf(g), 0)
            return (
              <section
                key={c.k}
                className={cx(s.column, c.cls && s[c.cls], dragOver === c.k && s.columnDrop)}
                onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOver(c.k) } }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(null) }}
                onDrop={(e) => { e.preventDefault(); setDragOver(null); const g = rows.guests.find((x) => x.id === e.dataTransfer.getData('text/plain')); if (g) move(g, c.k) }}
              >
                <div className={s.columnHead}><span>{L(c)}</span><b>{seats}</b></div>
                {list.length === 0 && (
                  <div className={s.empty} style={{ padding: '16px 6px' }}>
                    {c.k === 'list' ? tx('Ajoutez des noms ci-dessus.', 'Add names above.') : c.k === 'in' ? tx('Glissez ici les invités retenus.', 'Drag invited guests here.') : tx('Ceux qui ne passent pas arrivent ici.', 'Anyone who doesn\'t make it lands here.')}
                  </div>
                )}
                {list.map((g) => <GuestCard key={g.id} g={g} col={c.k} sides={sides} onMove={move} onEdit={() => setEditing(g)} canEdit={canEdit} />)}
              </section>
            )
          })}
        </div>
      )}

      {view === 'table' && <GuestTable guests={sortGuests(shown)} sides={sides} onEdit={setEditing} />}
      {view === 'rsvp' && (isLocal ? (
        <Card><Empty icon="🌐">{tx('Les réponses arrivent depuis votre site de mariage. Créez un compte puis publiez votre site pour les recevoir ici.', 'Replies come from your wedding website. Create an account and publish your site to receive them here.')}</Empty></Card>
      ) : <Rsvps sides={sides} />)}

      {editing && <GuestEditor guest={editing} sides={sides} onClose={() => setEditing(null)} />}
      {bulk && <BulkAdd sides={sides} onClose={() => setBulk(false)} />}
    </>
  )
}

function GuestCard({ g, col, sides, onMove, onEdit, canEdit }) {
  const { tx, L } = useI18n()
  const { update } = useWedding()
  const [dragging, setDragging] = useState(false)
  const acts = [
    ['list', '↺', 'actBtn', tx('Remettre en liste de souhaits', 'Back to wish list')],
    ['in', '✓', 'actIn', tx('Inviter', 'Invite')],
    ['out', '✕', 'actOut', tx('Ne passe pas', 'Cut')],
  ].filter(([k]) => k !== col)
  return (
    <div
      className={cx(s.guestCard, dragging && s.guestDragging)}
      draggable={canEdit}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', g.id); e.dataTransfer.effectAllowed = 'move'; setDragging(true) }}
      onDragEnd={() => setDragging(false)}
    >
      <div className={s.guestName}>{g.name}</div>
      {canEdit && (
        <div className={s.guestActs}>
          {acts.map(([k, icon, cls, label]) => (
            <button key={k} type="button" className={cx(s.actBtn, s[cls])} title={label} aria-label={`${label} : ${g.name}`} onClick={() => onMove(g, k)}>{icon}</button>
          ))}
        </div>
      )}
      <div className={s.guestMeta}>
        <Chip tone={g.side === 'groom' ? 'groom' : g.side === 'bride' ? 'bride' : undefined}>{sides[g.side]}</Chip>
        <span>{L(GUEST_GROUPS[g.grp]) || g.grp}</span>
        <span className={s.strong} style={{ color: 'var(--text)' }}>{seatsOf(g)} {seatsOf(g) > 1 ? tx('places', 'seats') : tx('place', 'seat')}</span>
        {canEdit
          ? <Chip onClick={() => update('guests', g.id, { priority: (g.priority % 3) + 1 })} tone={g.priority === 1 ? 'good' : undefined} title={tx('Changer la priorité', 'Change priority')}>{L(PRIORITIES[g.priority])}</Chip>
          : <Chip>{L(PRIORITIES[g.priority])}</Chip>}
        {g.status === 'in' && g.rsvp !== 'pending' && <Chip tone={g.rsvp === 'yes' ? 'good' : g.rsvp === 'no' ? 'bad' : 'info'}>{L(RSVP_LABELS[g.rsvp])}</Chip>}
        <button type="button" className={s.linkBtn} style={{ fontSize: '.74rem' }} onClick={onEdit}>{canEdit ? tx('Modifier', 'Edit') : tx('Voir', 'View')}</button>
      </div>
    </div>
  )
}

function inviteText(wedding, events, guestName, tx, date) {
  const main = mainDate(events)
  const names = coupleNames(wedding)
  const url = wedding.site_published && wedding.slug ? `${PUBLIC_URL}/w/${wedding.slug}` : ''
  return tx(
    `Bonjour ${guestName}, ${names} ont la joie de vous inviter à leur mariage${main ? ` le ${date(main)}` : ''}. ${url ? `Programme et réponse ici : ${url}` : 'Merci de nous confirmer votre présence.'}`,
    `Hello ${guestName}, ${names} would love you to join their wedding${main ? ` on ${date(main)}` : ''}. ${url ? `Schedule and RSVP here: ${url}` : 'Please let us know if you can come.'}`,
  )
}

function GuestTable({ guests, sides, onEdit }) {
  const { tx, L, date } = useI18n()
  const { wedding, rows, canEdit, update } = useWedding()
  if (!guests.length) return <Card><Empty icon="👥">{tx('Aucun invité pour ce filtre.', 'No guests for this filter.')}</Empty></Card>
  const tables = Object.fromEntries(rows.tables.map((t) => [t.id, t.name]))
  const sendInvite = (g) => {
    window.open(waLink(g.phone, inviteText(wedding, rows.events, firstWord(g.name), tx, date), wedding.country), '_blank', 'noopener')
    if (canEdit && !g.invited_at) update('guests', g.id, { invited_at: new Date().toISOString() })
  }
  return (
    <Card>
      <div className={s.tableWrap}>
        <table className={s.dataTable}>
          <thead><tr>
            <th>{tx('Nom', 'Name')}</th><th>{tx('Côté', 'Side')}</th><th>{tx('Places', 'Seats')}</th><th>{tx('Liste', 'List')}</th>
            <th>RSVP</th><th>{tx('Téléphone', 'Phone')}</th><th>{tx('Table', 'Table')}</th><th />
          </tr></thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id}>
                <td className={s.strong}>{g.name}<div className={s.tiny + ' ' + s.muted}>{L(GUEST_GROUPS[g.grp]) || g.grp}</div></td>
                <td><Chip tone={g.side === 'groom' ? 'groom' : g.side === 'bride' ? 'bride' : undefined}>{sides[g.side]}</Chip></td>
                <td className={s.numCell}>{seatsOf(g)}</td>
                <td>
                  <Select value={g.status} disabled={!canEdit} style={{ padding: '5px 6px', fontSize: '.8rem', width: 140 }} onChange={(e) => update('guests', g.id, { status: e.target.value })} aria-label={tx('Liste', 'List')}>
                    {COLS.map((c) => <option key={c.k} value={c.k}>{L(c)}</option>)}
                  </Select>
                </td>
                <td>
                  <Select value={g.rsvp} disabled={!canEdit || g.status !== 'in'} style={{ padding: '5px 6px', fontSize: '.8rem', width: 120 }} onChange={(e) => update('guests', g.id, { rsvp: e.target.value })} aria-label="RSVP">
                    {Object.entries(RSVP_LABELS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}
                  </Select>
                </td>
                <td className={s.small}>{g.phone || <span className={s.muted}>—</span>}</td>
                <td className={s.small}>{tables[g.table_id] || <span className={s.muted}>—</span>}</td>
                <td>
                  <div className={s.rowWrap} style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                    {g.phone && g.status === 'in' && <Btn size="sm" variant={g.invited_at ? 'subtle' : 'ghost'} onClick={() => sendInvite(g)} title={g.invited_at ? tx('Invitation déjà envoyée', 'Invitation already sent') : undefined}>💬 {g.invited_at ? tx('Renvoyer', 'Resend') : tx('Inviter', 'Invite')}</Btn>}
                    <Btn size="sm" variant="subtle" onClick={() => onEdit(g)}>{canEdit ? tx('Modifier', 'Edit') : tx('Voir', 'View')}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function GuestEditor({ guest, sides, onClose }) {
  const { tx, L, lang } = useI18n()
  const { wedding, rows, canEdit, update, remove } = useWedding()
  const [f, setF] = useState({ ...guest, events: guest.events || [] })
  const set = (p) => setF((prev) => ({ ...prev, ...p }))
  const steps = rows.events.filter((e) => e.included !== false && e.kind !== 'honeymoon')
  const save = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return
    const ok = await update('guests', guest.id, {
      name: f.name.trim(), side: f.side, grp: f.grp, seats: Math.max(1, Number(f.seats) || 1), priority: Number(f.priority), status: f.status,
      phone: f.phone?.trim() || null, email: f.email?.trim() || null, rsvp: f.rsvp, rsvp_count: f.rsvp === 'yes' ? Math.max(0, Number(f.rsvp_count ?? f.seats) || 0) : f.rsvp === 'no' ? 0 : null,
      events: f.events, notes: f.notes?.trim() || null,
    })
    if (ok) onClose()
  }
  return (
    <Sheet open onClose={onClose} title={guest.name} sub={sides.long[guest.side]}>
      <form className={s.stack} onSubmit={save}>
        <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0 }} className={s.stack}>
          <Field label={tx('Nom', 'Name')}><Input value={f.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} required /></Field>
          <div className={s.formGrid}>
            <Field label={tx('Côté', 'Side')}>
              <Select value={f.side} onChange={(e) => set({ side: e.target.value })}>{['groom', 'bride', 'both'].map((k) => <option key={k} value={k}>{sides.long[k]}</option>)}</Select>
            </Field>
            <Field label={tx('Groupe', 'Group')}>
              <Select value={f.grp} onChange={(e) => set({ grp: e.target.value })}>{Object.entries(GUEST_GROUPS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select>
            </Field>
            <Field label={tx('Places', 'Seats')}><Input type="number" min={1} max={50} value={f.seats} onChange={(e) => set({ seats: e.target.value })} /></Field>
            <Field label={tx('Priorité', 'Priority')}>
              <Select value={f.priority} onChange={(e) => set({ priority: e.target.value })}>{Object.entries(PRIORITIES).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select>
            </Field>
            <Field label={tx('Liste', 'List')}>
              <Select value={f.status} onChange={(e) => set({ status: e.target.value })}>{COLS.map((c) => <option key={c.k} value={c.k}>{L(c)}</option>)}</Select>
            </Field>
            <Field label="RSVP">
              <Select value={f.rsvp} onChange={(e) => set({ rsvp: e.target.value })}>{Object.entries(RSVP_LABELS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select>
            </Field>
            {f.rsvp === 'yes' && <Field label={tx('Personnes confirmées', 'People confirmed')}><Input type="number" min={0} max={50} value={f.rsvp_count ?? f.seats} onChange={(e) => set({ rsvp_count: e.target.value })} /></Field>}
          </div>
          <div className={s.formGrid}>
            <Field label={tx('Téléphone (WhatsApp)', 'Phone (WhatsApp)')}><Input type="tel" value={f.phone || ''} maxLength={40} onChange={(e) => set({ phone: e.target.value })} placeholder="+228 90 00 00 00" /></Field>
            <Field label="Email"><Input type="email" value={f.email || ''} maxLength={200} onChange={(e) => set({ email: e.target.value })} /></Field>
          </div>
          {steps.length > 1 && (
            <Field group label={tx('Invité à', 'Invited to')} hint={tx('Rien de coché = toutes les étapes publiques.', 'Nothing ticked = all public steps.')}>
              <div className={s.rowWrap}>
                {steps.map((e) => {
                  const on = f.events.includes(e.kind === 'custom' ? e.id : e.kind)
                  const key = e.kind === 'custom' ? e.id : e.kind
                  return <Chip key={e.id} tone={on ? 'plum' : undefined} onClick={canEdit ? () => set({ events: on ? f.events.filter((x) => x !== key) : [...f.events, key].slice(0, 10) }) : undefined}>{on ? '✓ ' : ''}{stepTitle(e, lang, wedding.bride_culture)}</Chip>
                })}
              </div>
            </Field>
          )}
          <Field label={tx('Notes', 'Notes')}><Textarea value={f.notes || ''} maxLength={1000} onChange={(e) => set({ notes: e.target.value })} placeholder={tx('Régime alimentaire, à placer près de…', 'Dietary needs, seat near…')} /></Field>
        </fieldset>
        <div className={s.spread}>
          {canEdit ? <ConfirmBtn onConfirm={async () => { if (await remove('guests', guest.id)) onClose() }}>{tx('Supprimer', 'Delete')}</ConfirmBtn> : <span />}
          <div className={s.rowWrap}>
            <Btn variant="ghost" onClick={onClose}>{tx('Fermer', 'Close')}</Btn>
            {canEdit && <Btn type="submit" variant="primary">{tx('Enregistrer', 'Save')}</Btn>}
          </div>
        </div>
      </form>
    </Sheet>
  )
}

function BulkAdd({ sides, onClose }) {
  const { tx, L } = useI18n()
  const { add } = useWedding()
  const [text, setText] = useState('')
  const [side, setSide] = useState('groom')
  const [grp, setGrp] = useState('family')
  const names = useMemo(() => text.split(/\r?\n/).map((n) => n.replace(/^[\s•*\-\d.)]+/, '').trim()).filter(Boolean).slice(0, 500), [text])
  const save = async () => {
    if (!names.length) return
    const ok = await add('guests', names.map((name) => ({ name: name.slice(0, 120), side, grp, seats: 1, priority: 2, status: 'list', rsvp: 'pending' })))
    if (ok) onClose()
  }
  return (
    <Sheet open onClose={onClose} title={tx('Ajouter une liste', 'Paste a list')} sub={tx('Un nom par ligne. Copiez-collez depuis WhatsApp, Excel ou vos notes.', 'One name per line. Paste from WhatsApp, Excel or your notes.')}>
      <div className={s.stack}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 180 }} placeholder={'Tonton Kodjo\nTata Ama\nKossi & Afi'} />
        <div className={s.formGrid}>
          <Field group label={tx('Côté', 'Side')}><Seg value={side} onChange={setSide} options={[{ value: 'groom', label: sides.groom }, { value: 'bride', label: sides.bride }, { value: 'both', label: sides.both }]} /></Field>
          <Field label={tx('Groupe', 'Group')}><Select value={grp} onChange={(e) => setGrp(e.target.value)}>{Object.entries(GUEST_GROUPS).map(([id, v]) => <option key={id} value={id}>{L(v)}</option>)}</Select></Field>
        </div>
        <div className={s.spread}>
          <span className={s.small + ' ' + s.muted}>{tx(`${names.length} nom(s) détecté(s)`, `${names.length} name(s) found`)}</span>
          <Btn variant="primary" disabled={!names.length} onClick={save}>{tx('Ajouter à la liste de souhaits', 'Add to the wish list')}</Btn>
        </div>
      </div>
    </Sheet>
  )
}

function Rsvps({ sides }) {
  const { tx, date } = useI18n()
  const { rows, canEdit, add, update, remove } = useWedding()
  const list = rows.rsvps.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  const guestsById = Object.fromEntries(rows.guests.map((g) => [g.id, g]))
  if (!list.length) return <Card><Empty icon="💌">{tx('Pas encore de réponse. Partagez le lien de votre site sur WhatsApp : les réponses arriveront ici et mettront à jour votre liste.', 'No replies yet. Share your website link on WhatsApp: replies will land here and update your list.')}</Empty></Card>
  const addAsGuest = async (r) => {
    const saved = await add('guests', { name: r.name, phone: r.phone, side: 'both', grp: 'friends', seats: r.party_size, priority: 2, status: 'in', rsvp: r.attending ? 'yes' : 'no', rsvp_count: r.attending ? r.party_size : 0 })
    if (saved?.[0]) await update('rsvps', r.id, { guest_id: saved[0].id })
  }
  const link = async (r, guestId) => {
    if (!guestId) return
    await update('rsvps', r.id, { guest_id: guestId })
    await update('guests', guestId, { rsvp: r.attending ? 'yes' : 'no', rsvp_count: r.attending ? r.party_size : 0 })
  }
  return (
    <Card title={tx('Réponses reçues sur votre site', 'Replies from your website')} sub={tx('Quand le nom ou le téléphone correspond à un invité, sa réponse est mise à jour automatiquement.', 'When the name or phone matches a guest, their RSVP updates automatically.')}>
      <div className={s.list}>
        {list.map((r) => {
          const g = r.guest_id && guestsById[r.guest_id]
          return (
            <div key={r.id} className={s.listItem} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className={s.grow} style={{ minWidth: 200 }}>
                <div className={s.row}>
                  <span className={s.strong}>{r.name}</span>
                  <Chip tone={r.attending ? 'good' : 'bad'}>{r.attending ? tx(`Présent · ${r.party_size}`, `Coming · ${r.party_size}`) : tx('Absent', 'Not coming')}</Chip>
                </div>
                <div className={s.tiny + ' ' + s.muted}>{[r.phone, date(String(r.created_at).slice(0, 10))].filter(Boolean).join(' · ')}</div>
                {r.message && <p className={s.small} style={{ marginTop: 6, fontStyle: 'italic' }}>« {r.message} »</p>}
              </div>
              <div className={s.rowWrap}>
                {g ? <Chip tone={g.side === 'groom' ? 'groom' : g.side === 'bride' ? 'bride' : 'plum'}>↔ {g.name} · {sides[g.side]}</Chip> : canEdit && (
                  <>
                    <Select defaultValue="" style={{ width: 180, padding: '6px 8px' }} onChange={(e) => link(r, e.target.value)} aria-label={tx('Lier à un invité', 'Link to a guest')}>
                      <option value="">{tx('Lier à un invité…', 'Link to a guest…')}</option>
                      {rows.guests.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </Select>
                    <Btn size="sm" variant="ghost" onClick={() => addAsGuest(r)}>{tx('Ajouter comme invité', 'Add as guest')}</Btn>
                  </>
                )}
                {canEdit && <ConfirmBtn variant="subtle" confirmLabel="✕ ?" onConfirm={() => remove('rsvps', r.id)} aria-label={tx('Supprimer', 'Delete')}>✕</ConfirmBtn>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
