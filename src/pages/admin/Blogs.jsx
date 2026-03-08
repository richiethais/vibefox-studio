import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Digital Marketing',
  read_time: '6 min read',
  keywords: '',
  content: '',
  cover_image_url: '',
}

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
  }
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

  const draftPosts = useMemo(() => posts.filter(p => p.status === 'draft'), [posts])
  const publishedPosts = useMemo(() => posts.filter(p => p.status === 'published'), [posts])
  const isEditingPublished = editing?.status === 'published'

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
    setNotice('')
  }

  function beginEdit(post) {
    setEditing(post)
    setForm(postToForm(post))
    if (post.status === 'published') {
      setNotice('Editing live post. Use Post Blog to update it, or Save Draft to create a draft copy.')
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

  function handlePasteImage(e) {
    const item = Array.from(e.clipboardData?.items || []).find(it => it.type?.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (!file) return
    e.preventDefault()
    uploadImage(file)
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
        ...form,
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
      const slug = await ensureUniqueSlug(baseSlug, editing?.id)

      const payload = {
        ...form,
        slug,
        status: 'published',
        published_at: editing?.published_at || nowIso,
        updated_at: nowIso,
      }

      let error
      if (editing?.id) {
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

      setNotice('Blog posted successfully and is now live on the public Blogs page.')
      setEditing(null)
      setForm(emptyForm)
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
    <div style={{ padding: '36px 40px' }} onPaste={handlePasteImage}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp} />
              <input placeholder="Read time (e.g. 6 min read)" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))} style={inp} />
            </div>
            <input placeholder="Keywords" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} style={inp} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
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
            <div style={{ fontSize: 11, color: '#7a7888' }}>Tip: paste an image directly (Cmd/Ctrl + V). It will auto-crop and smooth edges.</div>

            <textarea
              placeholder="Blog content. Separate paragraphs with blank lines."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12}
              style={{ ...inp, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" style={ghostBtn} onClick={beginCreate}>Reset</button>
              <button type="submit" style={darkBtn} disabled={saving || uploading}>
                {saving ? 'Saving…' : (isEditingPublished ? 'Save Draft Copy' : 'Save Draft')}
              </button>
              <button
                type="button"
                style={{ ...darkBtn, background: '#b45309' }}
                onClick={publishCurrent}
                disabled={saving || uploading}
              >
                {saving ? 'Posting…' : (isEditingPublished ? 'Update Live Blog' : 'Post Blog')}
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
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 34, lineHeight: 1.08, color: '#18181a', margin: '8px 0 10px' }}>
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
      )}
    </div>
  )
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
