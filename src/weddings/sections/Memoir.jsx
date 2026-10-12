import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Names, PageHead, Stat, cx, styles as s } from '../components/ui.jsx'
import { buildMemoir, memoirStats } from '../lib/memoir.js'
import { coupleNames, slugify } from '../lib/basics.js'
import { PUBLIC_URL } from '../../utils/helpers.js'

export function Memoir() {
  const { tx, longDate, lang } = useI18n()
  const { wedding, rows, canEdit, updateWedding } = useWedding()
  const { toast } = useUI()
  const [opts, setOpts] = useState({ guests: true, messages: true, dowry: true, budget: false })
  const [busy, setBusy] = useState(false)
  const st = memoirStats({ wedding, rows })
  const married = wedding.status === 'married'

  const download = async () => {
    if (Capacitor.isNativePlatform()) {
      toast(tx('Ouvrez Ouimoove dans votre navigateur pour télécharger le mémoire.', 'Open Ouimoove in your browser to download the memoir.'), 'info')
      Browser.open({ url: `${PUBLIC_URL}/mariage/memoire` }).catch(() => {})
      return
    }
    setBusy(true)
    try {
      const doc = await buildMemoir({ wedding, rows }, lang, opts)
      doc.save(`memoire-${slugify(coupleNames(wedding, ' ')) || 'mariage'}.pdf`)
    } catch (e) {
      console.error(e)
      toast(tx("Le PDF n'a pas pu être créé.", "The PDF couldn't be created."), 'error')
    }
    setBusy(false)
  }

  const toggles = [
    ['dowry', tx('La liste de la dot', 'The dowry list')],
    ['guests', tx('La liste des invités', 'The guest list')],
    ['messages', tx('Les messages de vos invités', "Your guests' messages")],
    ['budget', tx('Le résumé du budget', 'The budget summary')],
  ]

  return (
    <>
      <PageHead
        title={tx('Votre mémoire', 'Your memoir')}
        sub={tx('Un souvenir à garder et à imprimer : votre parcours, vos dates, vos chiffres, vos invités et leurs mots. Il se complète au fil de vos préparatifs.', 'A keepsake to keep and print: your journey, dates, numbers, guests and their words. It fills in as you plan.')}
      />

      <div className={s.memoirCover}>
        <div className={s.rings} aria-hidden="true"><i /><i /></div>
        <div className={s.tiny + ' ' + s.muted} style={{ letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700 }}>{tx('Le mariage de', 'The wedding of')}</div>
        <div style={{ margin: '8px 0' }}><Names wedding={wedding} size="clamp(2.4rem, 6vw, 3.4rem)" /></div>
        {st.main && <div>{longDate(st.main)}</div>}
        {wedding.hashtag && <div style={{ marginTop: 10 }}><Chip tone="gold">{wedding.hashtag}</Chip></div>}
        {wedding.slogan && <p className={s.slogan} style={{ marginTop: 10 }}>{wedding.slogan}</p>}
      </div>

      <div className={s.stats}>
        <Stat value={st.prepDays} label={tx('jours de préparation', 'days of planning')} />
        <Stat value={st.steps} label={tx('étapes célébrées', 'steps celebrated')} />
        <Stat value={st.invitedSeats} label={tx('places d’invités', 'guest seats')} sub={`${st.groomSeats} · ${st.brideSeats}`} />
        <Stat value={st.confirmed} label={tx('présences confirmées', 'confirmed guests')} />
        <Stat value={`${st.tasksDone}/${st.tasks}`} label={tx('tâches accomplies', 'tasks completed')} />
        <Stat value={st.vendors} label={tx('prestataires réservés', 'vendors booked')} />
        <Stat value={st.dowryItems} label={tx('présents de dot', 'dowry gifts')} />
        <Stat value={st.messages} label={tx('messages reçus', 'messages received')} />
      </div>

      <Card title={tx('Ce que contient votre mémoire', 'What your memoir includes')} sub={tx('La couverture, votre parcours et vos chiffres sont toujours inclus.', 'The cover, your journey and your numbers are always included.')}>
        <div className={s.stackSm}>
          {toggles.map(([k, label]) => (
            <label key={k} className={s.check}><input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} /> {label}</label>
          ))}
        </div>
        <div className={s.rowWrap} style={{ marginTop: 16 }}>
          <Btn variant="accent" onClick={download} disabled={busy}>{busy ? '…' : tx('Télécharger le mémoire (PDF)', 'Download the memoir (PDF)')}</Btn>
          <span className={s.small + ' ' + s.muted}>{tx('Format A5, prêt à imprimer.', 'A5 format, ready to print.')}</span>
        </div>
      </Card>

      {canEdit && (
        <div className={cx(s.banner, married ? s.bannerGood : s.bannerInfo)}>
          <span>{married ? tx('Félicitations, vous êtes mariés ! Votre mémoire est complet.', "Congratulations, you're married! Your memoir is complete.") : tx('Le grand jour est passé ? Marquez votre mariage comme célébré.', 'Has the big day happened? Mark your wedding as celebrated.')}</span>
          <Btn size="sm" variant={married ? 'ghost' : 'primary'} onClick={() => updateWedding({ status: married ? 'planning' : 'married' })}>
            {married ? tx('Revenir en préparation', 'Back to planning') : tx('Nous sommes mariés', "We're married")}
          </Btn>
        </div>
      )}
    </>
  )
}
