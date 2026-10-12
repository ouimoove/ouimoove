import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Field, Input, PageHead, Seg, copyText, cx, styles as s } from '../components/ui.jsx'
import { makeHashtags, makeSlogans, word } from '../lib/hashtags.js'
import { mainDate } from '../lib/plan.js'

const GROUPS = {
  classic: { fr: 'Classiques', en: 'Classic' },
  fun: { fr: 'Pleins d’humour', en: 'Playful' },
  family: { fr: 'Avec votre nom de famille', en: 'With your family name' },
  meaning: { fr: 'Avec le sens de vos prénoms', en: 'With what your names mean' },
  tradition: { fr: 'Pour la cérémonie traditionnelle', en: 'For the traditional ceremony' },
  words: { fr: 'Avec vos mots', en: 'With your words' },
}

export function Hashtags() {
  const { tx, L, lang } = useI18n()
  const { wedding, rows, canEdit, updateWedding } = useWedding()
  const { toast } = useUI()
  const prefs = wedding.prefs || {}
  const [f, setF] = useState(() => ({
    groom: wedding.groom_name || '', bride: wedding.bride_name || '', family: wedding.family_name || '',
    date: mainDate(rows.events) || '', groomMeaning: prefs.groom_meaning || '', brideMeaning: prefs.bride_meaning || '', words: prefs.hashtag_words || '',
  }))
  const [own, setOwn] = useState('')
  const [sloganLang, setSloganLang] = useState(lang)
  const [ownSlogan, setOwnSlogan] = useState(wedding.slogan || '')
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const input = { ...f, words: f.words.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean) }
  const tags = useMemo(() => makeHashtags(input), [JSON.stringify(input)]) // eslint-disable-line react-hooks/exhaustive-deps
  const slogans = useMemo(() => makeSlogans(input, sloganLang), [JSON.stringify(input), sloganLang]) // eslint-disable-line react-hooks/exhaustive-deps
  const grouped = Object.keys(GROUPS).map((g) => ({ g, list: tags.filter((t) => t.group === g) })).filter((x) => x.list.length)

  const rememberInputs = () => updateWedding({ prefs: { ...prefs, groom_meaning: f.groomMeaning.trim() || null, bride_meaning: f.brideMeaning.trim() || null, hashtag_words: f.words.trim() || null } })
  const choose = async (tag) => {
    const clean = '#' + word(tag.replace(/^#/, ''))
    if (clean.length < 3) return
    if (await updateWedding({ hashtag: clean.slice(0, 80) })) {
      toast(tx(`${clean} est votre hashtag ✓`, `${clean} is your hashtag ✓`), 'success')
      rememberInputs()
    }
  }
  const chooseSlogan = async (text) => {
    if (await updateWedding({ slogan: text.trim().slice(0, 200) || null })) {
      setOwnSlogan(text)
      toast(tx('Slogan enregistré ✓', 'Slogan saved ✓'), 'success')
    }
  }

  return (
    <>
      <PageHead
        title={tx('Hashtag & slogan', 'Hashtag & slogan')}
        sub={tx('Des idées à partir de vos prénoms, de leur signification, de votre nom de famille et de votre date. Le hashtag choisi apparaît sur votre site et dans votre mémoire.', 'Ideas from your first names, what they mean, your family name and your date. Your chosen hashtag appears on your website and in your memoir.')}
      />
      {wedding.hashtag && (
        <div className={cx(s.banner, s.bannerGood)}>
          <span>{tx('Votre hashtag :', 'Your hashtag:')} <b>{wedding.hashtag}</b>{wedding.slogan ? <> · <i>{wedding.slogan}</i></> : null}</span>
          <div className={s.rowWrap}>
            <Btn size="sm" variant="ghost" onClick={() => copyText(wedding.hashtag, toast, tx)}>{tx('Copier', 'Copy')}</Btn>
            <a className={cx(s.btn, s.btnGhost, s.btnSm)} href={`https://www.instagram.com/explore/tags/${encodeURIComponent(wedding.hashtag.slice(1))}/`} target="_blank" rel="noopener noreferrer">{tx('Voir sur Instagram', 'See on Instagram')}</a>
          </div>
        </div>
      )}

      <Card title={tx('Parlez-nous de vous', 'Tell us about you')}>
        <div className={s.formGrid}>
          <Field label={tx('Prénom (ou surnom) du marié', "Groom's first name or nickname")}><Input value={f.groom} maxLength={40} onChange={(e) => set({ groom: e.target.value })} /></Field>
          <Field label={tx('Prénom (ou surnom) de la mariée', "Bride's first name or nickname")}><Input value={f.bride} maxLength={40} onChange={(e) => set({ bride: e.target.value })} /></Field>
          <Field label={tx('Nom de famille', 'Family name')}><Input value={f.family} maxLength={40} onChange={(e) => set({ family: e.target.value })} /></Field>
          <Field label={tx('Date', 'Date')}><Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          <Field label={tx('Ce que signifie son prénom à lui', 'What his name means')} hint={tx('Ex. : « désir », « force »', 'e.g. "desire", "strength"')}><Input value={f.groomMeaning} maxLength={30} onChange={(e) => set({ groomMeaning: e.target.value })} /></Field>
          <Field label={tx('Ce que signifie son prénom à elle', 'What her name means')} hint={tx('Ex. : Kekeli = « lumière »', 'e.g. Kekeli = "light"')}><Input value={f.brideMeaning} maxLength={30} onChange={(e) => set({ brideMeaning: e.target.value })} /></Field>
        </div>
        <Field label={tx('Des mots qui vous ressemblent (séparés par des virgules)', 'Words that describe you (comma separated)')} hint={tx('Une ville, un lieu de rencontre, une passion… Ex. : Lomé, Bahamas, football', 'A city, where you met, a passion… e.g. Lomé, Bahamas, football')} className={s.grow}>
          <Input value={f.words} maxLength={120} onChange={(e) => set({ words: e.target.value })} />
        </Field>
      </Card>

      {grouped.length === 0 && <Card><p className={s.muted}>{tx('Ajoutez au moins un prénom pour voir des idées.', 'Add at least one first name to see ideas.')}</p></Card>}
      {grouped.map(({ g, list }) => (
        <Card key={g} title={L(GROUPS[g])}>
          <div className={s.tagGrid}>
            {list.map((t) => (
              <div key={t.tag} className={cx(s.tag, wedding.hashtag?.toLowerCase() === t.tag.toLowerCase() && s.tagChosen)}>
                <span>{t.tag}{t.long && <span className={s.tiny + ' ' + s.muted} title={tx('Un peu long à taper', 'A bit long to type')}> ·⋯</span>}</span>
                <span className={s.row} style={{ gap: 4, flexShrink: 0 }}>
                  <Btn size="sm" variant="subtle" onClick={() => copyText(t.tag, toast, tx)} aria-label={tx(`Copier ${t.tag}`, `Copy ${t.tag}`)}>⧉</Btn>
                  {canEdit && <Btn size="sm" variant="ghost" onClick={() => choose(t.tag)}>{wedding.hashtag?.toLowerCase() === t.tag.toLowerCase() ? '★' : tx('Choisir', 'Pick')}</Btn>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {canEdit && (
        <Card title={tx('Le vôtre', 'Your own')}>
          <form className={s.row} onSubmit={(e) => { e.preventDefault(); if (own.trim()) choose(own) }}>
            <Input value={own} maxLength={60} onChange={(e) => setOwn(e.target.value)} placeholder="#" />
            <Btn type="submit" variant="primary">{tx('Choisir', 'Pick')}</Btn>
          </form>
          <p className={s.tiny + ' ' + s.muted} style={{ marginTop: 8 }}>{tx('Avant de l’imprimer, cherchez-le sur Instagram pour vérifier qu’il n’est pas déjà pris.', 'Before printing it, search it on Instagram to check it is not already taken.')}</p>
        </Card>
      )}

      <Card title={tx('Slogans', 'Slogans')} sub={tx('Pour vos faire-part, votre site ou la décoration.', 'For your invitations, website or decor.')} actions={<Seg value={sloganLang} onChange={setSloganLang} options={[{ value: 'fr', label: 'FR' }, { value: 'en', label: 'EN' }]} label={tx('Langue', 'Language')} />}>
        <div className={s.list}>
          {slogans.map((x) => (
            <div key={x} className={s.listItem}>
              <span className={cx(s.slogan, s.grow)}>{x}</span>
              <Btn size="sm" variant="subtle" onClick={() => copyText(x, toast, tx)} aria-label={tx('Copier', 'Copy')}>⧉</Btn>
              {canEdit && <Btn size="sm" variant="ghost" onClick={() => chooseSlogan(x)}>{wedding.slogan === x ? '★' : tx('Choisir', 'Pick')}</Btn>}
            </div>
          ))}
        </div>
        {canEdit && (
          <form className={s.row} style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); chooseSlogan(ownSlogan) }}>
            <Input value={ownSlogan} maxLength={200} onChange={(e) => setOwnSlogan(e.target.value)} placeholder={tx('Ou écrivez le vôtre', 'Or write your own')} />
            <Btn type="submit" variant="primary">{tx('Enregistrer', 'Save')}</Btn>
          </form>
        )}
      </Card>
      <p className={s.small + ' ' + s.muted} style={{ textAlign: 'center' }}><Chip tone="gold">{tags.length}</Chip> {tx('idées générées', 'ideas generated')}</p>
    </>
  )
}
