import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Digital Marketing',
  read_time: '6 min read',
  keywords: '',
  content: '',
  cover_image_url: '',
  scheduleMode: 'now',   // 'now' | 'schedule'
  publish_at: '',        // ISO datetime string when scheduleMode === 'schedule'
}
const NEW_YORK_TZ = 'America/New_York'
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function isMissingTableError(error) {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes('could not find the table') || msg.includes('blog_posts')
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function getDatePartsInTimeZone(date, timeZone = NEW_YORK_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
    second: map.second,
  }
}

function getTimeZoneOffsetMinutes(date, timeZone = NEW_YORK_TZ) {
  const parts = getDatePartsInTimeZone(date, timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour24, parts.minute, parts.second)
  return (asUtc - date.getTime()) / 60000
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function toHour12(hour24) {
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  const hour = hour24 % 12 || 12
  return { hour, ampm }
}

function toHour24(hour12, ampm) {
  const raw = Number(hour12) % 12
  return ampm === 'PM' ? raw + 12 : raw
}

function isoToScheduleDraft(isoValue) {
  const baseDate = isoValue ? new Date(isoValue) : new Date(Date.now() + 60 * 60 * 1000)
  const parts = getDatePartsInTimeZone(baseDate, NEW_YORK_TZ)
  const time = toHour12(parts.hour24)

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: time.hour,
    minute: String(parts.minute).padStart(2, '0'),
    ampm: time.ampm,
  }
}

function getDefaultScheduleDraft() {
  const seed = new Date(Date.now() + 60 * 60 * 1000)
  const parts = getDatePartsInTimeZone(seed, NEW_YORK_TZ)
  const roundedMinute = Math.ceil(parts.minute / 5) * 5
  const bumped = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour24, roundedMinute, 0))
  return isoToScheduleDraft(bumped.toISOString())
}

function buildIsoFromNyDraft(draft) {
  const year = Number(draft.year)
  const month = Number(draft.month)
  const day = Number(draft.day)
  const hour = Number(draft.hour)
  const minute = Number(draft.minute)
  const ampm = draft.ampm

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    return { iso: null, error: 'Choose a complete schedule date and time.' }
  }
  if (month < 1 || month > 12) return { iso: null, error: 'Month is invalid.' }
  if (day < 1 || day > getDaysInMonth(year, month)) return { iso: null, error: 'That date does not exist.' }
  if (hour < 1 || hour > 12) return { iso: null, error: 'Hour is invalid.' }
  if (minute < 0 || minute > 59) return { iso: null, error: 'Minute is invalid.' }
  if (!['AM', 'PM'].includes(ampm)) return { iso: null, error: 'AM/PM is invalid.' }

  const hour24 = toHour24(hour, ampm)
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour24, minute, 0)
  let targetMs = localAsUtcMs
  for (let i = 0; i < 4; i += 1) {
    const offset = getTimeZoneOffsetMinutes(new Date(targetMs), NEW_YORK_TZ)
    targetMs = localAsUtcMs - offset * 60 * 1000
  }

  const check = getDatePartsInTimeZone(new Date(targetMs), NEW_YORK_TZ)
  const matches =
    check.year === year &&
    check.month === month &&
    check.day === day &&
    check.hour24 === hour24 &&
    check.minute === minute

  if (!matches) {
    return { iso: null, error: 'That exact New York time does not exist (DST transition).' }
  }

  const iso = new Date(targetMs).toISOString()
  if (targetMs <= Date.now()) return { iso: null, error: 'Scheduled time must be in the future.' }

  return { iso, error: null }
}

function formatDateEST(isoValue, includeZone = true) {
  if (!isoValue) return '—'
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoValue))
  return includeZone ? `${formatted} EST` : formatted
}

function formatCountdown(isoValue) {
  if (!isoValue) return 'No schedule set'
  const diff = new Date(isoValue).getTime() - Date.now()
  if (diff <= 0) return 'Publishing soon'
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `In ${days}d ${hours}h`
  if (hours > 0) return `In ${hours}h ${minutes}m`
  return `In ${minutes}m`
}

function postToForm(post) {
  return {
    title: post.title || '',
    slug: post.slug || '',
    excerpt: post.excerpt || '',
    category: post.category || 'Digital Marketing',
    read_time: post.read_time || '6 min read',
    keywords: post.keywords || '',
    content: post.content || '',
    cover_image_url: post.cover_image_url || '',
    scheduleMode: post.status === 'scheduled' ? 'schedule' : 'now',
    publish_at: post.publish_at || '',
  }
}

