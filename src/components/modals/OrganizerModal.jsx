import { useState } from 'react'
import { Modal, ModalHeader, ModalBody } from '../Modal.jsx'
import { OverviewTab } from './organizer/OverviewTab.jsx'
import { AnalyticsTab } from './organizer/AnalyticsTab.jsx'
import { EventForm } from './organizer/EventForm.jsx'
import { MyEventsTab } from './organizer/MyEventsTab.jsx'
import { AttendeesTab } from './organizer/AttendeesTab.jsx'
import { InvitationsTab } from './organizer/InvitationsTab.jsx'
import { AdminTab } from './organizer/AdminTab.jsx'

const BASE_TABS = [
  { id: 'overview',     label: "Vue d'ensemble" },
  { id: 'analytics',   label: '📈 Analytique' },
  { id: 'events',      label: 'Mes Événements' },
  { id: 'create',      label: 'Créer' },
  { id: 'attendees',   label: 'Participants' },
  { id: 'invitations', label: '🔒 Invitations' },
]
const ADMIN_TAB = { id: 'admin', label: '🔑 Admin' }

// ── Main Modal ────────────────────────────────────────────────
// Each tab above owns its own state/data-loading and lives in its own file
// under ./organizer/ — this file is just the shell (header, tab bar) and
// the routing between them, matching exactly what the single-file version
// did inline.
export function OrganizerModal({
  open, user, isAdmin, myEvents, purchases, organizerOrders, organizerStats,
  applications,
  onClose, onCreate, onUpdate, onDelete, onCheckin, onCheckinByRef, onCheckinPartial, onLookupByRef, onRefund, onRefresh,
  onPromote, onReject, onLoadApplications, onUploadImage,
  onInvite, onLoadInvitations,
  onLoadVerifRequests, onApproveVerif, onDenyVerif,
  onRequestCity, onLoadCityRequests, onApproveCityRequest, onDenyCityRequest,
  onLoadPendingEvents, onApproveEvent, onRejectEvent,
  cities,
  loading = {}, errors = {},
  toast,
}) {
  const [tab, setTab] = useState('overview')
  const [editingEvent, setEditingEvent] = useState(null)

  if (!user) return null

  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS
  const attendeeOrders = organizerOrders || purchases || []

  const handleEdit = (event) => {
    setEditingEvent(event)
    setTab('events')
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="📊 Espace Organisateur"
        subtitle={`Bonjour, ${user.name.split(' ')[0]} !`}
      />
      <ModalBody>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 12, padding: 4, marginBottom: 22, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id !== 'events') setEditingEvent(null) }}
              style={{ flex: 1, minWidth: 70, padding: '8px 10px', borderRadius: 8, border: 'none', background: tab === t.id ? 'var(--bg2)' : 'transparent', color: tab === t.id ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', fontSize: '0.78rem', transition: 'all .2s', boxShadow: tab === t.id ? '0 1px 5px rgba(36,18,46,.12)' : 'none', whiteSpace: 'nowrap' }}
            >
              {t.label}
              {t.id === 'admin' && applications?.length > 0 && (
                <span style={{ marginLeft: 5, background: 'var(--orange)', color: '#fff', borderRadius: 99, padding: '0 6px', fontSize: '0.7rem', fontWeight: 700 }}>{applications.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab organizerStats={organizerStats} loading={loading} errors={errors} onRefresh={onRefresh} />}

        {tab === 'analytics' && <AnalyticsTab organizerStats={organizerStats} myEvents={myEvents} loading={loading} errors={errors} onRefresh={onRefresh} />}

        {tab === 'events' && !editingEvent && (
          <MyEventsTab myEvents={myEvents} onDelete={onDelete} onEdit={handleEdit} loading={loading} errors={errors} />
        )}

        {tab === 'events' && editingEvent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <button onClick={() => setEditingEvent(null)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>← Retour</button>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Modifier : {editingEvent.title}</span>
            </div>
            <EventForm
              initial={editingEvent}
              onUploadImage={onUploadImage}
              onRequestCity={onRequestCity}
              cities={cities}
              submitLabel="💾 Sauvegarder les modifications"
              onSubmit={async (data) => {
                const ok = await onUpdate(editingEvent.id, data)
                if (ok) { setEditingEvent(null); toast?.('Événement mis à jour ✓', 'success') }
                else toast?.("Impossible de mettre à jour l'événement", 'error')
              }}
              onCancel={() => setEditingEvent(null)}
              toast={toast}
            />
          </div>
        )}

        {tab === 'create' && (
          <EventForm
            onUploadImage={onUploadImage}
            onRequestCity={onRequestCity}
            cities={cities}
            submitLabel="🚀 Publier l'événement"
            onSubmit={async (data) => {
              const created = await onCreate(data)
              if (created) toast?.('Événement publié ! 🎉', 'success')
              else toast?.("Impossible de publier l'événement", 'error')
            }}
            toast={toast}
          />
        )}

        {tab === 'attendees' && (
          <AttendeesTab
            myEvents={myEvents}
            organizerOrders={attendeeOrders}
            onCheckin={onCheckin}
            onCheckinByRef={onCheckinByRef}
            onCheckinPartial={onCheckinPartial}
            onLookupByRef={onLookupByRef}
            onRefund={onRefund}
            loading={loading} errors={errors}
            onRefresh={onRefresh}
          />
        )}

        {tab === 'invitations' && (
          <InvitationsTab
            myEvents={myEvents}
            onInvite={onInvite}
            onLoadInvitations={onLoadInvitations}
            toast={toast}
          />
        )}

        {tab === 'admin' && isAdmin && (
          <AdminTab
            applications={applications || []}
            onPromote={onPromote}
            onReject={onReject}
            onRefresh={onLoadApplications}
            onLoadVerifRequests={onLoadVerifRequests}
            onApproveVerif={onApproveVerif}
            onDenyVerif={onDenyVerif}
            onLoadCityRequests={onLoadCityRequests}
            onApproveCityRequest={onApproveCityRequest}
            onDenyCityRequest={onDenyCityRequest}
            onLoadPendingEvents={onLoadPendingEvents}
            onApproveEvent={onApproveEvent}
            onRejectEvent={onRejectEvent}
          />
        )}
      </ModalBody>
    </Modal>
  )
}
