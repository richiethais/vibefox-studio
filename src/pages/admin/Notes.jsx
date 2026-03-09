import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const emptyForm = {
  related_type: 'client',
  related_id: '',
  type: 'quick',
  title: '',
  pinned: false,
  content: '',
  sections: [{ heading: '', body: '' }],
}

export default function AdminNotes() {
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })
    setNotes(data ?? [])
  }, [])

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
    supabase.from('projects').select('id, title').then(({ data }) => setProjects(data ?? []))
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setModal(true)
  }

  function openEdit(note) {
    setEditing(note)
    const isStrategy = note.type === 'strategy'
    setForm({
      related_type: note.related_type || 'client',
      related_id: note.related_id || '',
      type: note.type || 'quick',
      title: note.title || '',
      pinned: note.pinned || false,
      content: isStrategy ? '' : (typeof note.content === 'string' ? note.content : note.body || ''),
      sections: isStrategy
        ? (Array.isArray(note.content) ? note.content : [{ heading: '', body: '' }])
        : [{ heading: '', body: '' }],
    })
    setModal(true)
  }

  async function save() {
    const isStrategy = form.type === 'strategy'
    const content = isStrategy ? form.sections : form.content
    const payload = {
      related_type: form.related_type,
      related_id: form.related_id || null,
      type: form.type,
      title: form.title,
      pinned: form.pinned,
      content,
      body: isStrategy ? '' : form.content,
    }
    if (editing) {
      await supabase.from('notes').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('notes').insert(payload)
    }
    setModal(false)
    setForm(emptyForm)
    setEditing(null)
    await load()
  }

  async function togglePin(note) {
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    await load()
  }

  async function del(id) {
    await supabase.from('notes').delete().eq('id', id)
    await load()
  }

  function updateSection(idx, key, val) {
    setForm(f => {
      const sections = [...f.sections]
      sections[idx] = { ...sections[idx], [key]: val }
      return { ...f, sections }
    })
  }

  const relatedOptions = form.related_type === 'client' ? clients : projects

  const filtered = notes.filter(n => {
    if (filter === 'pinned') return n.pinned
    if (filter === 'quick') return n.type === 'quick' || !n.type
    if (filter === 'strategy') return n.type === 'strategy'
    return true
  })

  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  function getSnippet(note) {
    if (note.type === 'strategy' && Array.isArray(note.content)) {
      return note.content[0]?.body?.slice(0, 100) || note.title
    }
    if (typeof note.content === 'string') return note.content.slice(0, 120)
    return note.body?.slice(0, 120) || ''
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Client Notes</h1>
        <button onClick={openNew} style={darkBtn}>+ New note</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pinned', 'quick', 'strategy'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...ghostBtn,
            background: filter === f ? '#18181a' : 'white',
            color: filter === f ? 'white' : '#18181a',
          }}>
            {f === 'all' ? 'All' : f === 'quick' ? 'Quick Notes' : f === 'strategy' ? 'Strategy Docs' : 'Pinned'}
          </button>
        ))}
      </div>

      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Pinned</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pinned.map(n => <NoteCard key={n.id} note={n} onPin={togglePin} onEdit={openEdit} onDelete={del} snippet={getSnippet(n)} />)}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {unpinned.map(n => <NoteCard key={n.id} note={n} onPin={togglePin} onEdit={openEdit} onDelete={del} snippet={getSnippet(n)} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ color: '#7a7888', fontSize: 13, marginTop: 20 }}>No notes yet.</div>
      )}

      {modal && (
        <div style={overlay}>
          <div style={{ ...modalBox, padding: isMobile ? 20 : 32, margin: isMobile ? 16 : 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {editing ? 'Edit note' : 'New note'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['quick', 'strategy'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...ghostBtn, flex: 1, background: form.type === t ? '#18181a' : 'white', color: form.type === t ? 'white' : '#18181a' }}>
                    {t === 'quick' ? 'Quick Note' : 'Strategy Doc'}
                  </button>
                ))}
              </div>

              <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} />

              <select value={form.related_type} onChange={e => setForm(f => ({ ...f, related_type: e.target.value, related_id: '' }))} style={inp}>
                <option value="client">Client</option>
                <option value="project">Project</option>
              </select>
              <select value={form.related_id} onChange={e => setForm(f => ({ ...f, related_id: e.target.value }))} style={inp}>
                <option value="">Select {form.related_type}</option>
                {relatedOptions.map(o => <option key={o.id} value={o.id}>{o.name || o.title}</option>)}
              </select>

              {form.type === 'quick' && (
                <textarea placeholder="Note *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} style={{ ...inp, resize: 'vertical' }} />
              )}

              {form.type === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {form.sections.map((s, idx) => (
                    <div key={idx} style={{ background: '#f5f3f0', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section {idx + 1}</span>
                        {form.sections.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }))}
                            style={{ background: 'none', border: 'none', color: '#7a7888', cursor: 'pointer', fontSize: 14 }}>×</button>
                        )}
                      </div>
                      <input placeholder="Heading" value={s.heading} onChange={e => updateSection(idx, 'heading', e.target.value)} style={{ ...inp, marginBottom: 8 }} />
                      <textarea placeholder="Body" value={s.body} onChange={e => updateSection(idx, 'body', e.target.value)} rows={4} style={{ ...inp, resize: 'vertical' }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm(f => ({ ...f, sections: [...f.sections, { heading: '', body: '' }] }))} style={ghostBtn}>+ Add section</button>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                Pin this note
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(false); setEditing(null) }} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onPin, onEdit, onDelete, snippet }) {
  const typeBadgeColor = note.type === 'strategy' ? '#7c3aed' : '#059669'
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: note.pinned ? '1px solid #fde68a' : '1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: typeBadgeColor, textTransform: 'uppercase', letterSpacing: '0.5px', background: typeBadgeColor + '18', padding: '2px 7px', borderRadius: 100 }}>
          {note.type === 'strategy' ? 'Strategy' : 'Quick'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => onPin(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: note.pinned ? 1 : 0.3 }} title={note.pinned ? 'Unpin' : 'Pin'}>📌</button>
          <button onClick={() => onEdit(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 12 }}>Edit</button>
          <button onClick={() => onDelete(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      </div>
      {note.title && <div style={{ fontWeight: 600, fontSize: 13, color: '#18181a', marginBottom: 4 }}>{note.title}</div>}
      <div style={{ fontSize: 12, color: '#7a7888', lineHeight: 1.5 }}>{snippet}</div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#b0adb8' }}>{note.related_type} · {new Date(note.created_at).toLocaleDateString()}</div>
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
