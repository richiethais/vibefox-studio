# SEO Notes, Calendar & Blog Scheduling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add blog post scheduling (pg_cron), an SEO Notes & Strategy admin page, an upgraded Client Notes page, and a Calendar admin page.

**Architecture:** Supabase pg_cron handles automatic publishing of scheduled blog posts. Three new admin pages follow the project's existing inline-style React pattern (no CSS modules, Tailwind only on marketing pages). All data lives in Supabase with new tables and migrations to existing ones.

**Tech Stack:** React 19, React Router 7, Supabase JS v2, Vite, inline styles (admin UI pattern)

---

## Codebase Conventions

- Admin pages live in `src/pages/admin/`
- All admin UI uses **inline styles** — no Tailwind classes
- Common style vars: `inp`, `darkBtn`, `ghostBtn`, `overlay`, `modalBox` — define at bottom of each file, copy pattern from `Notes.jsx`
- `supabase` client imported from `../../lib/supabase`
- `useIsMobile(768)` hook from `../../components/useIsMobile`
- Routes added in `src/main.jsx`
- Nav items added in `src/components/admin/AdminLayout.jsx`

---

## Task 1: Database — blog_posts scheduling columns

**Files:**
- Create: `supabase/migrations/001_blog_scheduling.sql`

**Step 1: Write the migration SQL**

```sql
-- supabase/migrations/001_blog_scheduling.sql
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS publish_at timestamptz;

-- Backfill: existing posts are published
UPDATE blog_posts SET status = 'published' WHERE status IS NULL OR status = '';

-- Index for the cron query
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled
  ON blog_posts (status, publish_at)
  WHERE status = 'scheduled';
```

**Step 2: Run in Supabase SQL Editor**

Go to Supabase Dashboard → SQL Editor, paste and run. Verify with:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'blog_posts' AND column_name IN ('status', 'publish_at');
```
Expected: two rows returned.

**Step 3: Commit**

```bash
git add supabase/migrations/001_blog_scheduling.sql
git commit -m "feat: add status and publish_at columns to blog_posts"
```

---

## Task 2: Database — enable pg_cron and add scheduling job

**Files:**
- Create: `supabase/migrations/002_blog_cron_job.sql`

**Step 1: Write the migration SQL**

```sql
-- supabase/migrations/002_blog_cron_job.sql

