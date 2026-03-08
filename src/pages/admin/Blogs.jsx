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

export default function AdminBlogs() {
  const [params] = useSearchParams()
  const previewId = params.get('preview')

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')

  const isSavedEditing = Boolean(editing?.id)
  const isPublishedEditing = editing?.status === 'published'
  const isLockedEditing = isSavedEditing

  const selectedPreview = useMemo(() => {
    if (previewId) return posts.find(p => String(p.id) === String(previewId)) || null
    return editing
  }, [posts, previewId, editing])

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? [])
        setLoading(false)
      })
  }, [])

  function beginCreate() {
    setEditing(null)
    setForm(emptyForm)
    setNotice('')
  }

  function beginEdit(post) {
    setEditing(post)
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      category: post.category || 'Digital Marketing',
      read_time: post.read_time || '6 min read',
      keywords: post.keywords || '',
      content: post.content || '',
      cover_image_url: post.cover_image_url || '',
    })
    if (post.status === 'published') {
      setNotice('This blog is already published and locked from editing.')
      return
    }
    setNotice('Saved drafts are locked from editing. You can publish or delete this draft.')
  }

  async function uploadImage(file) {
    if (!file || isLockedEditing) return
    setUploading(true)
    setNotice('')

    const path = `blog-images/${Date.now()}-${slugify(file.name)}`
    const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true })
    if (error) {
      setUploading(false)
      setNotice(`Image upload failed: ${error.message}`)
      return
    }

    const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
    setForm(f => ({ ...f, cover_image_url: data.publicUrl }))
    setUploading(false)
    setNotice('Image uploaded.')
  }

  async function saveDraft(e) {
    e.preventDefault()
    if (isLockedEditing) {
      setNotice('Saved blogs are locked from editing. Create a new blog if you need changes.')
      return
    }

    setSaving(true)
    setNotice('')

    const nowIso = new Date().toISOString()
    const slug = form.slug || slugify(form.title)
    const payload = {
      ...form,
      slug,
      status: 'draft',
      updated_at: nowIso,
      published_at: null,
    }

    let error
    if (editing?.id) {
      ;({ error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('blog_posts').insert({ ...payload, created_at: nowIso }))
    }

    setSaving(false)
    if (error) {
      setNotice(`Save failed: ${error.message}`)
      return
    }

    setNotice('Draft saved.')
    setEditing(null)
    setForm(emptyForm)
    await load()
  }

  async function publishCurrent() {
    if (isPublishedEditing) {
      setNotice('This blog is already published.')
      return
    }

    if (!form.title || !form.excerpt || !form.content) {
      setNotice('Title, excerpt, and content are required before posting.')
      return
    }

    setSaving(true)
    setNotice('')

    const nowIso = new Date().toISOString()
    const slug = form.slug || slugify(form.title)
    const payload = {
      ...form,
      slug,
      status: 'published',
      published_at: nowIso,
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
      setNotice(`Publish failed: ${error.message}`)
      return
    }

    setNotice('Blog posted successfully.')
    setEditing(null)
    setForm(emptyForm)
    await load()
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
      setNotice(`Publish failed: ${error.message}`)
      return
    }

    setNotice(`Posted: ${post.title}`)
    await load()
  }

  async function remove(id) {
    const ok = window.confirm('Delete this blog post?')
    if (!ok) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) {
      setNotice(`Delete failed: ${error.message}`)
      return
    }
    setNotice('Blog deleted.')
    await load()
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', margin: 0, letterSpacing: '-0.4px' }}>Blogs</h1>
        <button onClick={beginCreate} style={darkBtn}>+ New blog</button>
      </div>

      {notice && (
        <div style={{ background: '#f8f6f2', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#3a3840', fontSize: 13 }}>
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 600, color: '#18181a' }}>Posts</div>
          {loading ? (
            <div style={{ padding: 14, color: '#7a7888', fontSize: 13 }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  {['Title', 'Status', 'Updated', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: '#18181a', fontWeight: 500 }}>{post.title}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ ...badge, background: post.status === 'published' ? '#dcfce7' : '#fef3c7', color: post.status === 'published' ? '#16a34a' : '#d97706' }}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#7a7888' }}>{formatDate(post.updated_at)}</td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button style={ghostBtn} onClick={() => beginEdit(post)}>View</button>
                      <button
                        style={{ ...ghostBtn, opacity: post.status === 'published' ? 0.5 : 1, cursor: post.status === 'published' ? 'default' : 'pointer' }}
                        onClick={() => publishFromRow(post)}
                        disabled={post.status === 'published'}
                      >
                        {post.status === 'published' ? 'Published' : 'Post blog'}
                      </button>
                      <button style={ghostBtn} onClick={() => remove(post.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 14, color: '#7a7888' }}>No blog posts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 600, color: '#18181a' }}>
            {editing ? `${isPublishedEditing ? 'Published' : 'Saved draft'} (locked)` : 'Create blog'}
          </div>
          <form onSubmit={saveDraft} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} required style={inp} readOnly={isLockedEditing} />
            <input placeholder="Slug *" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} required style={inp} readOnly={isLockedEditing} />
            <input placeholder="Excerpt *" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} required style={inp} readOnly={isLockedEditing} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp} readOnly={isLockedEditing} />
              <input placeholder="Read time (e.g. 6 min read)" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))} style={inp} readOnly={isLockedEditing} />
            </div>
            <input placeholder="Keywords" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} style={inp} readOnly={isLockedEditing} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
              <input placeholder="Cover image URL" value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} style={inp} readOnly={isLockedEditing} />
              <label style={{ ...ghostBtn, padding: '9px 12px', display: 'inline-flex', alignItems: 'center', cursor: isLockedEditing ? 'default' : 'pointer', opacity: isLockedEditing ? 0.5 : 1 }}>
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => uploadImage(e.target.files?.[0])}
                  style={{ display: 'none' }}
                  disabled={uploading || isLockedEditing}
                />
              </label>
            </div>

            <textarea
              placeholder="Blog content. Separate paragraphs with blank lines."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12}
              style={{ ...inp, resize: 'vertical' }}
              readOnly={isLockedEditing}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" style={ghostBtn} onClick={beginCreate}>Reset</button>
              <button type="submit" style={darkBtn} disabled={saving || isLockedEditing}>{saving ? 'Saving…' : 'Save Draft'}</button>
              <button
                type="button"
                style={{ ...darkBtn, background: '#b45309', opacity: isPublishedEditing ? 0.5 : 1, cursor: isPublishedEditing ? 'default' : 'pointer' }}
                onClick={publishCurrent}
                disabled={saving || isPublishedEditing}
              >
                {isPublishedEditing ? 'Already Published' : 'Post Blog'}
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
                minHeight: 380,
                maxHeight: 620,
                background: '#f8f6f2',
                borderRadius: 12,
                marginBottom: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
              }}>
                <img
                  src={form.cover_image_url || selectedPreview?.cover_image_url}
                  alt="Blog cover"
                  style={{ width: '100%', height: '100%', maxHeight: 580, objectFit: 'contain', borderRadius: 10 }}
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

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
