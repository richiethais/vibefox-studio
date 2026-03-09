import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../useIsMobile'

const NOTE_FILTERS = ['all', 'pinned', 'quick', 'strategy']
const DEFAULT_SECTION = { heading: '', body: '' }

function createEmptyForm(withRelationships) {
  return {
    type: 'quick',
    title: '',
    pinned: false,
    quickBody: '',
    sections: [{ ...DEFAULT_SECTION }],
    related_type: 'client',
    related_id: withRelationships ? '' : null,
  }
}

function normalizeSections(value, fallbackText = '') {
  if (Array.isArray(value)) {
    const clean = value
      .map(section => ({
        heading: typeof section?.heading === 'string' ? section.heading : '',
        body: typeof section?.body === 'string' ? section.body : '',
      }))
      .filter(section => section.heading.trim() || section.body.trim())

    return clean.length > 0 ? clean : [{ ...DEFAULT_SECTION }]
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return normalizeSections(parsed, fallbackText)
    } catch {
      // ignore malformed JSON and use fallback below
    }
  }

  if (fallbackText.trim()) {
    return [{ heading: 'Recovered content', body: fallbackText }]
  }

  return [{ ...DEFAULT_SECTION }]
}

function toQuickBody(content, body) {
  if (typeof content === 'string') return content
  if (typeof body === 'string') return body
  if (content == null) return ''

  try {
    return JSON.stringify(content, null, 2)
  } catch {
    return String(content)
  }
}

function normalizeNote(row) {
  const type = row?.type === 'strategy' ? 'strategy' : 'quick'
  const quickBody = type === 'quick' ? toQuickBody(row?.content, row?.body) : ''
  const sections =
    type === 'strategy'
      ? normalizeSections(row?.content, toQuickBody(row?.content, row?.body))
      : [{ ...DEFAULT_SECTION }]

  return {
    id: row.id,
    type,
    title: row?.title || '',
    pinned: Boolean(row?.pinned),
    quickBody,
    sections,
    related_type: row?.related_type || 'client',
    related_id: row?.related_id || '',
    created_at: row?.created_at || null,
  }
}

function getSnippet(note) {
  if (note.type === 'strategy') {
    const firstContent = note.sections.find(section => section.heading.trim() || section.body.trim())
    if (!firstContent) return 'No strategy content yet.'
    const merged = `${firstContent.heading} ${firstContent.body}`.trim()
    return merged.slice(0, 150)
  }

  const text = (note.quickBody || '').trim()
  return text ? text.slice(0, 150) : 'No content yet.'
}

function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || target.isContentEditable
}

