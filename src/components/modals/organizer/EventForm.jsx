import { useState } from 'react'
import { CATEGORIES, CITIES } from '../../../data/events.js'
import { inputStyle, labelStyle, groupStyle } from './shared.jsx'

const OTHER_CITY = '__other__'

// Shared by the "Créer" tab and MyEventsTab's inline edit view.
export function EventForm({ initial, submitLabel, onSubmit, onCancel, onUploadImage, onRequestCity, cities, toast }) {
  const allCities = cities?.length ? cities : CITIES

  const [title,       setTitle]       = useState(initial?.title       || '')
  const [category,    setCategory]    = useState(initial?.category    || CATEGORIES[0])
  const [date,        setDate]        = useState(initial?.date        || '')
  const [time,        setTime]        = useState(initial?.time        || '20:00')
  const [location,    setLocation]    = useState(initial?.location    || '')
  const initCity = initial?.city && allCities.includes(initial.city) ? initial.city : (initial?.city ? OTHER_CITY : allCities[0])
  const [citySelect,  setCitySelect]  = useState(initCity)
  const [customCity,  setCustomCity]  = useState(initial?.city && !allCities.includes(initial.city) ? initial.city : '')
  const [cityReqSent, setCityReqSent] = useState(false)
  const city = citySelect === OTHER_CITY ? customCity.trim() : citySelect
  const [desc,        setDesc]        = useState(initial?.desc        || '')
  const [emoji,       setEmoji]       = useState(initial?.emoji       || '')
  const [imageUrl,    setImageUrl]    = useState(initial?.imageUrl    || '')
  const [isPrivate,   setIsPrivate]   = useState(initial?.isPrivate   || false)
  const [ticketTypes, setTicketTypes] = useState(
    initial?.tickets?.length
      ? initial.tickets.map(t => ({ name: t.name, price: String(t.price), qty: String(t.total) }))
      : [{ name: '', price: '', qty: '100' }]
  )
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const addTicketType    = () => setTicketTypes(tt => [...tt, { name: '', price: '', qty: '100' }])
  const removeTicketType = (i) => setTicketTypes(tt => tt.filter((_, idx) => idx !== i))
  const updateTicket     = (i, field, val) => setTicketTypes(tt => tt.map((t, idx) => idx === i ? { ...t, [field]: val } : t))

  const submit = async () => {
    if (!title.trim() || !date || !location.trim()) { setError('Titre, date et lieu sont requis.'); return }
    if (!city) { setError('Veuillez entrer le nom de la ville.'); return }
    const tickets = ticketTypes
      .filter(t => t.name.trim())
      .map(t => ({ name: t.name.trim(), price: parseInt(t.price) || 0, total: parseInt(t.qty) || 100, sold: 0 }))
    if (!tickets.length) { setError('Ajoutez au moins un type de billet avec un nom.'); return }
    setError(''); setLoading(true)
    await onSubmit({ title: title.trim(), category, date, time, location: location.trim(), city, desc: desc.trim(), emoji: emoji || '🎟️', imageUrl: imageUrl.trim() || null, isPrivate, tickets })
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...groupStyle, flex: 2 }}>
          <label style={labelStyle}>Titre *</label>
          <input style={inputStyle} placeholder="Ex: Festival de Jazz de Lomé" value={title} onChange={e => setTitle(e.target.value)} maxLength={150} />
        </div>
        <div style={{ ...groupStyle, flex: 1 }}>
          <label style={labelStyle}>Emoji</label>
          <input style={inputStyle} placeholder="🎵" maxLength={2} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...groupStyle, flex: 1 }}>
          <label style={labelStyle}>Catégorie</label>
          <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ ...groupStyle, flex: 1 }}>
          <label style={labelStyle}>Ville</label>
          <select style={inputStyle} value={citySelect} onChange={e => { setCitySelect(e.target.value); setCityReqSent(false) }}>
            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
            <option value={OTHER_CITY}>Autre ville…</option>
          </select>
          {citySelect === OTHER_CITY && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Nom de la ville"
                  value={customCity}
                  onChange={e => { setCustomCity(e.target.value); setCityReqSent(false) }}
                />
                <button
                  type="button"
                  disabled={!customCity.trim() || cityReqSent}
                  onClick={async () => {
                    const result = await onRequestCity?.(customCity)
                    if (result?.ok) { setCityReqSent(true); toast?.('Demande envoyée ! Les admins l\'examineront.', 'success') }
                    else toast?.(result?.error || 'Erreur lors de la demande', 'error')
                  }}
                  style={{ flexShrink: 0, padding: '0 14px', borderRadius: 10, border: 'none', background: cityReqSent ? 'rgba(34,197,94,.2)' : 'linear-gradient(135deg,var(--purple),var(--purple2))', color: cityReqSent ? 'var(--success)' : '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: (!customCity.trim() || cityReqSent) ? 'not-allowed' : 'pointer', opacity: (!customCity.trim() || cityReqSent) ? 0.6 : 1 }}
                >
                  {cityReqSent ? '✓ Demandé' : 'Demander'}
                </button>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 5 }}>
                Votre événement sera publié. Les admins ajouteront la ville à la liste.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...groupStyle, flex: 1 }}>
          <label style={labelStyle}>Date *</label>
          <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ ...groupStyle, flex: 1 }}>
          <label style={labelStyle}>Heure</label>
          <input style={inputStyle} type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Lieu *</label>
        <input style={inputStyle} placeholder="Palais des Congrès, Lomé" value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Décrivez votre événement…" value={desc} onChange={e => setDesc(e.target.value)} maxLength={5000} />
      </div>

      <div style={groupStyle}>
        <label style={labelStyle}>Image de couverture</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input style={{ ...inputStyle, flex: 1 }} type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          {onUploadImage && (
            <label style={{ flexShrink: 0, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              📁 Fichier
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                toast?.('Téléchargement…', 'info')
                const url = await onUploadImage(file)
                if (url) { setImageUrl(url); toast?.('Image téléchargée ✓', 'success') }
                else toast?.('Erreur lors du téléchargement', 'error')
              }} />
            </label>
          )}
        </div>
        {imageUrl && (
          <img src={imageUrl} alt="Aperçu"
            style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
        )}
      </div>

      {/* Private toggle */}
      <div
        onClick={() => setIsPrivate(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isPrivate ? 'rgba(139,34,118,.12)' : 'var(--bg3)', border: `1px solid ${isPrivate ? 'var(--purple)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14, cursor: 'pointer', transition: 'all .2s', userSelect: 'none' }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isPrivate ? 'var(--purple3)' : 'var(--text)' }}>🔒 Événement privé</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
            {isPrivate ? 'Visible uniquement par les personnes invitées' : 'Visible par tous les utilisateurs'}
          </div>
        </div>
        <div style={{ width: 44, height: 24, borderRadius: 99, background: isPrivate ? 'var(--purple)' : 'var(--bg2)', border: '1px solid var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 2, left: isPrivate ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 500 }}>Types de billets</p>
      {ticketTypes.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input style={{ ...inputStyle, flex: 2 }} placeholder="Nom (ex: Standard)" value={t.name} onChange={e => updateTicket(i, 'name', e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Prix FCFA" type="number" min="0" value={t.price} onChange={e => updateTicket(i, 'price', e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Qté" type="number" min="1" value={t.qty} onChange={e => updateTicket(i, 'qty', e.target.value)} />
          {ticketTypes.length > 1 && (
            <button onClick={() => removeTicketType(i)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--danger)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>✕</button>
          )}
        </div>
      ))}
      <button onClick={addTicketType} style={{ background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted)', borderRadius: 10, width: '100%', padding: '7px 0', cursor: 'pointer', fontSize: '0.82rem', marginBottom: 18 }}>
        + Ajouter un type de billet
      </button>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        {onCancel && (
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 10, padding: '10px 0', fontSize: '0.88rem', cursor: 'pointer' }}>
            Annuler
          </button>
        )}
        <button
          onClick={submit} disabled={loading}
          style={{ flex: 2, background: 'linear-gradient(135deg, var(--orange), var(--orange2))', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'En cours…' : submitLabel}
        </button>
      </div>
    </div>
  )
}