function formToPost(f) {
  const { scheduleMode: _scheduleMode, publish_at: _publishAt, ...rest } = f
  return rest
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function createProcessedCoverBlob(file) {
  const bitmap = await createImageBitmap(file)
  const targetWidth = 1600
  const targetHeight = 1000

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f3eee8'
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  const scale = Math.max(targetWidth / bitmap.width, targetHeight / bitmap.height)
  const drawWidth = bitmap.width * scale
  const drawHeight = bitmap.height * scale
  const offsetX = (targetWidth - drawWidth) / 2
  const offsetY = (targetHeight - drawHeight) / 2

  ctx.save()
  drawRoundedRectPath(ctx, 0, 0, targetWidth, targetHeight, 52)
  ctx.clip()
  ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight)

  const vignette = ctx.createRadialGradient(
    targetWidth / 2,
    targetHeight / 2,
    Math.min(targetWidth, targetHeight) * 0.2,
    targetWidth / 2,
    targetHeight / 2,
    Math.max(targetWidth, targetHeight) * 0.72
  )
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.12)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  ctx.restore()

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.96))
  return blob
}

export default function AdminBlogs() {
  const [params] = useSearchParams()
  const previewId = params.get('preview')

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const isMobile = useIsMobile(768)
  const [scheduleDraft, setScheduleDraft] = useState(() => getDefaultScheduleDraft())

  const scheduleValidation = useMemo(() => {
    if (form.scheduleMode !== 'schedule') return { iso: null, error: null }
    return buildIsoFromNyDraft(scheduleDraft)
  }, [form.scheduleMode, scheduleDraft])

  const draftPosts = useMemo(() => posts.filter(p => p.status === 'draft'), [posts])
  const publishedPosts = useMemo(() => posts.filter(p => p.status === 'published' || (!p.status && p.published_at)), [posts])
  const scheduledPosts = useMemo(
    () => posts
      .filter(p => p.status === 'scheduled')
      .sort((a, b) => new Date(a.publish_at || 0).getTime() - new Date(b.publish_at || 0).getTime()),
    [posts]
  )
  const isEditingPublished = editing?.status === 'published'
  const postActionDisabled = saving || uploading || (form.scheduleMode === 'schedule' && Boolean(scheduleValidation.error))

  const selectedPreview = useMemo(() => {
    if (previewId) return posts.find(p => String(p.id) === String(previewId)) || null
    return editing
  }, [posts, previewId, editing])

  const load = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      if (isMissingTableError(error)) {
        setSetupRequired(true)
        setNotice(`Supabase error: ${error.message} (code: ${error.code})`)
      } else {
        setNotice(`Load failed: ${error.message}`)
      }
      setPosts([])
      setLoading(false)
      return
    }

    setSetupRequired(false)
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          if (isMissingTableError(error)) {
            setSetupRequired(true)
            setNotice(`Blog setup error: ${error.message}`)
          } else {
            setNotice(`Load failed: ${error.message}`)
          }
          setPosts([])
          setLoading(false)
          return
        }

        setSetupRequired(false)
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [])

  async function ensureUniqueSlug(base, ignoreId = null) {
    const cleanBase = slugify(base) || `blog-${Date.now()}`
    let candidate = cleanBase
    let bump = 1

    while (true) {
      let query = supabase.from('blog_posts').select('id').eq('slug', candidate).limit(1)
      if (ignoreId) query = query.neq('id', ignoreId)
      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }
      if (!data || data.length === 0) return candidate
      candidate = `${cleanBase}-${bump}`
      bump += 1
    }
  }

  function beginCreate() {
    setEditing(null)
    setForm(emptyForm)
    setScheduleDraft(getDefaultScheduleDraft())
    setNotice('')
  }

  function beginEdit(post) {
    setEditing(post)
    setForm(postToForm(post))
    setScheduleDraft(isoToScheduleDraft(post.publish_at))
    if (post.status === 'published') {
      setNotice('Viewing a published blog. Posting from here creates a new blog and keeps existing blogs intact.')
    } else if (post.status === 'scheduled') {
      setNotice('Editing scheduled blog. All times are shown in EST.')
    } else {
      setNotice('Editing saved draft.')
    }
  }

  async function uploadImage(file) {
    if (!file) return
    setUploading(true)
    setNotice('')

    try {
      const processedBlob = await createProcessedCoverBlob(file)
      if (!processedBlob) {
        setUploading(false)
        setNotice('Image processing failed.')
        return
      }

      const fileStem = slugify(file.name.replace(/\.[^.]+$/, '')) || 'cover-image'
      const path = `${Date.now()}-${fileStem}.png`

      const { error } = await supabase.storage
        .from('blog-images')
        .upload(path, processedBlob, { upsert: true, contentType: 'image/png' })

      if (error) {
        setUploading(false)
        setNotice(`Image upload failed: ${error.message}`)
        return
      }

      const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
      setForm(f => ({ ...f, cover_image_url: data.publicUrl }))
      setUploading(false)
      setNotice('Image uploaded, auto-cropped, and softened for blog display.')
    } catch (error) {
      setUploading(false)
      setNotice(`Image processing failed: ${error?.message || 'unknown error'}`)
    }
  }

  async function saveDraft(e) {
    e.preventDefault()
    if (setupRequired) {
      setNotice('Cannot save yet. Run docs/sql/blog_setup.sql in Supabase first.')
      return
    }
    if (!form.title || !form.excerpt || !form.content) {
      setNotice('Title, excerpt, and content are required to save draft.')
      return
    }

    setSaving(true)
    setNotice('')

    try {
      const nowIso = new Date().toISOString()
      const baseSlug = form.slug || form.title
      const ignoreId = editing?.status === 'draft' ? editing.id : null
      const slug = await ensureUniqueSlug(baseSlug, ignoreId)

      const payload = {
        ...formToPost(form),
        slug,
        status: 'draft',
        updated_at: nowIso,
        published_at: null,
      }

      let error
      if (editing?.id && editing.status === 'draft') {
        ;({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id))
      } else {
        ;({ error } = await supabase.from('blog_posts').insert({ ...payload, created_at: nowIso }))
      }

      setSaving(false)
      if (error) {
        if (isMissingTableError(error)) {
          setSetupRequired(true)
          setNotice(`Supabase error: ${error.message} (code: ${error.code})`)
          return
        }
        setNotice(`Save failed: ${error.message}`)
        return
      }

      setNotice('Draft saved to Saved Drafts.')
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (error) {
      setSaving(false)
      setNotice(`Save failed: ${error.message}`)
    }
  }

  async function publishCurrent() {
    if (setupRequired) {
      setNotice('Cannot post yet. Run docs/sql/blog_setup.sql in Supabase first.')
      return
    }
    if (!form.title || !form.excerpt || !form.content) {
      setNotice('Title, excerpt, and content are required before posting.')
      return
    }

    setSaving(true)
    setNotice('')

    try {
      const nowIso = new Date().toISOString()
      const baseSlug = form.slug || form.title
      const updateExistingDraft = Boolean(editing?.id && editing.status === 'draft')
      const slug = await ensureUniqueSlug(baseSlug, updateExistingDraft ? editing.id : null)

      const isScheduled = form.scheduleMode === 'schedule'
      const scheduleResult = isScheduled ? buildIsoFromNyDraft(scheduleDraft) : { iso: null, error: null }
      if (isScheduled && scheduleResult.error) {
        setSaving(false)
        setNotice(scheduleResult.error)
        return
      }
      const basePost = formToPost(form)

      const payload = isScheduled
        ? {
            ...basePost,
            slug,
            status: 'scheduled',
            publish_at: scheduleResult.iso,
            published_at: null,
            updated_at: nowIso,
          }
        : {
            ...basePost,
            slug,
            status: 'published',
            publish_at: null,
            published_at: editing?.published_at || nowIso,
            updated_at: nowIso,
          }

      let error
      if (updateExistingDraft) {
        ;({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id))
      } else {
        ;({ error } = await supabase.from('blog_posts').insert({ ...payload, created_at: nowIso }))
      }

      setSaving(false)
      if (error) {
        if (isMissingTableError(error)) {
          setSetupRequired(true)
          setNotice(`Supabase error: ${error.message} (code: ${error.code})`)
          return
        }
        setNotice(`Publish failed: ${error.message}`)
        return
      }

      setNotice(isScheduled
        ? `Blog scheduled for ${formatDateEST(scheduleResult.iso)}.`
        : 'Blog posted successfully and is now live on the public Blogs page.')
      setEditing(null)
      setForm(emptyForm)
      setScheduleDraft(getDefaultScheduleDraft())
      await load()
    } catch (error) {
      setSaving(false)
      setNotice(`Publish failed: ${error.message}`)
    }
  }

  async function publishFromRow(post) {
    if (post.status === 'published') {
      setNotice('This blog is already published.')
      return
    }

    const { error } = await supabase.from('blog_posts').update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)

    if (error) {
      if (isMissingTableError(error)) {
        setSetupRequired(true)
        setNotice('Blog table missing. Run docs/sql/blog_setup.sql in Supabase SQL Editor.')
        return
      }
      setNotice(`Publish failed: ${error.message}`)
      return
    }

    setNotice(`Posted: ${post.title}`)
    if (editing?.id === post.id) {
      setEditing(null)
      setForm(emptyForm)
    }
    await load()
  }

  async function remove(id) {
    const ok = window.confirm('Delete this blog post?')
    if (!ok) return

    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) {
      if (isMissingTableError(error)) {
        setSetupRequired(true)
        setNotice('Blog table missing. Run docs/sql/blog_setup.sql in Supabase SQL Editor.')
        return
      }
      setNotice(`Delete failed: ${error.message}`)
      return
    }

    if (editing?.id === id) {
      setEditing(null)
      setForm(emptyForm)
    }
    setNotice('Blog deleted.')
    await load()
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: 0, letterSpacing: '-0.4px' }}>Blogs</h1>
        <button onClick={beginCreate} style={darkBtn}>+ New blog</button>
      </div>

      {setupRequired && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#9a3412', fontSize: 13 }}>
          Blog table is missing in Supabase. Run `docs/sql/blog_setup.sql` once, then refresh.
        </div>
      )}

      {notice && (
        <div style={{ background: '#f8f6f2', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#3a3840', fontSize: 13 }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.25fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <PostTable
            title={`Saved Drafts (${draftPosts.length})`}
            posts={draftPosts}
            loading={loading}
            emptyText="No saved drafts yet."
            renderActions={post => (
              <>
                <button style={ghostBtn} onClick={() => beginEdit(post)}>Edit</button>
                <button style={ghostBtn} onClick={() => publishFromRow(post)}>Post Blog</button>
                <button style={ghostBtn} onClick={() => remove(post.id)}>Delete</button>
              </>
            )}
          />

          <PostTable
            title={`Published Blogs (${publishedPosts.length})`}
            posts={publishedPosts}
            loading={loading}
            emptyText="No published blogs yet."
            renderActions={post => (
              <>
                <button style={ghostBtn} onClick={() => beginEdit(post)}>Edit</button>
                <button style={ghostBtn} onClick={() => remove(post.id)}>Delete</button>
              </>
            )}
            showPublishedDate
          />

          <ScheduledPostsPanel
            posts={scheduledPosts}
            loading={loading}
            onEdit={beginEdit}
            onDelete={remove}
            onPublishNow={publishFromRow}
          />
        </div>

        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 600, color: '#18181a' }}>
            {editing ? (isEditingPublished ? 'Edit published blog' : 'Edit draft') : 'Create blog'}
          </div>
          <form onSubmit={saveDraft} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
              required
              style={inp}
            />
            <input
              placeholder="Slug *"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
              required
              style={inp}
            />
            <input
              placeholder="Excerpt *"
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              required
              style={inp}
            />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp} />
              <input placeholder="Read time (e.g. 6 min read)" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))} style={inp} />
            </div>
            <input placeholder="Keywords" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} style={inp} />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 10, alignItems: 'center' }}>
              <input placeholder="Cover image URL" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} style={inp} />
              <label style={{ ...ghostBtn, padding: '9px 12px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => uploadImage(e.target.files?.[0])}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </label>
            </div>
            <textarea
              placeholder="Blog content. Separate paragraphs with blank lines."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12}
              style={{ ...inp, resize: 'vertical' }}
            />

            {/* Scheduling toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: '#f5f3f0', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="now"
                    checked={form.scheduleMode === 'now'}
                    onChange={() => setForm(f => ({ ...f, scheduleMode: 'now', publish_at: '' }))}
                  />
                  Publish now
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="schedule"
                    checked={form.scheduleMode === 'schedule'}
                    onChange={() => {
                      setForm(f => ({ ...f, scheduleMode: 'schedule' }))
                      setScheduleDraft(prev => prev || getDefaultScheduleDraft())
                    }}
                  />
                  Schedule for later
                </label>
              </div>
              {form.scheduleMode === 'schedule' && (
                <ScheduleComposer
                  value={scheduleDraft}
                  onChange={setScheduleDraft}
                  error={scheduleValidation.error}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" style={ghostBtn} onClick={beginCreate}>Reset</button>
              <button type="submit" style={darkBtn} disabled={saving || uploading}>
                {saving ? 'Saving…' : (isEditingPublished ? 'Save Draft Copy' : 'Save Draft')}
              </button>
              <button
                type="button"
                style={{ ...darkBtn, background: '#b45309' }}
                onClick={publishCurrent}
                disabled={postActionDisabled}
              >
                {saving ? 'Posting…' : (isEditingPublished ? 'Post as New Blog' : 'Post Blog')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ marginTop: 16, background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 600, color: '#18181a' }}>Preview before publishing</div>
        {!selectedPreview && !form.title ? (
          <div style={{ padding: 14, color: '#7a7888', fontSize: 13 }}>Select a post or start writing to preview it here.</div>
        ) : (
          <div style={{ padding: 14 }}>
            {(form.cover_image_url || selectedPreview?.cover_image_url) && (
              <div style={{
                width: '100%',
                aspectRatio: '16 / 10',
                background: 'linear-gradient(135deg, #f6f1ea 0%, #eee6db 100%)',
                borderRadius: 20,
                marginBottom: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
              }}>
                <img
                  src={form.cover_image_url || selectedPreview?.cover_image_url}
                  alt="Blog cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ fontSize: 12, color: '#b8906a', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>
              {form.category || selectedPreview?.category || 'Digital Marketing'}
            </div>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: isMobile ? 22 : 34, lineHeight: 1.08, color: '#18181a', margin: '8px 0 10px' }}>
              {form.title || selectedPreview?.title || 'Untitled draft'}
            </h2>
            <p style={{ color: '#7a7888', fontSize: 16, lineHeight: 1.6, marginTop: 0 }}>
              {form.excerpt || selectedPreview?.excerpt || 'Draft excerpt will appear here.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {String(form.content || selectedPreview?.content || '')
                .split('\n\n')
                .map(p => p.trim())
                .filter(Boolean)
                .slice(0, 6)
                .map(p => (
                  <p key={p.slice(0, 24)} style={{ margin: 0, color: '#3a3840', fontSize: 16, lineHeight: 1.72 }}>{p}</p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PostTable({ title, posts, loading, emptyText, renderActions, showPublishedDate = false }) {
  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 600, color: '#18181a' }}>{title}</div>
      {loading ? (
        <div style={{ padding: 14, color: '#7a7888', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Title', showPublishedDate ? 'Published' : 'Updated', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#18181a', fontWeight: 500 }}>{post.title}</td>
                  <td style={{ padding: '10px 12px', color: '#7a7888' }}>{formatDate(showPublishedDate ? post.published_at : post.updated_at)}</td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {renderActions(post)}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 14, color: '#7a7888' }}>{emptyText}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ScheduledPostsPanel({ posts, loading, onEdit, onDelete, onPublishNow }) {
  const nextUp = posts[0]

  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(180deg,#fcfbf9 0%, #f5f3f0 100%)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#18181a', letterSpacing: '-0.2px' }}>
          Scheduled Blogs ({posts.length})
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#7a7888' }}>
          All schedule times are set and displayed in EST.
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 14, color: '#7a7888', fontSize: 13 }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div style={{ padding: 16, color: '#7a7888', fontSize: 13 }}>No scheduled posts yet.</div>
      ) : (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nextUp && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(184,144,106,0.14) 0%, rgba(184,144,106,0.03) 100%)',
              border: '1px solid rgba(184,144,106,0.25)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 12, color: '#7a7888' }}>
                Next to publish: <strong style={{ color: '#18181a' }}>{nextUp.title}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#9a3412', fontWeight: 600 }}>
                {formatCountdown(nextUp.publish_at)} · {formatDateEST(nextUp.publish_at)}
              </div>
            </div>
          )}

          {posts.map(post => (
            <article
              key={post.id}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                padding: '11px 12px',
                background: '#fcfbf9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#18181a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.title}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#7a7888', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>{post.category || 'Digital Marketing'}</span>
                    <span>•</span>
                    <span>{formatDateEST(post.publish_at)}</span>
                    <span>•</span>
                    <span>{formatCountdown(post.publish_at)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', padding: '3px 9px', borderRadius: 100 }}>
                    Queued
                  </span>
                  <button style={ghostBtn} onClick={() => onEdit(post)}>Edit</button>
                  <button style={ghostBtn} onClick={() => onDelete(post.id)}>Delete</button>
                  <button style={{ ...darkBtn, background: '#0f766e' }} onClick={() => onPublishNow(post)}>
                    Publish now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleComposer({ value, onChange, error }) {
  const nowNy = getDatePartsInTimeZone(new Date(), NEW_YORK_TZ)
  const years = Array.from({ length: 4 }, (_, i) => nowNy.year + i)
  const daysInMonth = getDaysInMonth(Number(value.year), Number(value.month))
  const selectedHour24 = toHour24(value.hour, value.ampm)
  const selectedIsToday =
    Number(value.year) === nowNy.year &&
    Number(value.month) === nowNy.month &&
    Number(value.day) === nowNy.day

  const schedulePreview = buildIsoFromNyDraft(value)

  function setPart(patch) {
    onChange(prev => {
      const next = { ...prev, ...patch }
      const maxDay = getDaysInMonth(Number(next.year), Number(next.month))
      if (Number(next.day) > maxDay) next.day = maxDay
      return next
    })
  }

  return (
    <div style={{ border: '1px solid rgba(184,144,106,0.28)', borderRadius: 12, background: 'rgba(255,255,255,0.76)', padding: 12 }}>
      <div style={{ fontSize: 12, color: '#7a7888', marginBottom: 10 }}>
        Schedule in <strong style={{ color: '#18181a' }}>EST</strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.9fr', gap: 8 }}>
        <select value={value.month} onChange={e => setPart({ month: Number(e.target.value) })} style={selectInp}>
          {MONTH_NAMES.map((label, i) => {
            const month = i + 1
            const disabled = Number(value.year) === nowNy.year && month < nowNy.month
            return (
              <option key={label} value={month} disabled={disabled}>{label}</option>
            )
          })}
        </select>
        <select value={value.day} onChange={e => setPart({ day: Number(e.target.value) })} style={selectInp}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const disabled =
              Number(value.year) === nowNy.year &&
              Number(value.month) === nowNy.month &&
              day < nowNy.day
            return (
              <option key={day} value={day} disabled={disabled}>{day}</option>
            )
          })}
        </select>
        <select value={value.year} onChange={e => setPart({ year: Number(e.target.value) })} style={selectInp}>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 8, marginTop: 8 }}>
        <select value={value.hour} onChange={e => setPart({ hour: Number(e.target.value) })} style={selectInp}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => {
            const hour24 = toHour24(hour, value.ampm)
            const disabled = selectedIsToday && hour24 < nowNy.hour24
            return (
              <option key={hour} value={hour} disabled={disabled}>{hour}</option>
            )
          })}
        </select>
        <select value={value.minute} onChange={e => setPart({ minute: e.target.value })} style={selectInp}>
          {MINUTE_OPTIONS.map(minute => {
            const disabled = selectedIsToday && selectedHour24 === nowNy.hour24 && Number(minute) <= nowNy.minute
            return (
              <option key={minute} value={minute} disabled={disabled}>{minute}</option>
            )
          })}
        </select>
        <select value={value.ampm} onChange={e => setPart({ ampm: e.target.value })} style={selectInp}>
          {['AM', 'PM'].map(period => <option key={period} value={period}>{period}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: error ? '#b91c1c' : '#0f766e', fontWeight: 500 }}>
        {error
          ? error
          : `Will publish: ${formatDateEST(schedulePreview.iso)}`}
      </div>
    </div>
  )
}

const selectInp = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 13,
  color: '#18181a',
  background: '#fff',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage:
    'linear-gradient(45deg, transparent 50%, #7a7888 50%), linear-gradient(135deg, #7a7888 50%, transparent 50%)',
  backgroundPosition: 'calc(100% - 14px) calc(1em + 1px), calc(100% - 9px) calc(1em + 1px)',
  backgroundSize: '5px 5px, 5px 5px',
  backgroundRepeat: 'no-repeat',
  paddingRight: 30,
}

const inp = {
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 13,
  color: '#18181a',
  background: '#faf9f7',
  outline: 'none',
  width: '100%',
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
