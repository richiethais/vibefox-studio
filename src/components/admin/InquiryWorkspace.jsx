import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { BILLING_STATUS_COLORS, formatCurrency } from '../../lib/billing'
import useIsMobile from '../useIsMobile'

const STATUS_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  contacted: { bg: '#fef3c7', text: '#d97706' },
  converted: { bg: '#dcfce7', text: '#16a34a' },
}

const COACHING_STATUS_COLORS = {
  pending_payment: { bg: '#fef3c7', text: '#d97706' },
  paid: BILLING_STATUS_COLORS.paid,
  checkout_failed: { bg: '#fee2e2', text: '#dc2626' },
  new: { bg: '#eef0f3', text: '#52525b' },
}

const BRAND_ACCENT = '#b8906a'

function getFormKey(row) {
  return row?.form_key || 'contact'
}

function asText(value) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function formatStatusLabel(status) {
  if (!status) return ''
  return String(status).replace(/_/g, ' ')
}

function isCoachingRow(row) {
  return getFormKey(row) === 'coaching'
}

export default function InquiryWorkspace({ scope = 'contact' }) {
  const isCoachingScope = scope === 'coaching'
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(id, status) {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)
    if (error) {
      alert(`Could not update status: ${error.message}`)
      return
    }
    await load()
    setSelected(current => current?.id === id ? { ...current, status } : current)
  }

  async function handleDelete(id) {
    setDeleting(true)
    await supabase.from('inquiries').delete().eq('id', id)
    setConfirmDelete(null)
    setSelected(null)
    setDeleting(false)
    await load()
  }

  const filteredRows = useMemo(() => rows.filter(row => (
    isCoachingScope ? isCoachingRow(row) : !isCoachingRow(row)
  )), [isCoachingScope, rows])

  useEffect(() => {
    if (!selected) return
    const nextSelected = filteredRows.find(row => row.id === selected.id) || null
    if (!nextSelected) {
      setSelected(null)
      return
    }
    if (nextSelected !== selected) {
      setSelected(nextSelected)
    }
  }, [filteredRows, selected])

  const title = isCoachingScope ? 'Coaching' : 'Inquiries'
  const description = isCoachingScope
    ? 'Private coaching checkouts, payment states, and follow-up details.'
    : 'General website and contact-form leads that need follow-up.'
  const emptyText = isCoachingScope ? 'No coaching inquiries yet.' : 'No inquiries to show.'

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: 0, letterSpacing: '-0.4px' }}>{title}</h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: (selected && !isMobile) ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  {(isCoachingScope
                    ? ['Name', 'Email', 'Role', 'Experience', 'Payment', 'Date', '']
                    : ['Name', 'Email', 'Service', 'Budget', 'Status', 'Date', '']
                  ).map(header => (
                    <th
                      key={header}
                      style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => {
                  const isCoaching = isCoachingRow(row)
                  const meta = row.metadata || {}
                  const coachingStatusColor = isCoaching ? COACHING_STATUS_COLORS[row.status] : null
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      style={{
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        background: selected?.id === row.id ? '#f8f6f2' : 'white',
                        borderLeft: isCoaching ? `3px solid ${BRAND_ACCENT}` : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{row.name}</td>
                      <td style={{ padding: '12px 16px', color: '#7a7888' }}>{row.email}</td>
                      {isCoachingScope ? (
                        <>
                          <td style={{ padding: '12px 16px', color: '#7a7888' }}>{asText(meta.company_role) || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#7a7888' }}>{asText(meta.experience_level) || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ ...badge, background: coachingStatusColor?.bg || '#eef0f3', color: coachingStatusColor?.text || '#52525b' }}>
                              {formatStatusLabel(row.status) || '—'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 16px', color: '#7a7888' }}>{row.service_type}</td>
                          <td style={{ padding: '12px 16px', color: '#7a7888' }}>{row.budget}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ ...badge, background: STATUS_COLORS[row.status]?.bg || '#eef0f3', color: STATUS_COLORS[row.status]?.text || '#52525b' }}>
                              {row.status || '—'}
                            </span>
                          </td>
                        </>
                      )}
                      <td style={{ padding: '12px 16px', color: '#7a7888' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            setConfirmDelete(row)
                          }}
                          title="Delete inquiry"
                          style={deleteIconBtn}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={isCoachingScope ? 7 : 7}
                      style={{ padding: '32px 16px', textAlign: 'center', color: '#7a7888', fontSize: 13 }}
                    >
                      {emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && isMobile && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <DetailHeader selected={selected} onClose={() => setSelected(null)} />
              <DetailBody selected={selected} setStatus={setStatus} onDelete={() => setConfirmDelete(selected)} />
            </div>
          </div>
        )}

        {selected && !isMobile && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24 }}>
            <DetailHeader selected={selected} onClose={() => setSelected(null)} />
            <DetailBody selected={selected} setStatus={setStatus} onDelete={() => setConfirmDelete(selected)} />
          </div>
        )}
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#18181a', marginBottom: 8 }}>Delete inquiry?</div>
            <div style={{ fontSize: 13, color: '#7a7888', marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently delete the inquiry from <strong>{confirmDelete.name}</strong>. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={cancelBtnStyle}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={deleting} style={{ ...confirmBtnStyle, opacity: deleting ? 0.7 : 1 }}>
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
  const isCoaching = isCoachingRow(selected)

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
            {isCoaching ? 'Coaching' : 'Contact'}
          </span>
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  )
}

function DetailBody({ selected, setStatus, onDelete }) {
  const isCoaching = isCoachingRow(selected)
  const meta = selected.metadata || {}
  const phone = asText(meta.phone)
  const companyRole = asText(meta.company_role)
  const experienceLevel = asText(meta.experience_level)
  const reason = asText(meta.reason)
  const outcome = asText(meta.outcome)
  const coachingStatusColor = isCoaching ? COACHING_STATUS_COLORS[selected.status] : null
  const stripeUrl = selected.stripe_session_id
    ? `https://dashboard.stripe.com/checkout/sessions/${selected.stripe_session_id}`
    : null

  return (
    <>
      <Detail label="Email" value={selected.email} />
      {isCoaching && phone && <Detail label="Phone" value={phone} />}
      <Detail label="Company" value={selected.company || '—'} />
      {isCoaching && companyRole && <Detail label="Role" value={companyRole} />}
      <Detail label="Service" value={selected.service_type} />
      <Detail label="Budget" value={selected.budget} />
      {isCoaching && experienceLevel && <Detail label="Experience level" value={experienceLevel} />}
      <Detail label="Date" value={new Date(selected.created_at).toLocaleString()} />

      {isCoaching && reason && (
        <TextBlock label="Reason" value={reason} />
      )}
      {isCoaching && outcome && (
        <TextBlock label="Desired outcome" value={outcome} />
      )}
      {!isCoaching && selected.message && (
        <TextBlock label="Message" value={selected.message} />
      )}

      {isCoaching ? (
        <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: '#faf8f5', border: `1px solid ${BRAND_ACCENT}33` }}>
          <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Payment</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ ...badge, background: coachingStatusColor?.bg || '#eef0f3', color: coachingStatusColor?.text || '#52525b' }}>
              {formatStatusLabel(selected.status) || '—'}
            </span>
            {selected.amount_paid_cents != null && (
              <span style={{ fontSize: 13, color: '#18181a', fontWeight: 600 }}>
                {formatCurrency(Number(selected.amount_paid_cents) / 100)}
              </span>
            )}
          </div>
          {selected.paid_at && <Detail label="Paid at" value={new Date(selected.paid_at).toLocaleString()} />}
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['new', 'contacted', 'converted'].map(status => (
              <button
                key={status}
                onClick={() => setStatus(selected.id, status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: selected.status === status ? '#18181a' : 'white',
                  color: selected.status === status ? 'white' : '#18181a',
                }}
              >
                {status}
              </button>
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
      <div style={{ fontSize: 13, color: '#18181a' }}>{value || '—'}</div>
    </div>
  )
}

function TextBlock({ label, value }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{value}</div>
    </div>
  )
}

const badge = {
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 9px',
  borderRadius: 100,
  textTransform: 'capitalize',
  display: 'inline-block',
}

const deleteIconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#b0adb8',
  padding: 6,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.15s',
}

const deleteBtnStyle = {
  marginTop: 20,
  padding: '10px 20px',
  borderRadius: 100,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#dc2626',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
  transition: 'all 0.15s',
}

const cancelBtnStyle = {
  padding: '10px 20px',
  borderRadius: 100,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: '#18181a',
}

const confirmBtnStyle = {
  padding: '10px 20px',
  borderRadius: 100,
  border: 'none',
  background: '#dc2626',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: 'white',
}
