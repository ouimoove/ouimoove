import { useState } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { FAQS } from '../data/content.js'
import { Icon } from './Icon.jsx'
import styles from './HomeSections.module.css'

const HOW = [
  { icon: 'search', title: 'Trouvez', text: 'Filtrez par ville, catégorie ou prix et ajoutez vos coups de cœur en favoris.' },
  { icon: 'ticket', title: 'Réservez', text: 'Payez par Tmoney, Flooz ou carte bancaire. Jusqu’à 10 billets par commande.' },
  { icon: 'phone', title: 'Présentez', text: 'Votre billet est un QR code dans « Mes billets ». Zéro papier, scan à l’entrée.' },
  { icon: 'store', title: 'Revendez', text: 'Un empêchement ? Remettez votre billet en vente en toute sécurité sur le marché.' },
]

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, shown] = useReveal()
  return (
    <div ref={ref} className={[styles.reveal, shown ? styles.shown : '', className].join(' ')} style={{ '--d': `${delay}ms` }}>
      {children}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section className={styles.section} id="comment-ca-marche" aria-labelledby="how-title">
      <Reveal>
        <p className={styles.kicker}>En 4 étapes</p>
        <h2 id="how-title" className={styles.title}>Comment ça marche</h2>
      </Reveal>
      <ol className={styles.steps}>
        {HOW.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={i * 90} className={styles.step}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.stepIcon}><Icon name={s.icon} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FaqSection({ onContact }) {
  const [open, setOpen] = useState(0)
  return (
    <section className={`${styles.section} ${styles.faq}`} id="faq" aria-labelledby="faq-title">
      <Reveal>
        <p className={styles.kicker}>Une question ?</p>
        <h2 id="faq-title" className={styles.title}>Questions fréquentes</h2>
      </Reveal>
      <div className={styles.faqList}>
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 40}>
            <div className={[styles.item, open === i ? styles.itemOpen : ''].join(' ')}>
              <button className={styles.q} aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className={styles.plus}><Icon name="plus" /></span>
              </button>
              <div className={styles.a}><p>{f.a}</p></div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className={styles.more}>
        Une autre question ? <button onClick={onContact}>Écrivez-nous</button>
      </p>
    </section>
  )
}

export function CtaBand({ onCreateEvent, onWeddings }) {
  return (
    <section className={styles.cta}>
      <Reveal className={styles.ctaInner}>
        <h2>Vous organisez un événement&nbsp;?</h2>
        <p>Publiez gratuitement, vendez vos billets en ligne et scannez les entrées le jour J.</p>
        <div className={styles.ctaBtns}>
          <button className={styles.ctaMain} onClick={onCreateEvent}>Créer un événement <Icon name="arrow" /></button>
          <button className={styles.ctaGhost} onClick={onWeddings}><Icon name="ring" /> Ouimoove Weddings</button>
        </div>
      </Reveal>
    </section>
  )
}
