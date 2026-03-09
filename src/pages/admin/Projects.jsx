import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const STATUSES = ['proposal', 'active', 'complete']
const STATUS_COLORS = {
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
}

const emptyForm = {
  client_id: '',
  title: '',
  description: '',
  status: 'proposal',
  start_date: '',
  due_date: '',
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    setNotice(null)

    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
    ])

    if (projectsRes.error || clientsRes.error) {
      setNotice({ type: 'error', text: projectsRes.error?.message || clientsRes.error?.message || 'Failed to load projects.' })
      setLoading(false)
      return
    }

    setProjects(projectsRes.data ?? [])
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

  function openEdit(project) {
    setForm({
      client_id: project.client_id,
      title: project.title,
      description: project.description ?? '',
      status: project.status,
      start_date: project.start_date ?? '',
      due_date: project.due_date ?? '',
    })
    setModal(project)
  }

  const validationError = useMemo(() => {
    if (!form.client_id) return 'Select a client.'
    if (!form.title.trim()) return 'Project title is required.'
    if (form.start_date && form.due_date && form.due_date < form.start_date) {
      return 'Due date cannot be earlier than start date.'
    }
    return ''
  }, [form.client_id, form.due_date, form.start_date, form.title])

  async function save() {
    if (saving || validationError) return

    setSaving(true)
    setNotice(null)

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    }

    const result = modal === 'create'
      ? await supabase.from('projects').insert(payload)
      : await supabase.from('projects').update(payload).eq('id', modal.id)

    if (result.error) {
      setNotice({ type: 'error', text: result.error.message || 'Could not save project.' })
      setSaving(false)
      return
    }

    setNotice({ type: 'success', text: modal === 'create' ? 'Project created.' : 'Project updated.' })
    setModal(null)
    setSaving(false)
    await load()
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Projects</h1>
        <button onClick={openCreate} style={darkBtn}>+ New project</button>
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
                {['Title', 'Client', 'Status', 'Due', 'Actions'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>Loading projects…</td>
                </tr>
              )}

              {!loading && projects.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', color: '#7a7888', fontSize: 13 }}>No projects yet.</td>
                </tr>
              )}

              {!loading && projects.map(project => (
                <tr key={project.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{project.title}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{project.clients?.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: STATUS_COLORS[project.status]?.bg, color: STATUS_COLORS[project.status]?.text }}>{project.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{project.due_date ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => openEdit(project)} style={ghostBtn}>Edit</button>
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
                {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <input placeholder="Title *" value={form.title} onChange={set('title')} style={inp} />
              <textarea placeholder="Description" value={form.description} onChange={set('description')} rows={3} style={{ ...inp, resize: 'vertical' }} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(status => <option key={status}>{status}</option>)}
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
