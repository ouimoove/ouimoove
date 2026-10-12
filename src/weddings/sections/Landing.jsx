import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Chip, cx, styles as s } from '../components/ui.jsx'
import { CULTURES } from '../data/cultures.js'
import { navigate } from '../router.js'
import { Icon } from '../../components/Icon.jsx'

const FEATURES = [
  { icon: '🧭', fr: ['Un parcours guidé', "Quelques questions sur vos étapes et vos dates, et Ouimoove crée votre plan : tâches datées, budget, liste de la dot."], en: ['A guided journey', 'Answer a few questions about your steps and dates, and Ouimoove builds your plan: dated tasks, budget, dowry list.'] },
  { icon: '🌍', fr: ['20 cultures africaines', 'Comment se passent le toquer à la porte et la dot chez les Éwé, Kabyè, Fon, Yoruba, Igbo, Akan, Kikuyu, Zoulou…'], en: ['20 African cultures', 'How knocking and the dowry work among the Ewe, Kabye, Fon, Yoruba, Igbo, Akan, Kikuyu, Zulu…'] },
  { icon: '👥', fr: ['Invités lui & elle', "Liste de souhaits, invités, ceux qui ne passent pas : comptez les places de chaque côté et suivez les réponses."], en: ['His & hers guests', 'Wish list, invited and cut: count the seats on each side and track the replies.'] },
  { icon: '💰', fr: ['Budget & réservations', 'Enveloppes par poste, prestataires à réserver, acomptes et soldes à payer.'], en: ['Budget & bookings', 'Envelopes per category, vendors to book, deposits and balances due.'] },
  { icon: '🪑', fr: ['Plan de table', 'Créez vos tables et placez vos invités en un geste, en gardant les familles ensemble.'], en: ['Seating plan', 'Create your tables and seat everyone in one tap, keeping families together.'] },
  { icon: '🌐', fr: ['Votre site de mariage', 'Programme, lieux, tenue, cadeaux et réponses des invités, à partager sur WhatsApp.'], en: ['Your wedding website', 'Schedule, venues, dress code, gifts and guest replies, ready to share on WhatsApp.'] },
  { icon: '🤝', fr: ['Prestataires Ouimoove', 'Wedding planners, traiteurs, photographes, décorateurs… demandez un devis en un message.'], en: ['Ouimoove vendors', 'Planners, caterers, photographers, decorators… request a quote in one message.'] },
  { icon: '#️⃣', fr: ['Hashtag & slogan', 'Des idées à partir de vos prénoms, de leur signification et de votre date.'], en: ['Hashtag & slogan', 'Ideas from your names, what they mean and your date.'] },
  { icon: '📖', fr: ['Votre mémoire', 'Un souvenir à garder : vos dates, vos chiffres, vos invités et leurs messages.'], en: ['Your memoir', 'A keepsake: your dates, your numbers, your guests and their messages.'] },
]

export function Landing() {
  const { tx, L, lang } = useI18n()
  const { user, localCount, importLocal } = useWedding()
  const { go, openAuth } = useUI()
  const [busy, setBusy] = useState(false)
  const journey = lang === 'en'
    ? ['Knocking', 'Dowry', 'Town hall', 'Church · Mosque', 'Reception', 'Honeymoon']
    : ['Toquer à la porte', 'Dot', 'Mairie', 'Église · Mosquée', 'Réception', 'Lune de miel']

  return (
    <>
      <section className={s.hero}>
        <div className={s.heroKicker}><span aria-hidden="true"><Icon name="ring" /></span> Ouimoove Weddings</div>
        <h1 className={s.heroTitle}>
          {lang === 'en' ? <>From the knock on the door <em>to forever</em></> : <>Du toc-toc à la porte <em>jusqu’au oui</em></>}
        </h1>
        <p className={s.heroSub}>
          {tx(
            "Préparez chaque étape de votre mariage : la présentation, la dot, la mairie, l'église ou la mosquée, la réception et la lune de miel. Invités, budget, plan de table, site web et prestataires au même endroit, avec vos deux familles.",
            'Plan every step of your wedding: the introduction, the dowry, the town hall, the church or mosque, the reception and the honeymoon. Guests, budget, seating, website and vendors in one place, with both your families.',
          )}
        </p>
        {user && localCount > 0 ? (
          <div className={s.heroCtas}>
            <Btn variant="accent" disabled={busy} onClick={async () => { setBusy(true); await importLocal(); setBusy(false) }}>
              {busy ? '…' : tx('Ajouter le plan de cet appareil à mon compte', "Add this device's plan to my account")}
            </Btn>
          </div>
        ) : (
          <div className={s.heroCtas}>
            <Btn variant="accent" onClick={() => go('nouveau')}>{tx('Commencer mon mariage', 'Start planning my wedding')} →</Btn>
            {!user && <Btn variant="ghost" onClick={() => openAuth('login')}>{tx("J'ai déjà un compte", 'I already have an account')}</Btn>}
          </div>
        )}
        <div className={s.journeyStrip} aria-label={tx('Les étapes', 'The steps')}>
          {journey.map((j, i) => (
            <span key={j}>{j}{i < journey.length - 1 && <b aria-hidden="true">→</b>}</span>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{tx('Tout votre mariage, au même endroit', 'Your whole wedding, in one place')}</h2>
        <p className={s.muted}>{tx('Gratuit pour les couples. En français et en anglais.', 'Free for couples. In French and English.')}</p>
        <div className={s.featureGrid}>
          {FEATURES.map((f) => {
            const [title, text] = lang === 'en' ? f.en : f.fr
            return (
              <div key={f.icon} className={s.feature}>
                <div className={s.featureIcon} aria-hidden="true"><Icon glyph={f.icon} /></div>
                <div className={s.featureTitle}>{title}</div>
                <div className={s.featureText}>{text}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{tx('Vos traditions, vos familles', 'Your traditions, your families')}</h2>
        <p className={s.muted} style={{ maxWidth: '62ch', lineHeight: 1.55 }}>
          {tx(
            "Choisissez la culture de chaque famille : Ouimoove vous explique les étapes, qui y va, quoi apporter, et prépare une première liste de dot à adapter avec vos aînés.",
            "Pick each family's culture: Ouimoove explains the steps, who goes, what to bring, and prepares a first dowry list to adapt with your elders.",
          )}
        </p>
        <div className={s.cultureCloud}>
          {CULTURES.filter((c) => c.id !== 'other').map((c) => <Chip key={c.id} tone="plum">{L(c.name)}</Chip>)}
        </div>
      </section>

      <section className={s.section}>
        <div className={cx(s.card, s.spread)}>
          <div>
            <div className={s.cardTitle}>{tx('Vous êtes prestataire de mariage ?', 'Are you a wedding vendor?')}</div>
            <p className={s.cardSub}>{tx('Wedding planner, traiteur, photographe, DJ, décorateur, location de chaises… Rejoignez le réseau Ouimoove et recevez des demandes de devis.', 'Planner, caterer, photographer, DJ, decorator, chair rental… Join the Ouimoove network and receive quote requests.')}</p>
          </div>
          <Btn variant="primary" onClick={() => go('prestataires')}>{tx('Voir le réseau', 'See the network')}</Btn>
        </div>
        <p className={s.small + ' ' + s.muted} style={{ textAlign: 'center', marginTop: 28 }}>
          <button type="button" className={s.linkBtn} onClick={() => navigate('/')}>{tx('← Retour aux événements Ouimoove', '← Back to Ouimoove events')}</button>
        </p>
      </section>
    </>
  )
}
