import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Names, Progress, Stat, cx, styles as s } from '../components/ui.jsx'
import { StepGuide, EventEditor, ManageSteps, eventIcon, sortEvents } from '../components/Events.jsx'
import { stepTitle, taskTitle } from '../lib/plan.js'
import { guestStats } from '../lib/guests.js'
import { budgetSummary } from '../lib/budget.js'
import { todayISO, daysUntil } from '../lib/basics.js'
import { Icon } from '../../components/Icon.jsx'

export function Dashboard() {
  const { tx, lang, date, money } = useI18n()
  const { wedding, rows, canEdit, update, isLocal, role } = useWedding()
  const { go } = useUI()
  const [guideFor, setGuideFor] = useState(null)
  const [editing, setEditing] = useState(null)
  const [managing, setManaging] = useState(false)

  const today = todayISO()
  const events = sortEvents(rows.events.filter((e) => e.included !== false))
  const next = events.find((e) => e.event_date && e.event_date >= today && !e.done)
  const daysLeft = next ? daysUntil(next.event_date) : null
  const doneTasks = rows.tasks.filter((t) => t.done).length
  const gs = guestStats(rows.guests)
  const b = budgetSummary(rows.budget, rows.dowry, wedding)
  const openTasks = rows.tasks.filter((t) => !t.done)
    .sort((x, y) => (x.due_date || '9999').localeCompare(y.due_date || '9999') || (x.sort || 0) - (y.sort || 0))
    .slice(0, 6)
  const tasksOf = (kind) => rows.tasks.filter((t) => t.event_kind === kind)

  const ideas = [
    !isLocal && role === 'owner' && rows.members.length === 0 && { icon: '💌', text: tx('Invitez votre partenaire à planifier avec vous', 'Invite your partner to plan with you'), go: 'reglages' },
    rows.guests.length === 0 && { icon: '👥', text: tx("Commencez votre liste d'invités, lui & elle", 'Start your his & hers guest list'), go: 'invites' },
    rows.dowry.length > 0 && rows.dowry.every((d) => d.status === 'todo' && !d.est_cost) && { icon: '🎁', text: tx('Validez la liste de la dot avec votre famille', 'Confirm the dowry list with your family'), go: 'tradition' },
    !wedding.hashtag && { icon: '#️⃣', text: tx('Trouvez votre hashtag', 'Find your hashtag'), go: 'hashtag' },
    !wedding.site_published && { icon: '🌐', text: tx('Créez votre site de mariage', 'Create your wedding website'), go: 'site' },
    { icon: '🤝', text: tx('Trouvez vos prestataires', 'Find your vendors'), go: 'prestataires' },
  ].filter(Boolean).slice(0, 3)

  const toggleTask = (t) => update('tasks', t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() })

  return (
    <>
      <section className={s.welcome}>
        <div className={s.tiny + ' ' + s.muted} style={{ textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>
          {tx('Le mariage de', 'The wedding of')}
        </div>
        <Names wedding={wedding} className={s.welcomeNames} size="clamp(2.1rem, 5vw, 3.2rem)" />
        {next ? (
          <div className={s.countdown}>
            <span className={s.countNum}>{daysLeft === 0 ? tx("Aujourd'hui", 'Today') : `J-${daysLeft}`}</span>
            <span className={s.countLabel}><Icon glyph={eventIcon(next)} /> {stepTitle(next, lang, wedding.bride_culture)} · {date(next.event_date)}</span>
          </div>
        ) : (
          <p className={s.countLabel} style={{ marginTop: 10 }}>
            {events.some((e) => e.event_date) ? tx('Toutes vos étapes datées sont passées. Félicitations !', 'All your dated steps are behind you. Congratulations!') : tx('Ajoutez vos dates pour lancer le compte à rebours.', 'Add your dates to start the countdown.')}
          </p>
        )}
        {wedding.hashtag && <div style={{ marginTop: 10 }}><Chip tone="gold">{wedding.hashtag}</Chip></div>}
      </section>

      <div className={s.stats}>
        <Stat value={`${doneTasks}/${rows.tasks.length}`} label={tx('tâches faites', 'tasks done')} sub={<Progress parts={[{ value: doneTasks, className: s.pGood }]} total={rows.tasks.length} />} />
        <Stat value={gs.invitedSeats} label={tx(`places invitées sur ${wedding.guest_target || '—'}`, `seats invited of ${wedding.guest_target || '—'}`)} sub={<Progress parts={[{ value: gs.groomSeats, className: s.pGroom }, { value: gs.brideSeats, className: s.pBride }, { value: gs.bothSeats }]} total={wedding.guest_target} />} />
        <Stat value={gs.yesSeats} label={tx('personnes confirmées', 'people confirmed')} sub={tx(`${gs.pendingCount} en attente`, `${gs.pendingCount} waiting`)} />
        <Stat amount={b.forecast} currency={wedding.currency} label={wedding.budget_total ? tx(`prévu sur ${money(b.total, wedding.currency)}`, `planned of ${money(b.total, wedding.currency)}`) : tx('prévu', 'planned')} sub={<Progress parts={[{ value: b.paid, className: s.pGood }, { value: Math.max(0, b.forecast - b.paid), className: s.pGold }]} total={b.total} />} />
      </div>

      <div className={s.grid2} style={{ alignItems: 'start' }}>
        <Card title={tx('Votre parcours', 'Your journey')} sub={tx('Chaque étape a son guide selon vos cultures.', 'Each step has a guide for your cultures.')} actions={canEdit && <Btn size="sm" variant="subtle" onClick={() => setManaging(true)}>{tx('Gérer les étapes', 'Manage steps')}</Btn>}>
          {events.length === 0 && <p className={s.muted + ' ' + s.small}>{tx('Aucune étape. Ajoutez-en avec « Gérer les étapes ».', 'No steps yet. Add some with "Manage steps".')}</p>}
          <div className={s.journey}>
            {events.map((e, i) => {
              const tasks = tasksOf(e.kind)
              const done = tasks.filter((t) => t.done).length
              const isNext = next && next.id === e.id
              return (
                <div key={e.id} className={s.jStep}>
                  <div className={s.jRail}>
                    <span className={cx(s.jDot, e.done && s.jDotDone, isNext && s.jDotNext)} aria-hidden="true"><Icon glyph={e.done ? '✓' : eventIcon(e)} /></span>
                    {i < events.length - 1 && <span className={s.jLine} />}
                  </div>
                  <div className={s.jCard}>
                    <div className={s.jHead}>
                      <div>
                        <div className={s.jTitle}>{stepTitle(e, lang, wedding.bride_culture)}</div>
                        <div className={s.jDate}>
                          {e.event_date ? date(e.event_date) : tx('Date à fixer', 'Date to set')}
                          {e.kind === 'honeymoon' && e.end_date ? ` → ${date(e.end_date)}` : ''}
                          {(e.venue || e.city) ? ` · ${[e.venue, e.city].filter(Boolean).join(', ')}` : ''}
                        </div>
                      </div>
                      {e.done ? <Chip tone="good">{tx('Fait', 'Done')}</Chip> : isNext ? <Chip tone="plum">{tx('Prochaine étape', 'Next up')}</Chip> : null}
                    </div>
                    {tasks.length > 0 && (
                      <div className={s.row} style={{ marginTop: 8 }}>
                        <div className={s.grow}><Progress parts={[{ value: done, className: s.pGood }]} total={tasks.length} /></div>
                        <span className={s.tiny + ' ' + s.muted}>{done}/{tasks.length}</span>
                      </div>
                    )}
                    <div className={s.jActions}>
                      {e.kind !== 'custom' && <Btn size="sm" variant="subtle" onClick={() => setGuideFor(e)}><Icon name="book" /> {tx('Guide', 'Guide')}</Btn>}
                      {canEdit && <Btn size="sm" variant="ghost" onClick={() => setEditing(e)}>{tx('Date & lieu', 'Date & place')}</Btn>}
                      {canEdit && <Btn size="sm" variant="ghost" onClick={() => update('events', e.id, { done: !e.done })}>{e.done ? tx('Rouvrir', 'Reopen') : tx('Marquer fait', 'Mark done')}</Btn>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className={s.stack}>
          <Card title={tx('À faire ensuite', 'Up next')} actions={<Btn size="sm" variant="subtle" onClick={() => go('taches')}>{tx('Tout voir', 'See all')}</Btn>}>
            {openTasks.length === 0 && <p className={s.muted + ' ' + s.small}>{tx('Rien en attente', 'Nothing pending')}</p>}
            <div className={s.list}>
              {openTasks.map((t) => (
                <label key={t.id} className={s.listItem} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                  <input type="checkbox" checked={!!t.done} disabled={!canEdit} onChange={() => toggleTask(t)} style={{ width: 18, height: 18, accentColor: 'var(--purple)' }} />
                  <span className={s.grow + ' ' + s.small}>{taskTitle(t, lang)}</span>
                  <span className={s.tiny + ' ' + s.muted + ' ' + s.nowrap}>{t.due_date ? (t.due_date <= today ? tx('dès que possible', 'as soon as you can') : date(t.due_date)) : ''}</span>
                </label>
              ))}
            </div>
          </Card>
          {ideas.length > 0 && (
            <Card title={tx('Et maintenant ?', 'What next?')}>
              <div className={s.stackSm}>
                {ideas.map((x) => (
                  <button key={x.go + x.text} type="button" className={s.pickable} onClick={() => go(x.go)}>
                    <span><Icon glyph={x.icon} /> {x.text}</span><span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {guideFor && <StepGuide event={guideFor} onClose={() => setGuideFor(null)} />}
      {editing && <EventEditor event={editing} onClose={() => setEditing(null)} />}
      {managing && <ManageSteps onClose={() => setManaging(false)} onAdd={() => { setManaging(false); setEditing({ kind: 'custom' }) }} />}
    </>
  )
}
