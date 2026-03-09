# SEO Notes, Calendar & Blog Scheduling — Design

**Date:** 2026-03-08

## Overview

Three new features for the Vibefox Studio admin:

1. **Blog post scheduling** — integrated into the existing Blogs page
2. **SEO Notes & Strategy page** — new dedicated admin page for SEO planning
3. **Calendar page** — new dedicated admin page for scheduling and due dates
4. **Client Notes upgrade** — existing Notes page gets same note types as SEO Notes

---

## 1. Blog Scheduling

### Database Changes

- Add `status` column to `blog_posts`: `'draft' | 'scheduled' | 'published'` (default `'published'`)
- Add `publish_at` timestamp column (nullable)
- Enable `pg_cron` extension in Supabase
- Add cron job (runs every minute):
  ```sql
  UPDATE blog_posts SET status = 'published'
  WHERE status = 'scheduled' AND publish_at <= now()
  ```

### UI Changes (existing Blogs page)

- Post editor gets a "Publish now" / "Schedule for later" toggle
- When "Schedule for later" is selected: date picker + hour + minute inputs appear
- Posts list shows a `Scheduled` badge with the scheduled timestamp for pending posts
- Scheduled posts are filterable in the list
- Scheduled posts are editable — user can change the publish time or cancel scheduling

---

## 2. SEO Notes & Strategy Page

**Route:** `/admin/seo-notes`

### Note Types

| Type | Description |
|------|-------------|
| Quick Note | Short freeform text, like a sticky note |
| Strategy Doc | Structured doc with title, multiple heading+body sections |

### Features

- Card grid layout
- Pinned notes float to the top in a highlighted "Pinned" section
- Filter tabs: All | Pinned | Quick Notes | Strategy Docs
- Each card shows: title, snippet, type badge, date, pin toggle, edit button, delete button
- Clicking a card or edit opens a full-screen editor/viewer

### Strategy Doc Editor

- Title field
- Dynamic sections — each section has a heading + body textarea
- Add / remove / reorder sections
- Clean readable preview when not editing

### Database

New table: `seo_notes`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| type | text | `quick` or `strategy` |
| pinned | boolean | default false |
| content | jsonb | plain string for quick notes; array of `{heading, body}` for strategy docs |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 3. Client Notes Upgrade

The existing Notes page is renamed to "Client Notes". It receives the same note type system as SEO Notes (Quick Note, Strategy Doc, pinning, section editor), while keeping the existing `related_type` (client/project) association.

### Database Changes

- Add `type` column to `notes`: `'quick' | 'strategy'` (default `'quick'`)
- Add `pinned` boolean column (default false)
- Migrate existing `body` (text) → `content` (jsonb), wrapping existing strings as quick note format

---

## 4. Calendar Page

**Route:** `/admin/calendar`

### Views

- Month, Week, Day — switchable via button group at top

### Event Types (color-coded)

| Type | Color |
|------|-------|
| SEO | Purple |
| Blog Post | Blue |
| Project Due Date | Orange |
| General | Gray |

### Features

- Click any day/slot to open "New Event" modal
- Click existing event to edit or delete
- Events are editable: title, type, date, time, notes
- Blog Post events can optionally link to a scheduled blog post (`blog_post_id`)

### Views Detail

- **Month:** dots/chips on each day showing event titles
- **Week:** time-based column grid with event blocks
- **Day:** full time-slot list for that day

### Database

New table: `calendar_events`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| type | text | `seo`, `blog`, `project`, `general` |
| event_date | date | |
| event_time | time | nullable |
| notes | text | nullable |
| blog_post_id | uuid | nullable FK → blog_posts.id |
| created_at | timestamptz | |

---

## Implementation Order

1. Database migrations (blog_posts changes, seo_notes, calendar_events, notes changes)
2. pg_cron scheduling job
3. Blog scheduling UI
4. Client Notes upgrade
5. SEO Notes page
6. Calendar page
