import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publishDueScheduledPosts } from '../../lib/blog'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const EVENT_TYPES = {
  seo: {
    label: 'SEO',
    bg: '#ede9fe',
    text: '#6d28d9',
    border: '#c4b5fd',
  },
  blog: {
    label: 'Blog',
    bg: '#dbeafe',
    text: '#1d4ed8',
    border: '#93c5fd',
  },
  project: {
    label: 'Project',
    bg: '#ffedd5',
    text: '#c2410c',
    border: '#fdba74',
  },
  general: {
    label: 'General',
    bg: '#f3f4f6',
    text: '#374151',
    border: '#d1d5db',
  },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const VIEW_OPTIONS = ['month', 'week', 'day']
const HOURS = Array.from({ length: 16 }, (_, index) => index + 7)
const BLOG_TIME_ZONE = 'America/New_York'

const EMPTY_FORM = {
  title: '',
  type: 'general',
  event_date: '',
  event_time: '',
  notes: '',
  blog_post_id: '',
}

function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || target.isContentEditable
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateKey(value) {
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function addDays(date, amount) {
  const output = new Date(date)
  output.setDate(output.getDate() + amount)
  return output
}

function startOfWeek(date) {
  return addDays(date, -date.getDay())
}

function formatEventTime(value) {
  if (!value) return 'All day'
  const [hourRaw = '0', minuteRaw = '00'] = String(value).split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function eventSortKey(event) {
  const timePart = event.event_time ? String(event.event_time).slice(0, 5) : '00:00'
  return `${event.event_date}T${timePart}:00`
}

function sortEvents(events) {
  return [...events].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
}

function getDatePartsInTimeZone(date, timeZone = BLOG_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const map = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value)
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour24: map.hour,
    minute: map.minute,
  }
}

function formatDateKeyInTimeZone(isoValue, timeZone = BLOG_TIME_ZONE) {
  if (!isoValue) return ''
  const parts = getDatePartsInTimeZone(new Date(isoValue), timeZone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function formatTimeInTimeZone(isoValue, timeZone = BLOG_TIME_ZONE) {
  if (!isoValue) return ''
  const parts = getDatePartsInTimeZone(new Date(isoValue), timeZone)
  return `${String(parts.hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
}

function isMissingTableError(error, tableName) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes(`could not find the table 'public.${tableName}'`) || message.includes(`relation "${tableName}" does not exist`)
}

function createLinkedBlogEvent(post) {
  return {
    id: `linked-blog-${post.id}`,
    title: post.title,
    type: 'blog',
    event_date: formatDateKeyInTimeZone(post.publish_at),
    event_time: formatTimeInTimeZone(post.publish_at),
    notes: 'Synced from the scheduled publish time in Blogs.',
    blog_post_id: post.id,
    source: 'blog_post',
    status: post.status,
    publish_at: post.publish_at,
  }
}

function getMonthCells(cursor) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = addDays(monthStart, -monthStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date,
      key: formatDateKey(date),
      inCurrentMonth: date.getMonth() === cursor.getMonth(),
    }
  })
}

export default function AdminCalendar() {
  const isMobile = useIsMobile(768)
  const navigate = useNavigate()
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))

  const [events, setEvents] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const selectedDateObj = useMemo(() => parseDateKey(selectedDate), [selectedDate])
  const isLinkedBlogEvent = editingEvent?.source === 'blog_post'

  const eventsByDate = useMemo(() => {
    const output = new Map()

    events.forEach(event => {
      const existing = output.get(event.event_date) || []
      existing.push(event)
      output.set(event.event_date, existing)
    })

    for (const [dateKey, dateEvents] of output.entries()) {
      output.set(dateKey, sortEvents(dateEvents))
    }

    return output
  }, [events])

  const monthCells = useMemo(() => getMonthCells(cursor), [cursor])

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDateObj)
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [selectedDateObj])

  const selectedDayEvents = useMemo(
    () => eventsByDate.get(selectedDate) || [],
    [eventsByDate, selectedDate]
  )

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return sortEvents(events)
      .filter(event => new Date(eventSortKey(event)) >= now)
      .slice(0, 10)
  }, [events])

  const metrics = useMemo(() => {
    const currentMonthCount = events.filter(event => {
      const date = parseDateKey(event.event_date)
      return date.getMonth() === cursor.getMonth() && date.getFullYear() === cursor.getFullYear()
    }).length

    return {
      total: events.length,
      month: currentMonthCount,
      upcoming: upcomingEvents.length,
    }
  }, [cursor, events, upcomingEvents.length])

  const load = useCallback(async () => {
    setError('')

    try {
      await publishDueScheduledPosts()

      const [eventsRes, blogRes] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .order('event_date', { ascending: true })
          .order('event_time', { ascending: true }),
        supabase
          .from('blog_posts')
          .select('id, title, status, publish_at')
          .in('status', ['scheduled', 'draft'])
          .order('updated_at', { ascending: false }),
      ])

      if (eventsRes.error && !isMissingTableError(eventsRes.error, 'calendar_events')) throw eventsRes.error
      if (blogRes.error) throw blogRes.error

      const manualEvents = (eventsRes.data ?? []).map(event => ({ ...event, source: 'calendar' }))
      const linkedBlogIds = new Set(
        manualEvents
          .filter(event => event.type === 'blog' && event.blog_post_id)
          .map(event => String(event.blog_post_id))
      )
      const syncedBlogEvents = (blogRes.data ?? [])
        .filter(post => post.status === 'scheduled' && post.publish_at)
        .filter(post => !linkedBlogIds.has(String(post.id)))
        .map(createLinkedBlogEvent)

      setEvents(sortEvents([...manualEvents, ...syncedBlogEvents]))
      setBlogPosts(blogRes.data ?? [])

      if (eventsRes.error && isMissingTableError(eventsRes.error, 'calendar_events')) {
        setError('Calendar events table is missing, but scheduled blog posts are still syncing into the calendar.')
      }
    } catch (loadError) {
      setError(loadError?.message || 'Could not load calendar data.')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const openNew = useCallback((dateKey = selectedDate, time = '') => {
    setEditingEvent(null)
    setForm({ ...EMPTY_FORM, event_date: dateKey, event_time: time })
    setModalOpen(true)
  }, [selectedDate])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key.toLowerCase() === 'n') {
        if (event.metaKey || event.ctrlKey || event.altKey) return
        if (isTypingTarget(document.activeElement)) return
        event.preventDefault()
        openNew()
      }

      if (event.key.toLowerCase() === 't') {
        if (event.metaKey || event.ctrlKey || event.altKey) return
        if (isTypingTarget(document.activeElement)) return
        event.preventDefault()
        const today = new Date()
        setCursor(today)
        setSelectedDate(formatDateKey(today))
      }

      if (event.key === 'Escape' && modalOpen) {
        setModalOpen(false)
        setEditingEvent(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, openNew])

  function openEdit(event) {
    setEditingEvent(event)
    setForm({
      title: event.title || '',
      type: event.type || 'general',
      event_date: event.event_date || '',
      event_time: event.event_time ? String(event.event_time).slice(0, 5) : '',
      notes: event.notes || '',
      blog_post_id: event.blog_post_id || '',
    })
    setModalOpen(true)
  }

  function updateForm(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function formError() {
    if (!form.title.trim()) return 'Event title is required.'
    if (!form.event_date) return 'Event date is required.'

    if (form.event_time && !/^\d{2}:\d{2}$/.test(form.event_time)) {
      return 'Event time must be valid.'
    }

    return ''
  }

  const validationError = formError()

  async function saveEvent() {
    if (saving || validationError) return

    const payload = {
      title: form.title.trim(),
      type: form.type,
      event_date: form.event_date,
      event_time: form.event_time || null,
      notes: form.notes.trim() || null,
      blog_post_id: form.type === 'blog' && form.blog_post_id ? form.blog_post_id : null,
    }

    setSaving(true)
    setError('')

    try {
      if (editingEvent) {
        const { error: updateError } = await supabase.from('calendar_events').update(payload).eq('id', editingEvent.id)
        if (updateError) throw updateError
        setNotice('Event updated.')
      } else {
        const { error: insertError } = await supabase.from('calendar_events').insert(payload)
        if (insertError) throw insertError
        setNotice('Event added.')
      }

      setModalOpen(false)
      setEditingEvent(null)
      setForm(EMPTY_FORM)
      setSelectedDate(payload.event_date)
      await load()
    } catch (saveError) {
      setError(saveError?.message || 'Could not save event.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent(event) {
    if (event.source === 'blog_post') {
      setError('Scheduled blog entries are synced from Blogs. Delete or reschedule them from the Blogs admin page.')
      return
    }

    const approved = window.confirm('Delete this event?')
    if (!approved) return

    setError('')
    const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', event.id)

    if (deleteError) {
      setError(deleteError.message || 'Could not delete event.')
      return
    }

    setNotice('Event deleted.')
    setModalOpen(false)
    setEditingEvent(null)
    await load()
  }

  function shiftCursor(direction) {
    if (view === 'month') {
      const next = new Date(cursor)
      next.setMonth(next.getMonth() + direction)
      setCursor(next)

      const selected = new Date(selectedDateObj)
      selected.setMonth(selected.getMonth() + direction)
      setSelectedDate(formatDateKey(selected))
      return
    }

    if (view === 'week') {
      const next = addDays(selectedDateObj, direction * 7)
      setSelectedDate(formatDateKey(next))
      setCursor(next)
      return
    }

    const next = addDays(selectedDateObj, direction)
    setSelectedDate(formatDateKey(next))
    setCursor(next)
  }

  function jumpToToday() {
    const today = new Date()
    setCursor(today)
    setSelectedDate(formatDateKey(today))
  }

  function titleForView() {
    if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    if (view === 'week') {
      const start = weekDays[0]
      const end = weekDays[6]
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
    }

    return `${MONTHS[selectedDateObj.getMonth()]} ${selectedDateObj.getDate()}, ${selectedDateObj.getFullYear()}`
  }

  const today = new Date()
  const todayKey = formatDateKey(today)
  const linkedBlogOption = blogPosts.find(post => String(post.id) === String(form.blog_post_id))

  return (
    <div style={{ padding: isMobile ? '18px 16px 30px' : '34px 40px 44px' }}>
      <div className="anim-rise-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Calendar</h1>
        <button onClick={() => openNew()} style={darkBtn}>+ Event</button>
      </div>

      <div className="anim-rise-2" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
        <MetricCard label="Total events" value={metrics.total} color="#18181a" />
        <MetricCard label="This month" value={metrics.month} color="#7c3aed" />
        <MetricCard label="Upcoming" value={metrics.upcoming} color="#b45309" />
      </div>

      <div className="anim-rise-3" style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: isMobile ? 10 : 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', background: '#f6f3ef', borderRadius: 999, padding: 4 }}>
            {VIEW_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => setView(option)}
                style={{
                  ...toggleBtn,
                  background: view === option ? '#18181a' : 'transparent',
                  color: view === option ? 'white' : '#7a7888',
                }}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={jumpToToday} style={ghostBtn}>Today</button>
            <button onClick={() => shiftCursor(-1)} style={navBtn}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: isMobile ? 160 : 230, textAlign: 'center', color: '#18181a' }}>{titleForView()}</span>
            <button onClick={() => shiftCursor(1)} style={navBtn}>›</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={errorBox}>
          <span>{error}</span>
          <button onClick={load} style={{ ...ghostBtn, padding: '5px 10px' }}>Retry</button>
        </div>
      )}
      {notice && <div style={noticeBox}>{notice}</div>}

      <div className="anim-rise-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 300px', gap: 14 }}>
        <section style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', minHeight: 500 }}>
          {loading ? (
            <div style={{ padding: 20, color: '#7a7888', fontSize: 13 }}>Loading calendar…</div>
          ) : (
            <>
              {view === 'month' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {DAYS.map(day => (
                      <div key={day} style={{ textAlign: 'center', fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '9px 0' }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {monthCells.map(cell => {
                      const dayEvents = eventsByDate.get(cell.key) || []
                      const isToday = cell.key === todayKey
                      const isSelected = cell.key === selectedDate

                      return (
                        <button
                          key={cell.key}
                          onClick={() => {
                            setSelectedDate(cell.key)
                            setCursor(cell.date)
                          }}
                          onDoubleClick={() => openNew(cell.key)}
                          style={{
                            border: 'none',
                            borderRight: '1px solid rgba(0,0,0,0.05)',
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            background: !cell.inCurrentMonth ? '#faf9f7' : isSelected ? '#fff8ef' : 'white',
                            minHeight: isMobile ? 74 : 96,
                            padding: '6px 6px 7px',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 3,
                            fontSize: 12,
                            fontWeight: isToday || isSelected ? 700 : 500,
                            color: isToday ? 'white' : '#18181a',
                            background: isToday ? '#18181a' : isSelected ? '#f3e8d9' : 'transparent',
                            opacity: cell.inCurrentMonth ? 1 : 0.45,
                          }}>
                            {cell.date.getDate()}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {dayEvents.slice(0, isMobile ? 1 : 2).map(event => {
                              const colors = EVENT_TYPES[event.type] || EVENT_TYPES.general
                              return (
                                <span
                                  key={event.id}
                                  onClick={clickEvent => {
                                    clickEvent.stopPropagation()
                                    openEdit(event)
                                  }}
                                  style={{
                                    fontSize: 10,
                                    borderRadius: 6,
                                    background: colors.bg,
                                    color: colors.text,
                                    padding: '2px 5px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {event.title}
                                </span>
                              )
                            })}

                            {dayEvents.length > (isMobile ? 1 : 2) && (
                              <span style={{ fontSize: 10, color: '#7a7888' }}>+{dayEvents.length - (isMobile ? 1 : 2)} more</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {view === 'week' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '54px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div />
                    {weekDays.map(day => {
                      const key = formatDateKey(day)
                      const isToday = key === todayKey
                      const isSelected = key === selectedDate
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDate(key)}
                          style={{
                            border: 'none',
                            background: isSelected ? '#fff8ef' : isToday ? '#f8f5f0' : 'white',
                            padding: '9px 4px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{DAYS[day.getDay()]}</div>
                          <div style={{ fontSize: 18, color: '#18181a', fontWeight: isSelected || isToday ? 700 : 500 }}>{day.getDate()}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                    {HOURS.map(hour => (
                      <div key={hour} style={{ display: 'grid', gridTemplateColumns: '54px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 50 }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', padding: '6px 7px' }}>{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</div>
                        {weekDays.map(day => {
                          const dayKey = formatDateKey(day)
                          const slotEvents = (eventsByDate.get(dayKey) || []).filter(event => {
                            if (!event.event_time) return false
                            return String(event.event_time).slice(0, 2) === String(hour).padStart(2, '0')
                          })

                          return (
                            <button
                              key={`${dayKey}-${hour}`}
                              onClick={() => openNew(dayKey, `${String(hour).padStart(2, '0')}:00`)}
                              style={{
                                border: 'none',
                                borderLeft: '1px solid rgba(0,0,0,0.04)',
                                background: 'white',
                                textAlign: 'left',
                                padding: '3px 5px',
                                cursor: 'pointer',
                              }}
                            >
                              {slotEvents.map(event => {
                                const colors = EVENT_TYPES[event.type] || EVENT_TYPES.general
                                return (
                                  <span
                                    key={event.id}
                                    onClick={clickEvent => {
                                      clickEvent.stopPropagation()
                                      openEdit(event)
                                    }}
                                    style={{
                                      display: 'block',
                                      fontSize: 10,
                                      borderRadius: 6,
                                      background: colors.bg,
                                      color: colors.text,
                                      border: `1px solid ${colors.border}`,
                                      padding: '2px 5px',
                                      marginBottom: 2,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {event.title}
                                  </span>
                                )
                              })}
                            </button>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === 'day' && (
                <div>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a' }}>{DAYS[selectedDateObj.getDay()]}, {MONTHS[selectedDateObj.getMonth()]} {selectedDateObj.getDate()}</div>
                    <button onClick={() => openNew(selectedDate)} style={ghostBtn}>+ New on this day</button>
                  </div>

                  <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                    {HOURS.map(hour => {
                      const slotEvents = selectedDayEvents.filter(event => {
                        if (!event.event_time) return hour === HOURS[0]
                        return String(event.event_time).slice(0, 2) === String(hour).padStart(2, '0')
                      })

                      return (
                        <div key={hour} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', borderBottom: '1px solid rgba(0,0,0,0.05)', minHeight: 56 }}>
                          <div style={{ fontSize: 12, color: '#9ca3af', padding: '8px 8px 0', textAlign: 'right' }}>{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</div>
                          <button
                            onClick={() => openNew(selectedDate, `${String(hour).padStart(2, '0')}:00`)}
                            style={{ border: 'none', background: 'white', textAlign: 'left', padding: '5px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3 }}
                          >
                            {slotEvents.map(event => {
                              const colors = EVENT_TYPES[event.type] || EVENT_TYPES.general
                              return (
                                <span
                                  key={event.id}
                                  onClick={clickEvent => {
                                    clickEvent.stopPropagation()
                                    openEdit(event)
                                  }}
                                  style={{ fontSize: 12, borderRadius: 8, border: `1px solid ${colors.border}`, color: colors.text, background: colors.bg, padding: '5px 8px' }}
                                >
                                  <strong style={{ fontWeight: 600 }}>{formatEventTime(event.event_time)}</strong> {event.title}
                                </span>
                              )
                            })}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 13, color: '#18181a' }}>Selected Day</h2>
              <button onClick={() => openNew(selectedDate)} style={{ ...ghostBtn, padding: '5px 9px' }}>+ Add</button>
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 12, color: '#7a7888', marginBottom: 8 }}>
                {MONTHS[selectedDateObj.getMonth()]} {selectedDateObj.getDate()}, {selectedDateObj.getFullYear()}
              </div>

              {selectedDayEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>No events scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {selectedDayEvents.map(event => {
                    const colors = EVENT_TYPES[event.type] || EVENT_TYPES.general
                    return (
                      <button
                        key={event.id}
                        onClick={() => openEdit(event)}
                        style={{
                          border: `1px solid ${colors.border}`,
                          borderRadius: 10,
                          background: colors.bg,
                          color: colors.text,
                          textAlign: 'left',
                          padding: '8px 9px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 11, marginBottom: 2 }}>{formatEventTime(event.event_time)}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{event.title}</div>
                        {event.source === 'blog_post' && (
                          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>Scheduled blog sync</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <h2 style={{ margin: 0, fontSize: 13, color: '#18181a' }}>Upcoming Timeline</h2>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 270, overflowY: 'auto' }}>
              {upcomingEvents.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Nothing upcoming yet.</div>
              ) : (
                upcomingEvents.map(event => {
                  const colors = EVENT_TYPES[event.type] || EVENT_TYPES.general
                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedDate(event.event_date)
                        setCursor(parseDateKey(event.event_date))
                        openEdit(event)
                      }}
                      style={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 10,
                        background: 'white',
                        color: '#18181a',
                        textAlign: 'left',
                        padding: '8px 9px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#7a7888', marginBottom: 3 }}>
                        {event.event_date} • {formatEventTime(event.event_time)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{event.title}</div>
                      {event.source === 'blog_post' && (
                        <div style={{ fontSize: 11, color: '#7a7888', marginBottom: 4 }}>Synced from scheduled blog</div>
                      )}
                      <span style={{ ...chip, background: colors.bg, color: colors.text }}>{EVENT_TYPES[event.type]?.label || 'General'}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 12 }}>
            <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Legend</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(EVENT_TYPES).map(([key, colors]) => (
                <div key={key} style={{ ...chip, background: colors.bg, color: colors.text, textAlign: 'center', border: `1px solid ${colors.border}` }}>
                  {colors.label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Shortcuts: press `N` for new event, `T` for today.</div>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div style={overlay}>
          <div style={{ ...modalBox, margin: isMobile ? 16 : 0 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 600, color: '#18181a' }}>
              {isLinkedBlogEvent ? 'Scheduled blog event' : editingEvent ? 'Edit event' : 'New event'}
            </h2>

            {isLinkedBlogEvent && (
              <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12 }}>
                This calendar item is synced from a scheduled blog post. Change the publish time in Blogs and the calendar will update automatically.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                value={form.title}
                onChange={event => updateForm('title', event.target.value)}
                placeholder="Event title"
                style={inp}
                disabled={isLinkedBlogEvent}
              />

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <select value={form.type} onChange={event => updateForm('type', event.target.value)} style={inp} disabled={isLinkedBlogEvent}>
                  {Object.entries(EVENT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={form.event_date}
                  onChange={event => updateForm('event_date', event.target.value)}
                  style={inp}
                  disabled={isLinkedBlogEvent}
                />
              </div>

              <input
                type="time"
                value={form.event_time}
                onChange={event => updateForm('event_time', event.target.value)}
                style={inp}
                disabled={isLinkedBlogEvent}
              />

              {form.type === 'blog' && (
                <select
                  value={form.blog_post_id}
                  onChange={event => {
                    const value = event.target.value
                    const linkedPost = blogPosts.find(post => String(post.id) === String(value))
                    setForm(current => ({
                      ...current,
                      blog_post_id: value,
                      title: linkedPost && !current.title.trim() ? linkedPost.title : current.title,
                      event_date: linkedPost?.publish_at ? formatDateKeyInTimeZone(linkedPost.publish_at) : current.event_date,
                      event_time: linkedPost?.publish_at ? formatTimeInTimeZone(linkedPost.publish_at) : current.event_time,
                      notes: linkedPost?.publish_at && !current.notes.trim() ? 'Linked to scheduled blog publish time.' : current.notes,
                    }))
                  }}
                  style={inp}
                  disabled={isLinkedBlogEvent}
                >
                  <option value="">Link scheduled or draft blog (optional)</option>
                  {blogPosts.map(post => (
                    <option key={post.id} value={post.id}>
                      {post.title} ({post.status})
                    </option>
                  ))}
                </select>
              )}

              {form.type === 'blog' && linkedBlogOption?.publish_at && !isLinkedBlogEvent && (
                <div style={{ fontSize: 12, color: '#7a7888' }}>
                  Linked blog schedule: {new Intl.DateTimeFormat('en-US', {
                    timeZone: BLOG_TIME_ZONE,
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }).format(new Date(linkedBlogOption.publish_at))} EST
                </div>
              )}

              <textarea
                value={form.notes}
                onChange={event => updateForm('notes', event.target.value)}
                placeholder="Notes"
                rows={4}
                style={{ ...inp, resize: 'vertical' }}
                disabled={isLinkedBlogEvent}
              />

              {validationError && <div style={{ fontSize: 12, color: '#b91c1c' }}>{validationError}</div>}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div>
                {editingEvent && !isLinkedBlogEvent && (
                  <button onClick={() => deleteEvent(editingEvent)} style={{ ...ghostBtn, color: '#b91c1c', borderColor: '#fca5a5' }}>Delete</button>
                )}
                {isLinkedBlogEvent && (
                  <button onClick={() => navigate(`/admin/blogs?preview=${editingEvent.blog_post_id}`)} style={ghostBtn}>Open in Blogs</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setModalOpen(false)
                    setEditingEvent(null)
                  }}
                  style={ghostBtn}
                >
                  Cancel
                </button>
                {!isLinkedBlogEvent && (
                  <button onClick={saveEvent} disabled={saving || Boolean(validationError)} style={{ ...darkBtn, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save event'}
                  </button>
                )}
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

const chip = {
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 999,
  padding: '2px 7px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
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

const toggleBtn = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: 999,
  fontSize: 12,
  cursor: 'pointer',
}

const navBtn = {
  padding: '6px 11px',
  borderRadius: 999,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'white',
  color: '#18181a',
  cursor: 'pointer',
  fontSize: 15,
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
  maxWidth: 520,
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
  padding: '22px',
}