-- Enable pg_cron extension (requires superuser; run in Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job: every minute, publish due posts
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
    UPDATE blog_posts
    SET status = 'published', published_at = now()
    WHERE status = 'scheduled' AND publish_at <= now()
  $$
);
```

**Step 2: Run in Supabase SQL Editor**

Note: pg_cron must be enabled in Supabase Dashboard under Database → Extensions first. Enable "pg_cron" there, then run the SQL.

Verify:
```sql
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'publish-scheduled-posts';
```
Expected: one row.

**Step 3: Commit**

```bash
git add supabase/migrations/002_blog_cron_job.sql
git commit -m "feat: add pg_cron job to auto-publish scheduled blog posts"
```

---

## Task 3: Database — seo_notes table

**Files:**
- Create: `supabase/migrations/003_seo_notes.sql`

**Step 1: Write migration**

```sql
-- supabase/migrations/003_seo_notes.sql
CREATE TABLE IF NOT EXISTS seo_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'quick',  -- 'quick' | 'strategy'
  pinned boolean NOT NULL DEFAULT false,
  content jsonb NOT NULL DEFAULT '""',
  -- For quick notes: content = "plain string"
  -- For strategy docs: content = [{"heading": "...", "body": "..."}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_notes_pinned ON seo_notes (pinned, created_at DESC);
```

**Step 2: Run in Supabase SQL Editor, verify:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'seo_notes';
```

**Step 3: Commit**

```bash
git add supabase/migrations/003_seo_notes.sql
git commit -m "feat: add seo_notes table"
```

---

## Task 4: Database — upgrade notes table & calendar_events table

**Files:**
- Create: `supabase/migrations/004_notes_upgrade_and_calendar.sql`

**Step 1: Write migration**

```sql
-- supabase/migrations/004_notes_upgrade_and_calendar.sql

-- Upgrade existing notes table
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'quick',
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content jsonb;

-- Migrate existing body text → content jsonb
UPDATE notes SET content = to_jsonb(body) WHERE content IS NULL AND body IS NOT NULL;

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'general',  -- 'seo' | 'blog' | 'project' | 'general'
  event_date date NOT NULL,
  event_time time,
  notes text,
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (event_date);
```

**Step 2: Run in Supabase SQL Editor, verify:**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'notes' AND column_name IN ('type','pinned','content');
SELECT table_name FROM information_schema.tables WHERE table_name = 'calendar_events';
```

**Step 3: Commit**

```bash
git add supabase/migrations/004_notes_upgrade_and_calendar.sql
git commit -m "feat: upgrade notes table and add calendar_events table"
```

---

## Task 5: Blog scheduling UI — add scheduling to Blogs.jsx

**Files:**
- Modify: `src/pages/admin/Blogs.jsx`

**Step 1: Extend `emptyForm` to include scheduling fields**

Find `const emptyForm = {` and add two fields:
```js
const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Digital Marketing',
  read_time: '6 min read',
  keywords: '',
  content: '',
  cover_image_url: '',
  // NEW
  scheduleMode: 'now',   // 'now' | 'schedule'
  publish_at: '',        // ISO datetime string when scheduleMode === 'schedule'
}
```

**Step 2: Update `postToForm` to preserve scheduling state**

```js
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
    publish_at: post.publish_at ? post.publish_at.slice(0, 16) : '',
  }
}
```

**Step 3: Update `publishCurrent` function**

Find the `publishCurrent` function. Replace its `supabase.from('blog_posts').update(...)` call so it respects the schedule mode:

```js
async function publishCurrent(e) {
  e.preventDefault()
  if (!form.title || saving) return
  setSaving(true)
  const isScheduled = form.scheduleMode === 'schedule' && form.publish_at
  const payload = {
    ...formToPost(form),
    status: isScheduled ? 'scheduled' : 'published',
    publish_at: isScheduled ? new Date(form.publish_at).toISOString() : null,
    published_at: isScheduled ? null : new Date().toISOString(),
  }
  if (editing) {
    await supabase.from('blog_posts').update(payload).eq('id', editing.id)
  } else {
    await supabase.from('blog_posts').insert(payload)
  }
  setSaving(false)
  beginCreate()
  await load()
}
```

You will need a helper `formToPost` that strips `scheduleMode` and `publish_at` from the form before saving to the database:
```js
function formToPost(f) {
  const { scheduleMode, publish_at, ...rest } = f
  return rest
}
```

**Step 4: Add scheduling UI inside the `<form>`**

Add this block just above the action buttons row (the `div` with `justifyContent: 'flex-end'`):

```jsx
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
        onChange={() => setForm(f => ({ ...f, scheduleMode: 'schedule' }))}
      />
      Schedule for later
    </label>
  </div>
  {form.scheduleMode === 'schedule' && (
    <input
      type="datetime-local"
      value={form.publish_at}
      onChange={e => setForm(f => ({ ...f, publish_at: e.target.value }))}
      min={new Date().toISOString().slice(0, 16)}
      style={inp}
    />
  )}
</div>
```

**Step 5: Update the posts list to show scheduled posts**

In the `load` function, fetch scheduled posts separately (or filter from all posts). Update `PostTable` render to show a status badge:

In the `PostTable` component, add a status column. Update the `renderActions` call for published posts to also show a `Scheduled` badge when `post.status === 'scheduled'`.

Add a third table section for scheduled posts. After the existing two `PostTable` components add:

```jsx
<PostTable
  title="Scheduled"
  posts={posts.filter(p => p.status === 'scheduled')}
  loading={loading}
  emptyText="No scheduled posts."
  renderActions={post => (
    <>
      <span style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 100 }}>
        {post.publish_at ? new Date(post.publish_at).toLocaleString() : 'Scheduled'}
      </span>
      <button style={ghostBtn} onClick={() => beginEdit(post)}>Edit</button>
      <button style={ghostBtn} onClick={() => remove(post.id)}>Delete</button>
    </>
  )}
/>
```

Also update the existing published posts filter:
```js
posts.filter(p => p.status === 'published' || !p.status)
```

**Step 6: Verify manually**

Run `npm run dev`, open `/admin/blogs`, create a post with "Schedule for later", pick a future time, click "Post Blog". Verify it appears in the Scheduled table with the time shown.

**Step 7: Commit**

```bash
git add src/pages/admin/Blogs.jsx
git commit -m "feat: add blog post scheduling UI with publish_at datetime picker"
```

---

## Task 6: Upgrade Client Notes page

**Files:**
- Modify: `src/pages/admin/Notes.jsx`

**Step 1: Replace the entire Notes.jsx**

The new version adds: note types (quick/strategy), pinning, section-based strategy doc editor, filter tabs. Keep the existing client/project association.

```jsx
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const emptyForm = {
  related_type: 'client',
  related_id: '',
  type: 'quick',
  title: '',
  pinned: false,
  content: '',           // quick note: plain string
  sections: [{ heading: '', body: '' }],  // strategy doc sections
}

