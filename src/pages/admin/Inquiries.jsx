import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/billing'
import useIsMobile from '../../components/useIsMobile'

const STATUS_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  contacted: { bg: '#fef3c7', text: '#d97706' },
  converted: { bg: '#dcfce7', text: '#16a34a' },
}

const COACHING_STATUS_COLORS = {
  pending_payment: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  checkout_failed: { bg: '#fee2e2', text: '#dc2626' },
  new: { bg: '#eef0f3', text: '#52525b' },
}

const FORM_KEY_LABELS = {
  contact: 'Contact',
  coaching: 'Coaching',
}

const BRAND_ACCENT = '#b8906a'

function getFormKey(row) {
  return row?.form_key || 'contact'
}

function formatCoachingStatus(status) {
  if (!status) return ''
  return String(status).replace(/_/g, ' ')
}

export default function AdminInquiries() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [formKeyFilter, setFormKeyFilter] = useState('all')
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function setStatus(id, status) {
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await load()
    setSelected(s => s?.id === id ? { ...s, status } : s)
  }

  async function handleDelete(id) {
    setDeleting(true)
    await supabase.from('inquiries').delete().eq('id', id)
    setConfirmDelete(null)
    setSelected(null)
    setDeleting(false)
    await load()
  }

  const availableFormKeys = useMemo(() => {
    const set = new Set(['contact', 'coaching'])
    rows.forEach(r => {
      const fk = getFormKey(r)
      if (fk) set.add(fk)
    })
    return Array.from(set)
  }, [rows])

  const filteredRows = useMemo(() => {
    if (formKeyFilter === 'all') return rows
    return rows.filter(r => getFormKey(r) === formKeyFilter)
  }, [rows, formKeyFilter])

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 16, letterSpacing: '-0.4px' }}>Inquiries</h1>

      {/* Form key filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['all', ...availableFormKeys].map(key => {
          const isActive = formKeyFilter === key
          const label = key === 'all' ? 'All' : (FORM_KEY_LABELS[key] || key)
          const isCoaching = key === 'coaching'
          return (
            <button
              key={key}
              onClick={() => setFormKeyFilter(key)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: isActive ? '1px solid transparent' : '1px solid rgba(0,0,0,0.1)',
                background: isActive ? (isCoaching ? BRAND_ACCENT : '#18181a') : 'white',
                color: isActive ? 'white' : '#18181a',
                textTransform: 'capitalize',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Type', 'Name', 'Email', 'Service', 'Budget', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(r => {
                const formKey = getFormKey(r)
                const isCoaching = formKey === 'coaching'
                const coachingStatusColor = isCoaching ? COACHING_STATUS_COLORS[r.status] : null
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      background: selected?.id === r.id ? '#f8f6f2' : 'white',
                      borderLeft: isCoaching ? `3px solid ${BRAND_ACCENT}` : '3px solid transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        ...badge,
                        background: isCoaching ? 'rgba(184,144,106,0.12)' : '#eef0f3',
                        color: isCoaching ? BRAND_ACCENT : '#52525b',
                      }}>
                        {FORM_KEY_LABELS[formKey] || formKey}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{r.name}</td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.email}</td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.service_type}</td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.budget}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isCoaching ? (
                        <span style={{ ...badge, background: coachingStatusColor?.bg || '#eef0f3', color: coachingStatusColor?.text || '#52525b' }}>
                          {formatCoachingStatus(r.status) || '—'}
                        </span>
                      ) : (
                        <span style={{ ...badge, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.text }}>{r.status}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7a7888' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(r) }}
                        title="Delete inquiry"
                        style={deleteIconBtn}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: '#7a7888', fontSize: 13 }}>
                    No inquiries to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Mobile detail drawer */}
        {selected && isMobile && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <DetailHeader selected={selected} onClose={() => setSelected(null)} />
              <DetailBody selected={selected} setStatus={setStatus} onDelete={() => setConfirmDelete(selected)} />
            </div>
          </div>
        )}

        {/* Desktop detail panel */}
        {selected && !isMobile && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24 }}>
            <DetailHeader selected={selected} onClose={() => setSelected(null)} />
            <DetailBody selected={selected} setStatus={setStatus} onDelete={() => setConfirmDelete(selected)} />
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a', marginBottom: 8 }}>Delete inquiry?</div>
            <div style={{ fontSize: 13, color: '#7a7888', marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently delete the inquiry from <strong>{confirmDelete.name}</strong>. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{ padding: '10px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#18181a' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={deleting} style={{ padding: '10px 20px', borderRadius: 100, border: 'none', background: '#dc2626', fontSize: 13, fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer', color: 'white', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailHeader({ selected, onClose }) {
  const formKey = getFormKey(selected)
  const isCoaching = formKey === 'coaching'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#18181a' }}>{selected.name}</div>
        <div style={{ marginTop: 6 }}>
          <span style={{
            ...badge,
            background: isCoaching ? 'rgba(184,144,106,0.12)' : '#eef0f3',
            color: isCoaching ? BRAND_ACCENT : '#52525b',
          }}>
            {FORM_KEY_LABELS[formKey] || formKey}
          </span>
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  )
}

function DetailBody({ selected, setStatus, onDelete }) {
  const formKey = getFormKey(selected)
  const isCoaching = formKey === 'coaching'
  const meta = selected.metadata || {}
  const coachingStatusColor = isCoaching ? COACHING_STATUS_COLORS[selected.status] : null
  const stripeUrl = selected.stripe_session_id
    ? `https://dashboard.stripe.com/checkout/sessions/${selected.stripe_session_id}`
    : null

  return (
    <>
      <Detail label="Email" value={selected.email} />
      {isCoaching && meta.phone && <Detail label="Phone" value={meta.phone} />}
      <Detail label="Company" value={selected.company || '—'} />
      {isCoaching && meta.company_role && <Detail label="Role" value={meta.company_role} />}
      <Detail label="Service" value={selected.service_type} />
      <Detail label="Budget" value={selected.budget} />
      {isCoaching && meta.experience_level && <Detail label="Experience level" value={meta.experience_level} />}
      <Detail label="Date" value={new Date(selected.created_at).toLocaleString()} />

      {isCoaching && (
        <>
          {meta.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Reason</div>
              <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{meta.reason}</div>
            </div>
          )}
          {meta.outcome && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Desired outcome</div>
              <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{meta.outcome}</div>
            </div>
          )}
        </>
      )}

      {selected.message && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Message</div>
          <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{selected.message}</div>
        </div>
      )}

      {isCoaching ? (
        <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: '#faf8f5', border: `1px solid ${BRAND_ACCENT}33` }}>
          <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Payment</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ ...badge, background: coachingStatusColor?.bg || '#eef0f3', color: coachingStatusColor?.text || '#52525b' }}>
              {formatCoachingStatus(selected.status) || '—'}
            </span>
            {selected.amount_paid_cents != null && (
              <span style={{ fontSize: 13, color: '#18181a', fontWeight: 600 }}>
                {formatCurrency(Number(selected.amount_paid_cents) / 100)}
              </span>
            )}
          </div>
          {selected.paid_at && (
            <Detail label="Paid at" value={new Date(selected.paid_at).toLocaleString()} />
          )}
          {stripeUrl && (
            <a
              href={stripeUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: BRAND_ACCENT, textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              View Stripe session →
            </a>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['new', 'contacted', 'converted'].map(s => (
              <button key={s} onClick={() => setStatus(selected.id, s)} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                background: selected.status === s ? '#18181a' : 'white',
                color: selected.status === s ? 'white' : '#18181a',
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <button onClick={onDelete} style={deleteBtnStyle}>Delete inquiry</button>
    </>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#18181a' }}>{value}</div>
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize', display: 'inline-block' }

const deleteIconBtn = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#b0adb8', padding: 6, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s',
}

const deleteBtnStyle = {
  marginTop: 20, padding: '10px 20px', borderRadius: 100, border: '1px solid #fecaca',
  background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  width: '100%', transition: 'all 0.15s',
}
