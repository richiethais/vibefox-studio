import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminNotes() {
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ related_type: 'client', related_id: '', body: '' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    setNotes(data ?? [])
  }, [])

  useEffect(() => {
    supabase.from('notes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setNotes(data ?? [])
    })
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
    supabase.from('projects').select('id, title').then(({ data }) => setProjects(data ?? []))
  }, [])

  async function save() {
    await supabase.from('notes').insert(form)
    setModal(false)
    setForm({ related_type: 'client', related_id: '', body: '' })
    await load()
  }

  async function del(id) {
    await supabase.from('notes').delete().eq('id', id)
    await load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const relatedOptions = form.related_type === 'client' ? clients : projects

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Notes</h1>
        <button onClick={() => setModal(true)} style={darkBtn}>+ New note</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notes.map(n => (
          <div key={n.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {n.related_type} · {new Date(n.created_at).toLocaleDateString()}
              </span>
              <button onClick={() => del(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>New note</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.related_type} onChange={e => setForm(f => ({ ...f, related_type: e.target.value, related_id: '' }))} style={inp}>
                <option value="client">Client</option>
                <option value="project">Project</option>
              </select>
              <select value={form.related_id} onChange={set('related_id')} style={inp}>
                <option value="">Select {form.related_type} *</option>
                {relatedOptions.map(o => <option key={o.id} value={o.id}>{o.name || o.title}</option>)}
              </select>
              <textarea placeholder="Note *" value={form.body} onChange={set('body')} rows={5} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