export default function NotesWorkspace({
  tableName,
  pageTitle,
  createLabel,
  emptyLabel,
  withRelationships = false,
}) {
  const isMobile = useIsMobile(768)
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [relatedFilter, setRelatedFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [activeTab, setActiveTab] = useState('edit')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => createEmptyForm(withRelationships))

  const relationNameMap = useMemo(() => {
    const map = new Map()
    clients.forEach(client => map.set(`client:${client.id}`, client.name))
    projects.forEach(project => map.set(`project:${project.id}`, project.title))
    return map
  }, [clients, projects])

  const load = useCallback(async () => {
    setError('')

    try {
      const noteQuery = supabase
        .from(tableName)
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (!withRelationships) {
        const { data, error: notesError } = await noteQuery
        if (notesError) throw notesError
        setNotes((data ?? []).map(normalizeNote))
        return
      }

      const [notesRes, clientsRes, projectsRes] = await Promise.all([
        noteQuery,
        supabase.from('clients').select('id, name').order('name', { ascending: true }),
        supabase.from('projects').select('id, title').order('title', { ascending: true }),
      ])

      if (notesRes.error) throw notesRes.error
      if (clientsRes.error) throw clientsRes.error
      if (projectsRes.error) throw projectsRes.error

      setNotes((notesRes.data ?? []).map(normalizeNote))
      setClients(clientsRes.data ?? [])
      setProjects(projectsRes.data ?? [])
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load notes.')
    } finally {
      setLoading(false)
    }
  }, [tableName, withRelationships])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!notice) return undefined

    const timer = window.setTimeout(() => {
      setNotice('')
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [notice])

  const openNew = useCallback(() => {
    const initial = createEmptyForm(withRelationships)

    if (withRelationships) {
      initial.related_type = 'client'
      initial.related_id = clients[0]?.id || ''
    }

    setEditingNote(null)
    setForm(initial)
    setActiveTab('edit')
    setModalOpen(true)
  }, [clients, withRelationships])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key.toLowerCase() !== 'n') return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(document.activeElement)) return
      event.preventDefault()
      openNew()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openNew])

  function openEdit(note) {
    setEditingNote(note)
    setForm({
      type: note.type,
      title: note.title,
      pinned: note.pinned,
      quickBody: note.quickBody,
      sections: note.sections.length > 0 ? note.sections : [{ ...DEFAULT_SECTION }],
      related_type: note.related_type || 'client',
      related_id: note.related_id || '',
    })
    setActiveTab('edit')
    setModalOpen(true)
  }

  function updateSection(index, key, value) {
    setForm(current => {
      const sections = [...current.sections]
      sections[index] = { ...sections[index], [key]: value }
      return { ...current, sections }
    })
  }

  function moveSection(index, direction) {
    setForm(current => {
      const target = index + direction
      if (target < 0 || target >= current.sections.length) return current

      const sections = [...current.sections]
      const currentSection = sections[index]
      sections[index] = sections[target]
      sections[target] = currentSection
      return { ...current, sections }
    })
  }

  function removeSection(index) {
    setForm(current => {
      if (current.sections.length <= 1) return current
      return { ...current, sections: current.sections.filter((_, currentIndex) => currentIndex !== index) }
    })
  }

  function formErrorMessage() {
    const hasTitle = form.title.trim().length > 0

    if (withRelationships && !form.related_id) {
      return 'Select a client or project for this note.'
    }

    if (form.type === 'quick') {
      const hasBody = form.quickBody.trim().length > 0
      if (!hasTitle && !hasBody) return 'Add a title or quick note content.'
      return ''
    }

    if (!hasTitle) return 'Add a title for this strategy doc.'

    const hasSectionContent = form.sections.some(section => section.heading.trim() || section.body.trim())
    if (!hasSectionContent) return 'Add content to at least one strategy section.'

    return ''
  }

  const validationError = formErrorMessage()

  async function save() {
    if (saving || validationError) return

    const cleanSections = form.sections
      .map(section => ({ heading: section.heading.trim(), body: section.body.trim() }))
      .filter(section => section.heading || section.body)

    const payload = {
      type: form.type,
      title: form.title.trim(),
      pinned: form.pinned,
      content: form.type === 'strategy' ? cleanSections : form.quickBody.trim(),
    }

    if (withRelationships) {
      payload.related_type = form.related_type
      payload.related_id = form.related_id
      payload.body = form.type === 'quick' ? form.quickBody.trim() : ''
    }

    if (tableName === 'seo_notes') {
      payload.updated_at = new Date().toISOString()
    }

    setSaving(true)
    setError('')

    try {
      if (editingNote) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(payload)
          .eq('id', editingNote.id)

        if (updateError) throw updateError
        setNotice('Note updated.')
      } else {
        const { error: insertError } = await supabase.from(tableName).insert(payload)
        if (insertError) throw insertError
        setNotice('Note created.')
      }

      setModalOpen(false)
      setEditingNote(null)
      setForm(createEmptyForm(withRelationships))
      await load()
    } catch (saveError) {
      setError(saveError?.message || 'Could not save note.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePin(note) {
    setError('')
    const { error: pinError } = await supabase.from(tableName).update({ pinned: !note.pinned }).eq('id', note.id)
    if (pinError) {
      setError(pinError.message || 'Could not update pin state.')
      return
    }

    await load()
  }

  async function deleteNote(note) {
    const approved = window.confirm('Delete this note? This action cannot be undone.')
    if (!approved) return

    setError('')
    const { error: deleteError } = await supabase.from(tableName).delete().eq('id', note.id)
    if (deleteError) {
      setError(deleteError.message || 'Could not delete note.')
      return
    }

    setNotice('Note deleted.')

    if (editingNote?.id === note.id) {
      setModalOpen(false)
      setEditingNote(null)
    }

    await load()
  }

  const relatedOptions = form.related_type === 'project' ? projects : clients

  const filteredNotes = useMemo(() => {
    const textQuery = query.trim().toLowerCase()

    return notes.filter(note => {
      if (filter === 'pinned' && !note.pinned) return false
      if (filter === 'quick' && note.type !== 'quick') return false
      if (filter === 'strategy' && note.type !== 'strategy') return false

      if (withRelationships && relatedFilter !== 'all' && note.related_type !== relatedFilter) return false

      if (!textQuery) return true

      const haystack = `${note.title} ${getSnippet(note)}`.toLowerCase()
      return haystack.includes(textQuery)
    })
  }, [filter, notes, query, relatedFilter, withRelationships])

  const pinnedNotes = filteredNotes.filter(note => note.pinned)
  const standardNotes = filteredNotes.filter(note => !note.pinned)

  const metrics = useMemo(() => {
    const quick = notes.filter(note => note.type === 'quick').length
    const strategy = notes.filter(note => note.type === 'strategy').length

    return {
      total: notes.length,
      pinned: notes.filter(note => note.pinned).length,
      quick,
      strategy,
    }
  }, [notes])

  return (
    <div style={{ padding: isMobile ? '20px 16px 30px' : '34px 40px 46px' }}>
      <div className="anim-rise-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>{pageTitle}</h1>
        <button onClick={openNew} style={darkBtn}>{createLabel}</button>
      </div>

      <div className="anim-rise-2" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
        <MetricCard label="Total" value={metrics.total} color="#18181a" />
        <MetricCard label="Pinned" value={metrics.pinned} color="#b45309" />
        <MetricCard label="Quick" value={metrics.quick} color="#059669" />
        <MetricCard label="Strategy" value={metrics.strategy} color="#7c3aed" />
      </div>

      <div className="anim-rise-3" style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: isMobile ? 12 : 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {NOTE_FILTERS.map(filterName => (
            <button
              key={filterName}
              onClick={() => setFilter(filterName)}
              style={{
                ...ghostBtn,
                background: filter === filterName ? '#18181a' : 'white',
                color: filter === filterName ? 'white' : '#18181a',
                borderColor: filter === filterName ? '#18181a' : 'rgba(0,0,0,0.1)',
              }}
            >
              {filterName === 'all' ? 'All' : filterName === 'quick' ? 'Quick Notes' : filterName === 'strategy' ? 'Strategy Docs' : 'Pinned'}
            </button>
          ))}

          {withRelationships && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: isMobile ? 0 : 8 }}>
              {['all', 'client', 'project'].map(scope => (
                <button
                  key={scope}
                  onClick={() => setRelatedFilter(scope)}
                  style={{
                    ...softPill,
                    background: relatedFilter === scope ? '#f3ede5' : '#faf9f7',
                    borderColor: relatedFilter === scope ? '#dab58b' : 'rgba(0,0,0,0.08)',
                    color: relatedFilter === scope ? '#7a4920' : '#7a7888',
                  }}
                >
                  {scope === 'all' ? 'All Links' : scope === 'client' ? 'Clients' : 'Projects'}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search title or content"
          style={inp}
        />
      </div>

      {error && (
        <div style={errorBox}>
          <span>{error}</span>
          <button onClick={load} style={{ ...ghostBtn, padding: '5px 10px' }}>Retry</button>
        </div>
      )}

      {notice && <div style={noticeBox}>{notice}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} style={skeletonCard} />
          ))}
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <section style={{ marginBottom: 18 }}>
              <div style={sectionLabel}>Pinned</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    withRelationships={withRelationships}
                    relationLabel={relationNameMap.get(`${note.related_type}:${note.related_id}`) || ''}
                    onEdit={openEdit}
                    onPin={togglePin}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {standardNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  withRelationships={withRelationships}
                  relationLabel={relationNameMap.get(`${note.related_type}:${note.related_id}`) || ''}
                  onEdit={openEdit}
                  onPin={togglePin}
                  onDelete={deleteNote}
                />
              ))}
            </div>
            {filteredNotes.length === 0 && <div style={{ color: '#7a7888', fontSize: 13, marginTop: 8 }}>{emptyLabel}</div>}
          </section>
        </>
      )}

      {modalOpen && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 760, margin: isMobile ? 16 : 0, padding: isMobile ? 18 : 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#18181a', fontWeight: 600 }}>{editingNote ? 'Edit note' : 'New note'}</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {['edit', 'preview'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      ...softPill,
                      background: activeTab === tab ? '#18181a' : 'white',
                      color: activeTab === tab ? 'white' : '#7a7888',
                      borderColor: activeTab === tab ? '#18181a' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    {tab === 'edit' ? 'Editor' : 'Preview'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'edit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto', paddingRight: 2 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['quick', 'strategy'].map(type => (
                    <button
                      key={type}
                      onClick={() => setForm(current => ({ ...current, type }))}
                      style={{
                        ...ghostBtn,
                        flex: 1,
                        background: form.type === type ? '#18181a' : 'white',
                        color: form.type === type ? 'white' : '#18181a',
                        borderColor: form.type === type ? '#18181a' : 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {type === 'quick' ? 'Quick Note' : 'Strategy Doc'}
                    </button>
                  ))}
                </div>

                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
                  style={inp}
                />

                {withRelationships && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <select
                      value={form.related_type}
                      onChange={event => setForm(current => ({ ...current, related_type: event.target.value, related_id: '' }))}
                      style={inp}
                    >
                      <option value="client">Client</option>
                      <option value="project">Project</option>
                    </select>

                    <select
                      value={form.related_id}
                      onChange={event => setForm(current => ({ ...current, related_id: event.target.value }))}
                      style={inp}
                    >
                      <option value="">Select {form.related_type}</option>
                      {relatedOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name || option.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.type === 'quick' ? (
                  <textarea
                    placeholder="Type your note"
                    value={form.quickBody}
                    onChange={event => setForm(current => ({ ...current, quickBody: event.target.value }))}
                    rows={8}
                    style={{ ...inp, resize: 'vertical' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.sections.map((section, index) => (
                      <div key={index} style={{ background: '#f8f6f2', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section {index + 1}</span>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => moveSection(index, -1)} disabled={index === 0} style={miniBtn}>↑</button>
                            <button onClick={() => moveSection(index, 1)} disabled={index === form.sections.length - 1} style={miniBtn}>↓</button>
                            <button onClick={() => removeSection(index)} disabled={form.sections.length <= 1} style={miniBtn}>×</button>
                          </div>
                        </div>

                        <input
                          value={section.heading}
                          onChange={event => updateSection(index, 'heading', event.target.value)}
                          placeholder="Section heading"
                          style={{ ...inp, marginBottom: 8 }}
                        />

                        <textarea
                          value={section.body}
                          onChange={event => updateSection(index, 'body', event.target.value)}
                          placeholder="Section body"
                          rows={4}
                          style={{ ...inp, resize: 'vertical' }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => setForm(current => ({ ...current, sections: [...current.sections, { ...DEFAULT_SECTION }] }))}
                      style={ghostBtn}
                    >
                      + Add section
                    </button>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={event => setForm(current => ({ ...current, pinned: event.target.checked }))}
                  />
                  Pin this note
                </label>

                {validationError && (
                  <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '8px 10px' }}>
                    {validationError}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ maxHeight: '70vh', overflowY: 'auto', background: '#faf9f7', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', padding: 16 }}>
                <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                  {form.type === 'quick' ? 'Quick Note Preview' : 'Strategy Doc Preview'}
                </div>
                <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 28, lineHeight: 1.08, color: '#18181a', marginBottom: 12 }}>
                  {form.title.trim() || 'Untitled note'}
                </div>

                {form.type === 'quick' ? (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
                    {form.quickBody.trim() || 'No content added yet.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {form.sections
                      .filter(section => section.heading.trim() || section.body.trim())
                      .map((section, index) => (
                        <article key={index} style={{ background: 'white', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', padding: 12 }}>
                          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#18181a' }}>
                            {section.heading.trim() || `Section ${index + 1}`}
                          </h3>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                            {section.body.trim()}
                          </p>
                        </article>
                      ))}
                    {form.sections.every(section => !section.heading.trim() && !section.body.trim()) && (
                      <div style={{ fontSize: 13, color: '#7a7888' }}>No strategy sections added yet.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <div>
                {editingNote && (
                  <button onClick={() => deleteNote(editingNote)} style={{ ...ghostBtn, color: '#b91c1c', borderColor: '#fca5a5' }}>
                    Delete
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setModalOpen(false)
                    setEditingNote(null)
                  }}
                  style={ghostBtn}
                >
                  Cancel
                </button>
                <button onClick={save} disabled={saving || Boolean(validationError)} style={{ ...darkBtn, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7a7888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function NoteCard({ note, withRelationships, relationLabel, onEdit, onPin, onDelete }) {
  const badgeColor = note.type === 'strategy' ? '#7c3aed' : '#059669'
  const snippet = getSnippet(note)

  return (
    <article
      style={{
        background: 'white',
        borderRadius: 12,
        border: note.pinned ? '1px solid #f5d7a7' : '1px solid rgba(0,0,0,0.07)',
        padding: '14px 15px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.transform = 'translateY(-2px)'
        event.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={event => {
        event.currentTarget.style.transform = 'none'
        event.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <span style={{ ...chip, background: `${badgeColor}18`, color: badgeColor }}>
          {note.type === 'strategy' ? 'Strategy' : 'Quick'}
        </span>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <button onClick={() => onPin(note)} style={{ ...miniBtn, opacity: note.pinned ? 1 : 0.62 }} title={note.pinned ? 'Unpin' : 'Pin'}>
            {note.pinned ? 'Pinned' : 'Pin'}
          </button>
          <button onClick={() => onEdit(note)} style={miniBtn}>Edit</button>
          <button onClick={() => onDelete(note)} style={miniBtn}>×</button>
        </div>
      </div>

      <button onClick={() => onEdit(note)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, textAlign: 'left', cursor: 'pointer', width: '100%' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 6, lineHeight: 1.3 }}>
          {note.title.trim() || 'Untitled note'}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, minHeight: 36 }}>{snippet}</div>
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(note.created_at)}</span>
        {withRelationships && (
          <span style={{ ...chip, background: '#f5f3f0', color: '#6b7280' }}>
            {relationLabel || `${note.related_type} not linked`}
          </span>
        )}
      </div>
    </article>
  )
}

function formatDate(value) {
  if (!value) return 'No date'

  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return 'No date'
  }
}

const chip = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderRadius: 999,
  padding: '3px 8px',
}

const inp = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.1)',
  background: '#faf9f7',
  fontSize: 13,
  outline: 'none',
  color: '#18181a',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const darkBtn = {
  padding: '9px 18px',
  borderRadius: 100,
  border: 'none',
  background: '#18181a',
  color: 'white',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}

const ghostBtn = {
  padding: '8px 14px',
  borderRadius: 100,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  color: '#18181a',
  fontSize: 12,
  cursor: 'pointer',
}

const softPill = {
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  color: '#7a7888',
  fontSize: 11,
  cursor: 'pointer',
}

const miniBtn = {
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  color: '#6b7280',
  borderRadius: 8,
  height: 24,
  minWidth: 24,
  padding: '0 6px',
  fontSize: 12,
  cursor: 'pointer',
}

const sectionLabel = {
  fontSize: 11,
  color: '#b45309',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: 9,
}

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 10,
  color: '#b91c1c',
  fontSize: 12,
  padding: '9px 12px',
  marginBottom: 12,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
}

const noticeBox = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 10,
  color: '#166534',
  fontSize: 12,
  padding: '9px 12px',
  marginBottom: 12,
}

const skeletonCard = {
  background: 'linear-gradient(110deg, #fbfaf8 30%, #f2eee9 42%, #fbfaf8 56%)',
  backgroundSize: '200% 100%',
  animation: 'rise 0.7s ease',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.05)',
  height: 138,
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 120,
}

const modalBox = {
  width: '100%',
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
}
