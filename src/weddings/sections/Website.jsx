import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PUBLIC_URL } from '../../utils/helpers.js'
import { useI18n } from '../i18n.jsx'
import { useWedding } from '../store/WeddingStore.jsx'
import { useUI } from '../components/uiContext.js'
import { Btn, Card, Chip, Field, Input, PageHead, Seg, Textarea, copyText, cx, styles as s } from '../components/ui.jsx'
import { eventIcon, sortEvents } from '../components/Events.jsx'
import { SITE_THEMES } from '../data/templates.js'
import { stepTitle } from '../lib/plan.js'
import { slugify, firstWord, parseISO, coupleNames } from '../lib/basics.js'

// Shrinks phone photos before upload (faster on mobile data, under 5 MB).
export async function resizeImage(file, max = 1600, quality = 0.85) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function suggestSlug(w, events) {
  const main = events.find((e) => e.kind === 'reception' && e.event_date) || events.find((e) => e.event_date)
  const year = main ? parseISO(main.event_date)?.getFullYear() : ''
  return slugify([firstWord(w.groom_name), firstWord(w.bride_name), year].filter(Boolean).join(' ')) || 'notre-mariage'
}

export function Website() {
  const { tx, L, lang, date } = useI18n()
  const { wedding, rows, canEdit, isLocal, user, updateWedding, update } = useWedding()
  const { toast, openAuth, go } = useUI()
  const site = wedding.site || {}
  const [f, setF] = useState(() => ({
    slug: wedding.slug || suggestSlug(wedding, rows.events),
    theme: site.theme || 'plum',
    cover_url: site.cover_url || '',
    welcome: site.welcome || '',
    story: site.story || '',
    dress_code: site.dress_code || '',
    gifts: site.gifts || '',
    contact: site.contact || '',
    rsvp_open: site.rsvp_open !== false,
    rsvp_deadline: site.rsvp_deadline || '',
    show_hashtag: site.show_hashtag !== false,
    site_lang: wedding.lang || 'fr',
  }))
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [qr, setQr] = useState('')
  const set = (p) => setF((prev) => ({ ...prev, ...p }))
  const slug = slugify(f.slug)
  const url = `${PUBLIC_URL}/w/${slug || '…'}`
  const published = wedding.site_published && wedding.slug
  const liveUrl = published ? `${PUBLIC_URL}/w/${wedding.slug}` : null
  const events = sortEvents(rows.events.filter((e) => e.included !== false))
  const dirty = useMemo(() => JSON.stringify({
    slug, theme: f.theme, cover_url: f.cover_url, welcome: f.welcome, story: f.story, dress_code: f.dress_code, gifts: f.gifts,
    contact: f.contact, rsvp_open: f.rsvp_open, rsvp_deadline: f.rsvp_deadline, show_hashtag: f.show_hashtag, site_lang: f.site_lang,
  }) !== JSON.stringify({
    slug: wedding.slug || '', theme: site.theme || 'plum', cover_url: site.cover_url || '', welcome: site.welcome || '', story: site.story || '',
    dress_code: site.dress_code || '', gifts: site.gifts || '', contact: site.contact || '', rsvp_open: site.rsvp_open !== false,
    rsvp_deadline: site.rsvp_deadline || '', show_hashtag: site.show_hashtag !== false, site_lang: wedding.lang || 'fr',
  }), [f, slug, wedding, site])

  useEffect(() => {
    if (!liveUrl) { setQr(''); return }
    let alive = true
    import('qrcode').then((QR) => QR.toDataURL(liveUrl, { width: 264, margin: 1, color: { dark: '#2a1730', light: '#ffffff' } }))
      .then((d) => { if (alive) setQr(d) }).catch(() => {})
    return () => { alive = false }
  }, [liveUrl])

  const content = () => ({
    ...site,
    theme: f.theme,
    cover_url: /^https:\/\//.test(f.cover_url) ? f.cover_url : '',
    welcome: f.welcome.trim().slice(0, 600),
    story: f.story.trim().slice(0, 4000),
    dress_code: f.dress_code.trim().slice(0, 300),
    gifts: f.gifts.trim().slice(0, 1500),
    contact: f.contact.trim().slice(0, 200),
    rsvp_open: f.rsvp_open,
    rsvp_deadline: f.rsvp_deadline || null,
    show_hashtag: f.show_hashtag,
  })
  const save = async (publish) => {
    if (slug.length < 3) { toast(tx("L'adresse doit faire au moins 3 caractères.", 'The address needs at least 3 characters.'), 'error'); return }
    if (publish && isLocal) { openAuth('signup', tx('Créez un compte pour publier votre site.', 'Create an account to publish your website.')); return }
    setBusy(true)
    const ok = await updateWedding({ slug, site: content(), lang: f.site_lang, ...(publish != null ? { site_published: publish } : {}) })
    setBusy(false)
    if (ok) {
      set({ slug })
      toast(publish === true ? tx('Votre site est en ligne 🎉', 'Your website is live 🎉') : publish === false ? tx('Site dépublié.', 'Website unpublished.') : tx('Enregistré ✓', 'Saved ✓'), 'success')
    }
  }
  const upload = async (file) => {
    if (!file) return
    if (!user) { openAuth('signup', tx('Créez un compte pour ajouter une photo.', 'Create an account to add a photo.')); return }
    if (!/^image\//.test(file.type)) { toast(tx('Choisissez une image.', 'Choose an image.'), 'error'); return }
    setUploading(true)
    try {
      const blob = await resizeImage(file)
      const path = `${user.id}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('wedding-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path)
      set({ cover_url: data.publicUrl })
      toast(tx('Photo ajoutée. Pensez à enregistrer.', 'Photo added. Remember to save.'), 'success')
    } catch (e) {
      toast(tx("La photo n'a pas pu être envoyée. Vous pouvez coller le lien d'une image à la place.", "The photo couldn't be uploaded. You can paste an image link instead.") + (e?.message ? ` (${e.message})` : ''), 'error')
    }
    setUploading(false)
  }
  const shareText = () => tx(
    `${coupleNames(wedding)} se marient ! Programme, lieux et réponse ici : ${liveUrl}`,
    `${coupleNames(wedding)} are getting married! Schedule, venues and RSVP here: ${liveUrl}`,
  )

  return (
    <>
      <PageHead
        title={tx('Site du mariage', 'Wedding website')}
        sub={tx('Une page à partager sur WhatsApp : votre programme, les lieux, la tenue, les cadeaux, et un formulaire de réponse relié à votre liste d’invités.', 'A page to share on WhatsApp: your schedule, venues, dress code, gifts and an RSVP form linked to your guest list.')}
        actions={liveUrl && <Btn size="sm" variant="ghost" onClick={() => window.open(liveUrl, '_blank', 'noopener')}>{tx('Voir le site ↗', 'View site ↗')}</Btn>}
      />

      <Card>
        <div className={s.spread}>
          <div className={s.stackSm}>
            <div className={s.rowWrap}>
              <Chip tone={published ? 'good' : undefined}>{published ? tx('En ligne', 'Live') : tx('Brouillon', 'Draft')}</Chip>
              {published && <span className={s.small}>{liveUrl.replace('https://', '')}</span>}
            </div>
            {published && (
              <div className={s.rowWrap}>
                <Btn size="sm" variant="accent" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, '_blank', 'noopener')}>💬 {tx('Partager sur WhatsApp', 'Share on WhatsApp')}</Btn>
                <Btn size="sm" variant="ghost" onClick={() => copyText(liveUrl, toast, tx)}>{tx('Copier le lien', 'Copy link')}</Btn>
              </div>
            )}
          </div>
          {qr && <img src={qr} alt={tx('QR code du site', 'Website QR code')} className={s.qr} title={tx('À imprimer sur vos faire-part', 'Print it on your invitations')} />}
        </div>
        {canEdit && (
          <div className={s.rowWrap} style={{ marginTop: 14 }}>
            {published
              ? <Btn variant="ghost" disabled={busy} onClick={() => save(false)}>{tx('Dépublier', 'Unpublish')}</Btn>
              : <Btn variant="primary" disabled={busy} onClick={() => save(true)}>{tx('Publier le site', 'Publish the website')}</Btn>}
            <Btn variant="subtle" disabled={busy || !dirty} onClick={() => save(null)}>{dirty ? tx('Enregistrer les modifications', 'Save changes') : tx('Tout est enregistré', 'All saved')}</Btn>
          </div>
        )}
      </Card>

      <fieldset disabled={!canEdit} className={s.stack} style={{ border: 0, padding: 0, margin: 0 }}>
        <Card title={tx('Adresse et style', 'Address and style')}>
          <div className={s.stack}>
            <Field label={tx('Adresse du site', 'Website address')} hint={tx('Lettres, chiffres et tirets. Courte et facile à dire.', 'Letters, numbers and dashes. Short and easy to say.')}>
              <div className={s.urlBox}><span>ouimoove.app/w/</span><input value={f.slug} maxLength={60} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} onBlur={() => set({ slug })} aria-label={tx('Adresse', 'Address')} /></div>
            </Field>
            <Field group label={tx('Couleurs', 'Colours')}>
              <div className={s.swatches}>
                {Object.entries(SITE_THEMES).map(([id, t]) => (
                  <button key={id} type="button" className={cx(s.swatch, f.theme === id && s.swatchOn)} aria-pressed={f.theme === id} onClick={() => set({ theme: id })}>
                    <i style={{ background: `linear-gradient(135deg, ${t.accent} 50%, ${t.gold} 50%)` }} />{L(t)}
                  </button>
                ))}
              </div>
            </Field>
            <Field group label={tx('Photo de couverture', 'Cover photo')}>
              <div className={s.stackSm}>
                {f.cover_url && <img src={f.cover_url} alt="" className={s.coverPreview} />}
                <div className={s.rowWrap}>
                  <label className={cx(s.btn, s.btnGhost, s.btnSm)} style={{ cursor: 'pointer' }}>
                    {uploading ? tx('Envoi…', 'Uploading…') : f.cover_url ? tx('Changer la photo', 'Change photo') : tx('Ajouter une photo', 'Add a photo')}
                    <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
                  </label>
                  {f.cover_url && <Btn size="sm" variant="subtle" onClick={() => set({ cover_url: '' })}>{tx('Retirer', 'Remove')}</Btn>}
                </div>
                <Input value={f.cover_url} onChange={(e) => set({ cover_url: e.target.value.trim() })} placeholder={tx("…ou collez le lien d'une image (https://…)", '…or paste an image link (https://…)')} inputMode="url" />
              </div>
            </Field>
            <Field group label={tx('Langue du site', 'Website language')} hint={tx('Vos invités peuvent changer de langue.', 'Guests can switch language.')}>
              <div><Seg value={f.site_lang} onChange={(v) => set({ site_lang: v })} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} /></div>
            </Field>
          </div>
        </Card>

        <Card title={tx('Vos mots', 'Your words')}>
          <div className={s.stack}>
            <Field label={tx("Mot d'accueil", 'Welcome message')}><Textarea value={f.welcome} maxLength={600} onChange={(e) => set({ welcome: e.target.value })} placeholder={tx('Avec la bénédiction de nos familles, nous avons la joie de vous inviter…', 'With the blessing of our families, we are delighted to invite you…')} /></Field>
            <Field label={tx('Notre histoire', 'Our story')}><Textarea value={f.story} maxLength={4000} onChange={(e) => set({ story: e.target.value })} style={{ minHeight: 140 }} placeholder={tx('Comment vous vous êtes rencontrés, la demande…', 'How you met, the proposal…')} /></Field>
            <div className={s.rowWrap}>
              <label className={s.check}><input type="checkbox" checked={f.show_hashtag} onChange={(e) => set({ show_hashtag: e.target.checked })} /> {tx('Afficher notre hashtag et notre slogan', 'Show our hashtag and slogan')}</label>
              {!wedding.hashtag && <button type="button" className={s.linkBtn} onClick={() => go('hashtag')}>{tx('Choisir un hashtag', 'Pick a hashtag')}</button>}
            </div>
          </div>
        </Card>

        <Card title={tx('Programme', 'Schedule')} sub={tx('Les étapes cochées apparaissent sur le site, avec la date, l’heure, le lieu et le lien Google Maps.', 'Ticked steps appear on the site with the date, time, venue and Google Maps link.')} actions={<Btn size="sm" variant="subtle" onClick={() => go('')}>{tx('Modifier dates et lieux', 'Edit dates and places')}</Btn>}>
          <div className={s.list}>
            {events.map((e) => (
              <label key={e.id} className={s.listItem} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={!!e.show_on_site} onChange={() => update('events', e.id, { show_on_site: !e.show_on_site })} style={{ width: 18, height: 18, accentColor: 'var(--purple)' }} />
                <span aria-hidden="true">{eventIcon(e)}</span>
                <span className={s.grow}>{stepTitle(e, lang, wedding.bride_culture)}</span>
                <span className={s.tiny + ' ' + s.muted}>{e.event_date ? date(e.event_date) : tx('date à fixer', 'date to set')}{e.kind === 'honeymoon' || e.kind === 'knocking' ? ` · ${tx('privé par défaut', 'private by default')}` : ''}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title={tx('Infos pratiques', 'Practical info')}>
          <div className={s.stack}>
            <Field label={tx('Tenue', 'Dress code')}><Input value={f.dress_code} maxLength={300} onChange={(e) => set({ dress_code: e.target.value })} placeholder={tx('Ex. : pagne des familles pour la dot, tenue de soirée pour la réception', 'e.g. family fabric for the dowry, black tie for the reception')} /></Field>
            <Field label={tx('Cadeaux & cagnotte', 'Gifts & cash fund')} hint={tx('Mobile money, virement, liste de cadeaux… Ne mettez que ce que vous voulez rendre public.', 'Mobile money, bank transfer, gift list… Only add what you are happy to make public.')}>
              <Textarea value={f.gifts} maxLength={1500} onChange={(e) => set({ gifts: e.target.value })} placeholder={tx('Ex. : Flooz / T-Money au +228 …', 'e.g. Mobile money: +228 …')} />
            </Field>
            <Field label={tx('Contact pour les invités', 'Contact for guests')}><Input value={f.contact} maxLength={200} onChange={(e) => set({ contact: e.target.value })} placeholder={tx('Ex. : Afi (coordinatrice) +228 90 00 00 00', 'e.g. Afi (coordinator) +228 90 00 00 00')} /></Field>
          </div>
        </Card>

        <Card title={tx('Réponses des invités', 'Guest replies')}>
          <div className={s.formGrid}>
            <label className={s.check}><input type="checkbox" checked={f.rsvp_open} onChange={(e) => set({ rsvp_open: e.target.checked })} /> {tx('Accepter les réponses sur le site', 'Accept replies on the site')}</label>
            <Field label={tx('Répondre avant le (facultatif)', 'Reply by (optional)')}><Input type="date" value={f.rsvp_deadline} onChange={(e) => set({ rsvp_deadline: e.target.value })} /></Field>
          </div>
          <p className={s.small + ' ' + s.muted} style={{ marginTop: 10 }}>{tx('Les réponses arrivent dans Invités → Réponses du site, et mettent à jour l’invité quand son nom ou son téléphone correspond.', 'Replies land in Guests → Website replies, and update the guest when their name or phone matches.')}</p>
        </Card>
      </fieldset>

      {canEdit && dirty && (
        <div className={cx(s.banner, s.bannerWarn)} style={{ position: 'sticky', bottom: 12 }}>
          <span>{tx('Modifications non enregistrées.', 'Unsaved changes.')}</span>
          <Btn size="sm" variant="primary" disabled={busy} onClick={() => save(null)}>{tx('Enregistrer', 'Save')}</Btn>
        </div>
      )}
    </>
  )
}