export default function AdminNotes() {
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')  // 'all' | 'pinned' | 'quick' | 'strategy'
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
      body: isStrategy ? '' : form.content,  // keep legacy body col populated
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

  const setF = k => e => setForm(f => ({ ...f, [k]: typeof e === 'boolean' ? e : e.target.value }))

  function updateSection(idx, key, val) {
    setForm(f => {
      const sections = [...f.sections]
      sections[idx] = { ...sections[idx], [key]: val }
      return { ...f, sections }
    })
  }

  function addSection() {
    setForm(f => ({ ...f, sections: [...f.sections, { heading: '', body: '' }] }))
  }

  function removeSection(idx) {
    setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }))
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pinned', 'quick', 'strategy'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...ghostBtn,
            background: filter === f ? '#18181a' : 'white',
            color: filter === f ? 'white' : '#18181a',
            textTransform: 'capitalize',
          }}>
            {f === 'all' ? 'All' : f === 'quick' ? 'Quick Notes' : f === 'strategy' ? 'Strategy Docs' : 'Pinned'}
          </button>
        ))}
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Pinned</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pinned.map(n => <NoteCard key={n.id} note={n} onPin={togglePin} onEdit={openEdit} onDelete={del} snippet={getSnippet(n)} />)}
          </div>
        </div>
      )}

      {/* All / unpinned */}
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

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['quick', 'strategy'].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...ghostBtn, flex: 1, background: form.type === t ? '#18181a' : 'white', color: form.type === t ? 'white' : '#18181a' }}
                  >
                    {t === 'quick' ? 'Quick Note' : 'Strategy Doc'}
                  </button>
                ))}
              </div>

              <input placeholder="Title" value={form.title} onChange={setF('title')} style={inp} />

              <select value={form.related_type} onChange={e => setForm(f => ({ ...f, related_type: e.target.value, related_id: '' }))} style={inp}>
                <option value="client">Client</option>
                <option value="project">Project</option>
              </select>
              <select value={form.related_id} onChange={setF('related_id')} style={inp}>
                <option value="">Select {form.related_type}</option>
                {relatedOptions.map(o => <option key={o.id} value={o.id}>{o.name || o.title}</option>)}
              </select>

              {/* Quick note body */}
              {form.type === 'quick' && (
                <textarea placeholder="Note *" value={form.content} onChange={setF('content')} rows={5} style={{ ...inp, resize: 'vertical' }} />
              )}

              {/* Strategy doc sections */}
              {form.type === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {form.sections.map((s, idx) => (
                    <div key={idx} style={{ background: '#f5f3f0', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section {idx + 1}</span>
                        {form.sections.length > 1 && (
                          <button type="button" onClick={() => removeSection(idx)} style={{ background: 'none', border: 'none', color: '#7a7888', cursor: 'pointer', fontSize: 14 }}>×</button>
                        )}
                      </div>
                      <input placeholder="Heading" value={s.heading} onChange={e => updateSection(idx, 'heading', e.target.value)} style={{ ...inp, marginBottom: 8 }} />
                      <textarea placeholder="Body" value={s.body} onChange={e => updateSection(idx, 'body', e.target.value)} rows={4} style={{ ...inp, resize: 'vertical' }} />
                    </div>
                  ))}
                  <button type="button" onClick={addSection} style={ghostBtn}>+ Add section</button>
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
    <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: note.pinned ? '1px solid #fde68a' : '1px solid rgba(0,0,0,0.07)', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: typeBadgeColor, textTransform: 'uppercase', letterSpacing: '0.5px', background: typeBadgeColor + '18', padding: '2px 7px', borderRadius: 100 }}>
          {note.type === 'strategy' ? 'Strategy' : 'Quick'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
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
```

**Step 2: Update nav label in AdminLayout**

In `src/components/admin/AdminLayout.jsx`, find:
```js
{ to: '/admin/notes', label: 'Notes' },
```
Change to:
```js
{ to: '/admin/notes', label: 'Client Notes' },
```

**Step 3: Verify manually**

Open `/admin/notes`, create a Quick Note and a Strategy Doc with sections, pin one, filter tabs.

**Step 4: Commit**

```bash
git add src/pages/admin/Notes.jsx src/components/admin/AdminLayout.jsx
git commit -m "feat: upgrade Client Notes with quick/strategy types, pinning, sections"
```

---

## Task 7: SEO Notes page

**Files:**
- Create: `src/pages/admin/SeoNotes.jsx`
- Modify: `src/main.jsx`
- Modify: `src/components/admin/AdminLayout.jsx`

**Step 1: Create SeoNotes.jsx**

This is identical in structure to the upgraded Notes.jsx but without the client/project relationship, targeting the `seo_notes` table.

```jsx
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useIsMobile from '../../components/useIsMobile'

const emptyForm = {
  type: 'quick',
  title: '',
  pinned: false,
  content: '',
  sections: [{ heading: '', body: '' }],
}

export default function AdminSeoNotes() {
  const [notes, setNotes] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('all')
  const isMobile = useIsMobile(768)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('seo_notes')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm(emptyForm); setModal(true) }

  function openEdit(note) {
    setEditing(note)
    const isStrategy = note.type === 'strategy'
    setForm({
      type: note.type || 'quick',
      title: note.title || '',
      pinned: note.pinned || false,
      content: isStrategy ? '' : (typeof note.content === 'string' ? note.content : ''),
      sections: isStrategy
        ? (Array.isArray(note.content) ? note.content : [{ heading: '', body: '' }])
        : [{ heading: '', body: '' }],
    })
    setModal(true)
  }

  async function save() {
    const isStrategy = form.type === 'strategy'
    const content = isStrategy ? form.sections : form.content
    const payload = { title: form.title, type: form.type, pinned: form.pinned, content, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('seo_notes').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('seo_notes').insert(payload)
    }
    setModal(false); setEditing(null); setForm(emptyForm); await load()
  }

  async function togglePin(note) {
    await supabase.from('seo_notes').update({ pinned: !note.pinned }).eq('id', note.id)
    await load()
  }

  async function del(id) {
    await supabase.from('seo_notes').delete().eq('id', id); await load()
  }

  function updateSection(idx, key, val) {
    setForm(f => { const s = [...f.sections]; s[idx] = { ...s[idx], [key]: val }; return { ...f, sections: s } })
  }

  function getSnippet(note) {
    if (note.type === 'strategy' && Array.isArray(note.content)) return note.content[0]?.body?.slice(0, 100) || note.title
    if (typeof note.content === 'string') return note.content.slice(0, 120)
    return ''
  }

  const filtered = notes.filter(n => {
    if (filter === 'pinned') return n.pinned
    if (filter === 'quick') return n.type !== 'strategy'
    if (filter === 'strategy') return n.type === 'strategy'
    return true
  })
  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>SEO Notes</h1>
        <button onClick={openNew} style={darkBtn}>+ New note</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pinned', 'quick', 'strategy'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...ghostBtn, background: filter === f ? '#18181a' : 'white', color: filter === f ? 'white' : '#18181a' }}>
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
      {filtered.length === 0 && <div style={{ color: '#7a7888', fontSize: 13, marginTop: 20 }}>No SEO notes yet.</div>}

      {modal && (
        <div style={overlay}>
          <div style={{ ...modalBox, padding: isMobile ? 20 : 32, margin: isMobile ? 16 : 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>{editing ? 'Edit note' : 'New SEO note'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['quick', 'strategy'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ ...ghostBtn, flex: 1, background: form.type === t ? '#18181a' : 'white', color: form.type === t ? 'white' : '#18181a' }}>
                    {t === 'quick' ? 'Quick Note' : 'Strategy Doc'}
                  </button>
                ))}
              </div>
              <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} />
              {form.type === 'quick' && (
                <textarea placeholder="Note *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} style={{ ...inp, resize: 'vertical' }} />
              )}
              {form.type === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {form.sections.map((s, idx) => (
                    <div key={idx} style={{ background: '#f5f3f0', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section {idx + 1}</span>
                        {form.sections.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: '#7a7888', cursor: 'pointer', fontSize: 14 }}>×</button>}
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
      <div style={{ marginTop: 10, fontSize: 11, color: '#b0adb8' }}>{new Date(note.created_at).toLocaleDateString()}</div>
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
```

**Step 2: Add route in src/main.jsx**

Add import near other admin imports:
```js
import AdminSeoNotes from './pages/admin/SeoNotes.jsx'
```

Add route inside the `/admin` Route group (after the `notes` route):
```jsx
<Route path="seo-notes" element={<AdminSeoNotes />} />
```

**Step 3: Add nav item in AdminLayout.jsx**

Add after the Notes entry:
```js
{ to: '/admin/seo-notes', label: 'SEO Notes' },
```

**Step 4: Verify manually, then commit**

```bash
git add src/pages/admin/SeoNotes.jsx src/main.jsx src/components/admin/AdminLayout.jsx
git commit -m "feat: add SEO Notes admin page with quick notes and strategy docs"
```

---

## Task 8: Calendar page

**Files:**
- Create: `src/pages/admin/Calendar.jsx`
- Modify: `src/main.jsx`
- Modify: `src/components/admin/AdminLayout.jsx`

**Step 1: Create Calendar.jsx**

```jsx
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
  const [view, setView] = useState('month')  // 'month' | 'week' | 'day'
  const [cursor, setCursor] = useState(new Date())  // navigated date
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
    const payload = { title: form.title, type: form.type, event_date: form.event_date, event_time: form.event_time || null, notes: form.notes || null, blog_post_id: form.blog_post_id || null }
    if (editing) {
      await supabase.from('calendar_events').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('calendar_events').insert(payload)
    }
    setModal(false); setEditing(null); setForm(emptyForm); await load()
  }

  async function del(id) {
    await supabase.from('calendar_events').delete().eq('id', id); setModal(false); await load()
  }

  function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function eventsOn(dateStr) {
    return events.filter(e => e.event_date === dateStr)
  }

  // MONTH VIEW
  function getMonthGrid() {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const cells = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
    return cells
  }

  // WEEK VIEW
  function getWeekDays() {
    const start = new Date(cursor)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d })
  }

  // HOURS for week/day view
  const hours = Array.from({ length: 17 }, (_, i) => i + 7) // 7am–11pm

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
          {/* View switcher */}
          <div style={{ display: 'flex', gap: 4, background: '#f5f3f0', borderRadius: 100, padding: 3 }}>
            {['month', 'week', 'day'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: view === v ? 600 : 400, background: view === v ? '#18181a' : 'transparent', color: view === v ? 'white' : '#7a7888' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#18181a', minWidth: 160, textAlign: 'center' }}>{viewTitle()}</span>
          <button onClick={() => navigate(1)} style={navBtn}>›</button>
          <button onClick={() => openNew('')} style={darkBtn}>+ Event</button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            {DAYS.map(d => <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, color: '#7a7888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {getMonthGrid().map((day, idx) => {
              const ds = day ? toDateStr(day) : null
              const dayEvents = ds ? eventsOn(ds) : []
              const isToday = ds === todayStr
              return (
                <div key={idx} onClick={() => day && openNew(ds)} style={{ minHeight: isMobile ? 60 : 90, padding: '8px 6px', borderRight: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: day ? 'pointer' : 'default', background: day ? 'white' : '#faf9f7' }}
                  onMouseEnter={e => { if (day) e.currentTarget.style.background = '#f8f6f2' }}
                  onMouseLeave={e => { if (day) e.currentTarget.style.background = 'white' }}
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
                            <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
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
                  const hStr = String(h).padStart(2, '0') + ':00'
                  const slotEvents = eventsOn(ds).filter(e => e.event_time && e.event_time.startsWith(String(h).padStart(2,'0')))
                  return (
                    <div key={i} onClick={() => openNew(ds)} style={{ borderLeft: '1px solid rgba(0,0,0,0.04)', padding: '2px 4px', cursor: 'pointer' }}>
                      {slotEvents.map(ev => {
                        const c = EVENT_COLORS[ev.type] || EVENT_COLORS.general
                        return (
                          <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
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
                      <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev) }}
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
                {editing && <button onClick={() => del(editing.id)} style={{ ...ghostBtn, color: '#dc2626', borderColor: '#fca5a5' }}>Delete</button>}
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
```

**Step 2: Add route in src/main.jsx**

```js
import AdminCalendar from './pages/admin/Calendar.jsx'
```

Inside the `/admin` Route group:
```jsx
<Route path="calendar" element={<AdminCalendar />} />
```

**Step 3: Add nav item in AdminLayout.jsx**

```js
{ to: '/admin/calendar', label: 'Calendar' },
```

**Step 4: Verify manually**

Open `/admin/calendar`, switch month/week/day views, create events of each type, edit one, delete one.

**Step 5: Commit**

```bash
git add src/pages/admin/Calendar.jsx src/main.jsx src/components/admin/AdminLayout.jsx
git commit -m "feat: add Calendar admin page with month/week/day views and event management"
```

---

## Final: Smoke test checklist

- [ ] Blog: Create a post scheduled 2 minutes from now → it appears in Scheduled table → wait → refreshes as published
- [ ] Blog: Edit a scheduled post's time
- [ ] Client Notes: Create quick note with pin → appears in Pinned section
- [ ] Client Notes: Create strategy doc with 3 sections → sections render in card snippet
- [ ] SEO Notes: Same flow as client notes (no client/project dropdown)
- [ ] Calendar month: Click day → new event modal pre-filled with that date
- [ ] Calendar week: Event appears in correct time slot
- [ ] Calendar day: Edit event → delete event
