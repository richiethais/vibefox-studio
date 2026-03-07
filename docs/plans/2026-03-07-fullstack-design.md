# Vibefox Studio — Full-Stack Design

**Date:** 2026-03-07
**Status:** Approved

---

## Goal

Make the Vibefox Studio marketing site fully functional with a Supabase backend, a password-protected admin panel for managing inquiries/clients/projects/invoices/notes/messages, and a client portal where invited clients can view their projects, invoices, messages, and submit requests.

---

## Architecture

Single React + Vite app with React Router v6. The Supabase JS client handles all auth and data — no separate backend server. Supabase Row Level Security (RLS) enforces data isolation: clients can only access their own records. Two authenticated roles exist: `admin` (you) and `client` (invited via email link generated in the admin panel).

**Tech Stack:** React 19, React Router v6, Supabase JS v2, Vite, Tailwind CSS

---

## Routing

| Path | Who | Description |
|---|---|---|
| `/` | Public | Marketing site (unchanged visually) |
| `/admin/login` | You | Email/password login |
| `/admin/dashboard` | You | Overview stats |
| `/admin/inquiries` | You | Contact form submissions |
| `/admin/clients` | You | Client CRUD + invite link |
| `/admin/projects` | You | Project CRUD |
| `/admin/invoices` | You | Invoice CRUD |
| `/admin/messages` | You | Message clients |
| `/admin/notes` | You | Internal notes |
| `/client/login` | Clients | Email/password login |
| `/client/dashboard` | Clients | Their projects + unpaid invoices |
| `/client/projects` | Clients | Read-only project cards |
| `/client/invoices` | Clients | Their invoices |
| `/client/messages` | Clients | Thread with you |
| `/client/requests` | Clients | Submit a new request |

All `/admin/*` routes wrapped in `AdminRoute` (redirects to `/admin/login` if no session).
All `/client/*` routes wrapped in `ClientRoute` (redirects to `/client/login` if no session).

---

## Database Schema

### `inquiries`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| email | text | |
| company | text | nullable |
| service_type | text | dropdown value |
| budget | text | dropdown value |
| message | text | |
| status | text | new / contacted / converted |
| created_at | timestamptz | default now() |

### `clients`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK → auth.users |
| name | text | |
| email | text | |
| company | text | nullable |
| phone | text | nullable |
| plan | text | starter / growth / pro |
| status | text | active / inactive |
| created_at | timestamptz | default now() |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid | FK → clients |
| title | text | |
| description | text | nullable |
| status | text | proposal / active / complete |
| start_date | date | nullable |
| due_date | date | nullable |
| created_at | timestamptz | default now() |

### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid | FK → clients |
| description | text | |
| amount | numeric | |
| status | text | unpaid / paid / overdue |
| due_date | date | nullable |
| created_at | timestamptz | default now() |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid | FK → clients |
| body | text | |
| from_admin | boolean | true = from you, false = from client |
| created_at | timestamptz | default now() |

### `requests`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| client_id | uuid | FK → clients |
| title | text | |
| description | text | |
| status | text | open / in-progress / done |
| created_at | timestamptz | default now() |

### `notes`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| related_type | text | client / project |
| related_id | uuid | |
| body | text | |
| created_at | timestamptz | default now() |

---

## Row Level Security

- `inquiries` — insert open to public (anon), select/update restricted to admin
- `clients` — admin full access; client can read their own row (user_id = auth.uid())
- `projects` / `invoices` / `messages` / `requests` — client can read/insert their own (via client_id join); admin full access
- `notes` — admin only

Admin is identified by a hardcoded email check in RLS policies (`auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com'`).

---

## Public Contact Form

Replaces all `mailto:` CTA buttons. Added as a new `Contact` section above the footer. Fields:
- Name (text)
- Email (text)
- Company (text, optional)
- Service interest (dropdown: Website, Web App, E-commerce, Retainer, Other)
- Budget range (dropdown: Under $1k, $1k–$3k, $3k–$10k, $10k+)
- Message (textarea)

On submit: inserts into `inquiries` table, shows thank-you state. No page reload.

---

## Admin Panel UI

Dark sidebar layout matching the existing Hero mockup aesthetic (dark `#18181a` sidebar, light content area). Each section has a data table + slide-in or modal form for create/edit.

- **Dashboard** — stat cards: open inquiries, active clients, unpaid invoices, active projects
- **Inquiries** — table with status badge, click to view detail + change status
- **Clients** — table + create/edit form, "Invite Client" button triggers `supabase.auth.admin.inviteUserByEmail()`
- **Projects** — table filterable by client, status dropdown
- **Invoices** — table with amount + status badge, create per client
- **Messages** — per-client thread view, compose and send
- **Notes** — attach to client or project, markdown-friendly textarea

---

## Client Portal UI

Minimal, clean light UI. Read-only where appropriate.

- **Dashboard** — active projects summary + unpaid invoices alert
- **Projects** — cards with status chip
- **Invoices** — list with paid/unpaid/overdue badge
- **Messages** — thread view with reply box
- **Requests** — form: title + description, list of past requests with status

---

## Supabase Config

- Project URL: `https://tgugladadqhpzadqehdzny.supabase.co`
- Auth: Email/Password enabled, Invite emails enabled
- `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
