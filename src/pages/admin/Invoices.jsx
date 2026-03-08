import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = ['unpaid', 'paid', 'overdue']
const STATUS_COLORS = {
  unpaid: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ client_id: '', description: '', amount: '', status: 'unpaid', due_date: '' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false })
    setInvoices(data ?? [])
  }, [])

  useEffect(() => {
    supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false }).then(({ data }) => {
      setInvoices(data ?? [])
    })
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  function openCreate() {
    setForm({ client_id: '', description: '', amount: '', status: 'unpaid', due_date: '' })
    setModal('create')
  }

  function openEdit(inv) {
    setForm({ client_id: inv.client_id, description: inv.description, amount: String(inv.amount), status: inv.status, due_date: inv.due_date ?? '' })
    setModal(inv)
  }

  async function save() {
    const payload = { ...form, amount: parseFloat(form.amount), due_date: form.due_date || null }
    if (modal === 'create') await supabase.from('invoices').insert(payload)
    else await supabase.from('invoices').update(payload).eq('id', modal.id)
    setModal(null)
    await load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Invoices</h1>
        <button onClick={openCreate} style={darkBtn}>+ New invoice</button>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {['Client', 'Description', 'Amount', 'Status', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{inv.clients?.name ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{inv.description}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#18181a' }}>${Number(inv.amount).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: STATUS_COLORS[inv.status]?.bg, color: STATUS_COLORS[inv.status]?.text }}>{inv.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{inv.due_date ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(inv)} style={ghostBtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New invoice' : 'Edit invoice'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.client_id} onChange={set('client_id')} style={inp}>
                <option value="">Select client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Description *" value={form.description} onChange={set('description')} style={inp} />
              <input placeholder="Amount *" type="number" value={form.amount} onChange={set('amount')} style={inp} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div>
                <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Due date</label>
                <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
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
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
