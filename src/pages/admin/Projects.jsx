import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const STATUSES = ['proposal', 'active', 'complete']
const STATUS_COLORS = {
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ client_id: '', title: '', description: '', status: 'proposal', start_date: '', due_date: '' })
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false })
    setProjects(data ?? [])
  }, [])

  useEffect(() => {
    supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }).then(({ data }) => {
      setProjects(data ?? [])
    })
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  function openCreate() {
    setForm({ client_id: '', title: '', description: '', status: 'proposal', start_date: '', due_date: '' })
    setModal('create')
  }

  function openEdit(p) {
    setForm({ client_id: p.client_id, title: p.title, description: p.description ?? '', status: p.status, start_date: p.start_date ?? '', due_date: p.due_date ?? '' })
    setModal(p)
  }

  async function save() {
    const payload = { ...form, start_date: form.start_date || null, due_date: form.due_date || null }
    if (modal === 'create') await supabase.from('projects').insert(payload)
    else await supabase.from('projects').update(payload).eq('id', modal.id)
    setModal(null)
    await load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Projects</h1>
        <button onClick={openCreate} style={darkBtn}>+ New project</button>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {['Title', 'Client', 'Status', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{p.title}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{p.clients?.name ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: STATUS_COLORS[p.status]?.bg, color: STATUS_COLORS[p.status]?.text }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{p.due_date ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(p)} style={ghostBtn}>Edit</button>
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
              {modal === 'create' ? 'New project' : 'Edit project'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.client_id} onChange={set('client_id')} style={inp}>
                <option value="">Select client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Title *" value={form.title} onChange={set('title')} style={inp} />
              <textarea placeholder="Description" value={form.description} onChange={set('description')} rows={3} style={{ ...inp, resize: 'vertical' }} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Start date</label>
                  <input type="date" value={form.start_date} onChange={set('start_date')} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Due date</label>
                  <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
                </div>
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
