import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const EVENT_COLORS = {
  seo: { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  blog: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  project: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  general: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const emptyForm = { title: '', type: 'general', event_date: '', event_time: '', notes: '', blog_post_id: '' }

export default function AdminCalendar() {
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(new Date())
  const [events, setEvents] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [blogPosts, setBlogPosts] = useState([])
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase.from('calendar_events').select('*').order('event_date').order('event_time')
    setEvents(data ?? [])
  }, [])

  useEffect(() => {
    load()
    supabase.from('blog_posts').select('id, title').eq('status', 'scheduled').then(({ data }) => setBlogPosts(data ?? []))
  }, [load])

  function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function openNew(dateStr) {
    setEditing(null)
    setForm({ ...emptyForm, event_date: dateStr || toDateStr(cursor) })
    setModal(true)
  }

  function openEdit(ev) {
    setEditing(ev)
    setForm({ title: ev.title, type: ev.type, event_date: ev.event_date, event_time: ev.event_time || '', notes: ev.notes || '', blog_post_id: ev.blog_post_id || '' })
    setModal(true)
  }

  async function save() {
    const payload = {
      title: form.title,
      type: form.type,
      event_date: form.event_date,
      event_time: form.event_time || null,
      notes: form.notes || null,
      blog_post_id: form.blog_post_id || null,
    }
    if (editing) {
      await supabase.from('calendar_events').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('calendar_events').insert(payload)
    }
    setModal(false); setEditing(null); setForm(emptyForm); await load()
  }

  async function del(id) {
    await supabase.from('calendar_events').delete().eq('id', id)
    setModal(false); await load()
  }

  function eventsOn(dateStr) {
    return events.filter(e => e.event_date === dateStr)
  }

  function getMonthGrid() {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const cells = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
    return cells
  }

  function getWeekDays() {
    const start = new Date(cursor)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i); return d
    })
  }

  const hours = Array.from({ length: 17 }, (_, i) => i + 7)

  function navigate(dir) {
    const d = new Date(cursor)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCursor(d)
  }

  function viewTitle() {
    if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    if (view === 'week') {
      const days = getWeekDays()
      return `${MONTHS[days[0].getMonth()]} ${days[0].getDate()} – ${days[6].getDate()}, ${days[6].getFullYear()}`
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`
  }

  const todayStr = toDateStr(new Date())

  return (
    <div style={{ padding: isMobile ? '16px' : '36px 40px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px', margin: 0 }}>Calendar</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f5f3f0', borderRadius: 100, padding: 3 }}>
            {['month', 'week', 'day'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: view === v ? 600 : 400,
                background: view === v ? '#18181a' : 'transparent',
                color: view === v ? 'white' : '#7a7888',
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#18181a', minWidth: 180, textAlign: 'center' }}>{viewTitle()}</span>
          <button onClick={() => navigate(1)} style={navBtn}>›</button>
          <button onClick={() => openNew('')} style={darkBtn}>+ Event</button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, color: '#7a7888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {getMonthGrid().map((day, idx) => {
              const ds = day ? toDateStr(day) : null
              const dayEvents = ds ? eventsOn(ds) : []
              const isToday = ds === todayStr
              return (
                <div key={idx}
                  onClick={() => day && openNew(ds)}
                  style={{ minHeight: isMobile ? 60 : 90, padding: '8px 6px', borderRight: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: day ? 'pointer' : 'default', background: day ? 'white' : '#faf9f7' }}
                >
                  {day && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'white' : '#18181a', background: isToday ? '#18181a' : 'transparent', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        {day.getDate()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayEvents.slice(0, isMobile ? 1 : 3).map(ev => {
                          const c = EVENT_COLORS[ev.type] || EVENT_COLORS.general
                          return (
                            <div key={ev.id}
                              onClick={e => { e.stopPropagation(); openEdit(ev) }}
                              style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: c.bg, color: c.text, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                              {ev.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > (isMobile ? 1 : 3) && (
                          <div style={{ fontSize: 10, color: '#7a7888' }}>+{dayEvents.length - (isMobile ? 1 : 3)} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div />
            {getWeekDays().map((day, i) => {
              const ds = toDateStr(day)
              const isToday = ds === todayStr
              return (
                <div key={i} style={{ padding: '10px 4px', textAlign: 'center', background: isToday ? '#f8f6f2' : 'transparent' }}>
                  <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{DAYS[day.getDay()]}</div>
                  <div style={{ fontSize: 18, fontWeight: isToday ? 700 : 400, color: '#18181a' }}>{day.getDate()}</div>
                </div>
              )
            })}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 520 }}>
            {hours.map(h => (
              <div key={h} style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 48 }}>
                <div style={{ fontSize: 11, color: '#b0adb8', padding: '4px 6px', textAlign: 'right' }}>{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</div>
                {getWeekDays().map((day, i) => {
                  const ds = toDateStr(day)
                  const slotEvents = eventsOn(ds).filter(e => e.event_time && e.event_time.startsWith(String(h).padStart(2,'0')))
                  return (
                    <div key={i} onClick={() => openNew(ds)} style={{ borderLeft: '1px solid rgba(0,0,0,0.04)', padding: '2px 4px', cursor: 'pointer' }}>
                      {slotEvents.map(ev => {
                        const c = EVENT_COLORS[ev.type] || EVENT_COLORS.general
                        return (
                          <div key={ev.id}
                            onClick={e => { e.stopPropagation(); openEdit(ev) }}
                            style={{ fontSize: 11, padding: '3px 6px', borderRadius: 5, background: c.bg, color: c.text, border: `1px solid ${c.border}`, marginBottom: 2, cursor: 'pointer' }}>
                            {ev.title}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {view === 'day' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {hours.map(h => {
            const ds = toDateStr(cursor)
            const slotEvents = eventsOn(ds).filter(e => e.event_time ? e.event_time.startsWith(String(h).padStart(2,'0')) : h === 7)
            return (
              <div key={h} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 52 }}>
                <div style={{ fontSize: 12, color: '#b0adb8', padding: '8px 10px', textAlign: 'right' }}>{h % 12 || 12}{h < 12 ? 'am' : 'pm'}</div>
                <div onClick={() => openNew(ds)} style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {slotEvents.map(ev => {
                    const c = EVENT_COLORS[ev.type] || EVENT_COLORS.general
                    return (
                      <div key={ev.id}
                        onClick={e => { e.stopPropagation(); openEdit(ev) }}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, background: c.bg, color: c.text, border: `1px solid ${c.border}`, cursor: 'pointer' }}>
                        <strong>{ev.event_time ? ev.event_time.slice(0,5) : ''}</strong> {ev.title}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Event Modal */}
      {modal && (
        <div style={overlay}>
          <div style={{ ...modalBox, padding: isMobile ? 20 : 32, margin: isMobile ? 16 : 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>{editing ? 'Edit event' : 'New event'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Event title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                <option value="seo">SEO</option>
                <option value="blog">Blog Post</option>
                <option value="project">Project Due Date</option>
                <option value="general">General</option>
              </select>
              <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} style={inp} />
              <input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} style={inp} />
              {form.type === 'blog' && blogPosts.length > 0 && (
                <select value={form.blog_post_id} onChange={e => setForm(f => ({ ...f, blog_post_id: e.target.value }))} style={inp}>
                  <option value="">Link to scheduled post (optional)</option>
                  {blogPosts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              )}
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
              <div>
                {editing && (
                  <button onClick={() => del(editing.id)} style={{ ...ghostBtn, color: '#dc2626', borderColor: '#fca5a5' }}>Delete</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setModal(false); setEditing(null) }} style={ghostBtn}>Cancel</button>
                <button onClick={save} style={darkBtn}>Save</button>
              </div>
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
const navBtn = { padding: '6px 12px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 16, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
