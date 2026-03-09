import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const STATUSES = ['unpaid', 'paid', 'overdue']
const STATUS_COLORS = {
  unpaid: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
}

const emptyForm = {
  client_id: '',
  description: '',
  amount: '',
  status: 'unpaid',
  due_date: '',
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    setNotice(null)

    const [invoicesRes, clientsRes] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
    ])

    if (invoicesRes.error || clientsRes.error) {
      setNotice({ type: 'error', text: invoicesRes.error?.message || clientsRes.error?.message || 'Failed to load invoices.' })
      setLoading(false)
      return
    }

    setInvoices(invoicesRes.data ?? [])
    setClients(clientsRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  function openCreate() {
    setForm(emptyForm)
    setModal('create')
  }

  function openEdit(invoice) {
    setForm({
      client_id: invoice.client_id,
      description: invoice.description,
      amount: String(invoice.amount),
      status: invoice.status,
      due_date: invoice.due_date ?? '',
    })
    setModal(invoice)
  }

  const validationError = useMemo(() => {
    if (!form.client_id) return 'Select a client.'
    if (!form.description.trim()) return 'Description is required.'

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be greater than 0.'

    return ''
  }, [form.amount, form.client_id, form.description])

  async function save() {
    if (saving || validationError) return

    setSaving(true)
    setNotice(null)

    const payload = {
      client_id: form.client_id,
      description: form.description.trim(),
      amount: Number(form.amount),
      status: form.status,
      due_date: form.due_date || null,
    }

    const result = modal === 'create'
      ? await supabase.from('invoices').insert(payload)
      : await supabase.from('invoices').update(payload).eq('id', modal.id)

    if (result.error) {
      setNotice({ type: 'error', text: result.error.message || 'Could not save invoice.' })
      setSaving(false)
      return
    }

    setNotice({ type: 'success', text: modal === 'create' ? 'Invoice created.' : 'Invoice updated.' })
    setModal(null)
    setSaving(false)
    await load()
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Invoices</h1>
        <button onClick={openCreate} style={darkBtn}>+ New invoice</button>
      </div>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          marginBottom: 16,
        }}>
          {notice.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Client', 'Description', 'Amount', 'Status', 'Due', 'Actions'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>Loading invoices…</td>
                </tr>
              )}

              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>No invoices yet.</td>
                </tr>
              )}

              {!loading && invoices.map(invoice => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{invoice.clients?.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{invoice.description}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#18181a' }}>${Number(invoice.amount).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: STATUS_COLORS[invoice.status]?.bg, color: STATUS_COLORS[invoice.status]?.text }}>{invoice.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{invoice.due_date ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => openEdit(invoice)} style={ghostBtn}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={{ background: 'white', borderRadius: 18, padding: isMobile ? 20 : 32, margin: isMobile ? 16 : 0, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New invoice' : 'Edit invoice'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.client_id} onChange={set('client_id')} style={inp}>
                <option value="">Select client *</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <input placeholder="Description *" value={form.description} onChange={set('description')} style={inp} />
              <input placeholder="Amount *" type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} style={inp} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
              <div>
                <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Due date</label>
                <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
              </div>

              {validationError && (
                <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 8, padding: '8px 10px', border: '1px solid #fecaca' }}>
                  {validationError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn} disabled={saving || Boolean(validationError)}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
