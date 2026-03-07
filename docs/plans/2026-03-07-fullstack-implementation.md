# Vibefox Studio Full-Stack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Supabase backend, public contact form, admin panel (/admin/*), and client portal (/client/*) to the existing React marketing site.

**Architecture:** Single React + Vite app with React Router v6. Supabase JS client handles all auth and data from the browser. RLS policies enforce that clients only see their own data. Admin is identified by email `richie@vibefoxstudio.com`.

**Tech Stack:** React 19, React Router v6, @supabase/supabase-js v2, Vite, existing Tailwind + inline styles

---

## Task 1: Install dependencies + create .env

**Files:**
- Modify: `package.json` (via npm install)
- Create: `.env`
- Modify: `.gitignore`

**Step 1: Install packages**

```bash
npm install react-router-dom @supabase/supabase-js
```

Expected: installs cleanly with no errors.

**Step 2: Create .env**

Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://tgugladadqhpzadqehdzny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndWdsYWRxaHB6YWRxZWhkem55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjUyMjYsImV4cCI6MjA4ODUwMTIyNn0.mH7Z7YZM-RGYp6uXOYQP8vbJ5lQRPrn-58rsIYdI06Q
VITE_ADMIN_EMAIL=richie@vibefoxstudio.com
```

**Step 3: Ensure .env is in .gitignore**

Open `.gitignore` and confirm `.env` is listed. If not, add it.

**Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "feat: install react-router-dom and supabase-js"
```

---

## Task 2: Supabase client + auth context

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/auth.jsx`

**Step 1: Create Supabase client**

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Step 2: Create auth context**

Create `src/lib/auth.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useIsAdmin(session) {
  return session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL
}
```

**Step 3: Verify in browser**

Start dev server (`npm run dev`), open console. No errors expected.

**Step 4: Commit**

```bash
git add src/lib/supabase.js src/lib/auth.jsx
git commit -m "feat: add supabase client and auth context"
```

---

## Task 3: Apply database migrations in Supabase

Run the following SQL in the Supabase dashboard SQL editor (https://supabase.com/dashboard/project/tgugladadqhpzadqehdzny/sql).

Run each block separately to catch errors.

**Block 1: inquiries**

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  service_type text not null,
  budget text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table inquiries enable row level security;

create policy "public insert" on inquiries
  for insert with check (true);

create policy "admin all" on inquiries
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');
```

**Block 2: clients**

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  email text not null,
  company text,
  phone text,
  plan text not null default 'starter',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table clients enable row level security;

create policy "admin all" on clients
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');

create policy "client read own" on clients
  for select using (auth.uid() = user_id);
```

**Block 3: projects**

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'proposal',
  start_date date,
  due_date date,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "admin all" on projects
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');

create policy "client read own" on projects
  for select using (
    exists (select 1 from clients where clients.id = projects.client_id and clients.user_id = auth.uid())
  );
```

**Block 4: invoices**

```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  description text not null,
  amount numeric not null,
  status text not null default 'unpaid',
  due_date date,
  created_at timestamptz not null default now()
);

alter table invoices enable row level security;

create policy "admin all" on invoices
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');

create policy "client read own" on invoices
  for select using (
    exists (select 1 from clients where clients.id = invoices.client_id and clients.user_id = auth.uid())
  );
```

**Block 5: messages**

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  body text not null,
  from_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "admin all" on messages
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');

create policy "client read own" on messages
  for select using (
    exists (select 1 from clients where clients.id = messages.client_id and clients.user_id = auth.uid())
  );

create policy "client insert own" on messages
  for insert with check (
    from_admin = false and
    exists (select 1 from clients where clients.id = messages.client_id and clients.user_id = auth.uid())
  );
```

**Block 6: requests**

```sql
create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table requests enable row level security;

create policy "admin all" on requests
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');

create policy "client read own" on requests
  for select using (
    exists (select 1 from clients where clients.id = requests.client_id and clients.user_id = auth.uid())
  );

create policy "client insert own" on requests
  for insert with check (
    exists (select 1 from clients where clients.id = requests.client_id and clients.user_id = auth.uid())
  );
```

**Block 7: notes**

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  related_type text not null,
  related_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "admin all" on notes
  for all using (auth.jwt() ->> 'email' = 'richie@vibefoxstudio.com');
```

**Step: Verify**

In Supabase dashboard → Table Editor, confirm all 7 tables exist.

**Step: Commit**

```bash
git add .
git commit -m "docs: add migration SQL to design doc"
```

---

## Task 4: Invite client Edge Function

This function runs server-side with the service role key so the admin can send invite emails.

**Files:**
- Create: `supabase/functions/invite-client/index.ts`

**Step 1: Create function file**

Create `supabase/functions/invite-client/index.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_EMAIL = 'richie@vibefoxstudio.com'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || user?.email !== ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 })
  }

  const { email, name } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ id: data.user.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Step 2: Deploy via Supabase CLI**

If Supabase CLI is installed (`supabase --version`), run:

```bash
supabase functions deploy invite-client --project-ref tgugladadqhpzadqehdzny
```

If CLI is not installed, deploy via the Supabase dashboard → Edge Functions → New Function, paste the code.

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add invite-client edge function"
```

---

## Task 5: React Router setup + route structure

**Files:**
- Modify: `src/main.jsx`
- Create: `src/components/ProtectedRoute.jsx`

**Step 1: Update main.jsx**

Replace `src/main.jsx` entirely:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth'
import App from './App.jsx'
import AdminLogin from './pages/admin/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminInquiries from './pages/admin/Inquiries.jsx'
import AdminClients from './pages/admin/Clients.jsx'
import AdminProjects from './pages/admin/Projects.jsx'
import AdminInvoices from './pages/admin/Invoices.jsx'
import AdminMessages from './pages/admin/Messages.jsx'
import AdminNotes from './pages/admin/Notes.jsx'
import ClientLogin from './pages/client/Login.jsx'
import ClientDashboard from './pages/client/Dashboard.jsx'
import ClientProjects from './pages/client/Projects.jsx'
import ClientInvoices from './pages/client/Invoices.jsx'
import ClientMessages from './pages/client/Messages.jsx'
import ClientRequests from './pages/client/Requests.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import ClientLayout from './components/client/ClientLayout.jsx'
import { AdminRoute, ClientRoute } from './components/ProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="notes" element={<AdminNotes />} />
          </Route>

          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientRoute><ClientLayout /></ClientRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="projects" element={<ClientProjects />} />
            <Route path="invoices" element={<ClientInvoices />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="requests" element={<ClientRequests />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
```

**Step 2: Create ProtectedRoute.jsx**

Create `src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth, useIsAdmin } from '../lib/auth'

export function AdminRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null // still loading
  if (!session || !useIsAdmin(session)) return <Navigate to="/admin/login" replace />
  return children
}

export function ClientRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (!session) return <Navigate to="/client/login" replace />
  return children
}
```

**Step 3: Create placeholder page files so the app compiles**

Create these files as stubs — they'll be replaced in later tasks. Create each with minimal content:

`src/pages/admin/Login.jsx`:
```jsx
export default function AdminLogin() { return <div>Admin Login</div> }
```

`src/pages/admin/Dashboard.jsx`:
```jsx
export default function AdminDashboard() { return <div>Dashboard</div> }
```

`src/pages/admin/Inquiries.jsx`:
```jsx
export default function AdminInquiries() { return <div>Inquiries</div> }
```

`src/pages/admin/Clients.jsx`:
```jsx
export default function AdminClients() { return <div>Clients</div> }
```

`src/pages/admin/Projects.jsx`:
```jsx
export default function AdminProjects() { return <div>Projects</div> }
```

`src/pages/admin/Invoices.jsx`:
```jsx
export default function AdminInvoices() { return <div>Invoices</div> }
```

`src/pages/admin/Messages.jsx`:
```jsx
export default function AdminMessages() { return <div>Messages</div> }
```

`src/pages/admin/Notes.jsx`:
```jsx
export default function AdminNotes() { return <div>Notes</div> }
```

`src/pages/client/Login.jsx`:
```jsx
export default function ClientLogin() { return <div>Client Login</div> }
```

`src/pages/client/Dashboard.jsx`:
```jsx
export default function ClientDashboard() { return <div>Client Dashboard</div> }
```

`src/pages/client/Projects.jsx`:
```jsx
export default function ClientProjects() { return <div>Projects</div> }
```

`src/pages/client/Invoices.jsx`:
```jsx
export default function ClientInvoices() { return <div>Invoices</div> }
```

`src/pages/client/Messages.jsx`:
```jsx
export default function ClientMessages() { return <div>Messages</div> }
```

`src/pages/client/Requests.jsx`:
```jsx
export default function ClientRequests() { return <div>Requests</div> }
```

`src/components/admin/AdminLayout.jsx`:
```jsx
import { Outlet } from 'react-router-dom'
export default function AdminLayout() { return <Outlet /> }
```

`src/components/client/ClientLayout.jsx`:
```jsx
import { Outlet } from 'react-router-dom'
export default function ClientLayout() { return <Outlet /> }
```

**Step 4: Verify**

Run `npm run dev`. Visit `http://localhost:5173/` — marketing site loads. Visit `/admin/login` — shows "Admin Login". No console errors.

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add React Router with admin and client route structure"
```

---

## Task 6: Admin login page

**Files:**
- Modify: `src/pages/admin/Login.jsx`

Replace with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/admin/dashboard')
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 24, color: '#18181a', marginBottom: 6 }}>
          Vibefox <span style={{ color: '#b8906a' }}>Studio</span>
        </div>
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Admin panel</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14, color: '#18181a', outline: 'none', width: '100%', boxSizing: 'border-box',
  background: '#faf9f7',
}

const btnStyle = {
  padding: '13px', borderRadius: 10, border: 'none', background: '#18181a',
  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
}
```

**Step: Verify**

Visit `/admin/login`. Form renders. Try wrong credentials — shows error. Try correct credentials — redirects to `/admin/dashboard`.

**Step: Commit**

```bash
git add src/pages/admin/Login.jsx
git commit -m "feat: admin login page with Supabase auth"
```

---

## Task 7: Client login page

**Files:**
- Modify: `src/pages/client/Login.jsx`

Replace with:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ClientLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/client/dashboard')
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3f0' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 24, color: '#18181a', marginBottom: 6 }}>
          Vibefox <span style={{ color: '#b8906a' }}>Studio</span>
        </div>
        <p style={{ fontSize: 13, color: '#7a7888', marginBottom: 32 }}>Client portal</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#7a7888', textAlign: 'center', marginTop: 20 }}>
          Access is by invitation only.
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)',
  fontSize: 14, color: '#18181a', outline: 'none', width: '100%', boxSizing: 'border-box',
  background: '#faf9f7',
}

const btnStyle = {
  padding: '13px', borderRadius: 10, border: 'none', background: '#18181a',
  color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
}
```

**Step: Commit**

```bash
git add src/pages/client/Login.jsx
git commit -m "feat: client login page"
```

---

## Task 8: Admin layout with sidebar

**Files:**
- Modify: `src/components/admin/AdminLayout.jsx`

Replace with:

```jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/inquiries', label: 'Inquiries' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/notes', label: 'Notes' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100svh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: 200, background: '#18181a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 15, color: 'rgba(255,255,255,0.88)' }}>
            Vibefox <span style={{ color: '#b8906a' }}>Studio</span>
          </span>
        </div>

        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                fontSize: 13, textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)',
              })}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          style={{ margin: 12, padding: '9px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', fontSize: 12, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, background: '#f8f6f2', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
```

**Step: Verify**

Sign in at `/admin/login`. Admin layout renders with dark sidebar. Nav links highlight on click.

**Step: Commit**

```bash
git add src/components/admin/AdminLayout.jsx
git commit -m "feat: admin sidebar layout"
```

---

## Task 9: Client layout

**Files:**
- Modify: `src/components/client/ClientLayout.jsx`

Replace with:

```jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navItems = [
  { to: '/client/dashboard', label: 'Dashboard' },
  { to: '/client/projects', label: 'Projects' },
  { to: '/client/invoices', label: 'Invoices' },
  { to: '/client/messages', label: 'Messages' },
  { to: '/client/requests', label: 'Requests' },
]

export default function ClientLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/client/login')
  }

  return (
    <div style={{ minHeight: '100svh', fontFamily: 'system-ui, sans-serif', background: '#f8f6f2' }}>
      <header style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 17, color: '#18181a' }}>
          Vibefox <span style={{ color: '#b8906a' }}>Studio</span>
        </span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: '6px 14px', borderRadius: 100, fontSize: 13, textDecoration: 'none',
                color: isActive ? '#18181a' : '#7a7888',
                background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={signOut}
          style={{ padding: '7px 16px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', fontSize: 13, color: '#7a7888', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
        <Outlet />
      </div>
    </div>
  )
}
```

**Step: Commit**

```bash
git add src/components/client/ClientLayout.jsx
git commit -m "feat: client portal layout"
```

---

## Task 10: Public contact form

**Files:**
- Create: `src/components/Contact.jsx`

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useFadeUp } from './useFadeUp'

const services = ['Landing Page', 'Business Website', 'Custom Web App', 'E-commerce', 'Retainer', 'Other']
const budgets = ['Under $1,000', '$1,000–$3,000', '$3,000–$10,000', '$10,000+']

export default function Contact() {
  const ref = useFadeUp()
  const [form, setForm] = useState({ name: '', email: '', company: '', service_type: '', budget: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('inquiries').insert(form)
    if (error) { setError('Something went wrong. Please email us directly.'); setLoading(false) }
    else { setDone(true); setLoading(false) }
  }

  return (
    <section id="contact" ref={ref} style={{ padding: '96px 40px', background: '#faf9f7' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="fade-up d1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#b8906a', marginBottom: 14 }}>
          Get in touch
        </div>
        <h2 className="fade-up d2" style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.08, color: '#18181a', letterSpacing: '-1.2px', margin: '0 0 14px' }}>
          Start a project
        </h2>
        <p className="fade-up d3" style={{ fontSize: 16, color: '#7a7888', marginBottom: 40, fontWeight: 300, lineHeight: 1.6 }}>
          Tell us what you need and we'll be in touch within 24 hours.
        </p>

        {done ? (
          <div className="fade-up" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#15803d', marginBottom: 6 }}>Message sent!</div>
            <div style={{ fontSize: 14, color: '#16a34a' }}>We'll get back to you within 24 hours.</div>
          </div>
        ) : (
          <form className="fade-up d4" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <input placeholder="Your name *" value={form.name} onChange={set('name')} required style={inp} />
              <input placeholder="Email address *" type="email" value={form.email} onChange={set('email')} required style={inp} />
            </div>
            <input placeholder="Company (optional)" value={form.company} onChange={set('company')} style={inp} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <select value={form.service_type} onChange={set('service_type')} required style={inp}>
                <option value="">Service interest *</option>
                {services.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={form.budget} onChange={set('budget')} required style={inp}>
                <option value="">Budget range *</option>
                {budgets.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <textarea
              placeholder="Tell us about your project *"
              value={form.message}
              onChange={set('message')}
              required
              rows={5}
              style={{ ...inp, resize: 'vertical' }}
            />
            {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              padding: '14px 28px', borderRadius: 100, border: 'none',
              background: '#18181a', color: 'white', fontSize: 15, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              alignSelf: 'flex-start', transition: 'all 0.2s',
            }}>
              {loading ? 'Sending…' : 'Send message →'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

const inp = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
  fontSize: 14, color: '#18181a', background: 'white', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
```

**Step: Commit**

```bash
git add src/components/Contact.jsx
git commit -m "feat: public contact form with Supabase insert"
```

---

## Task 11: Wire contact form into public site + update CTAs

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Nav.jsx`
- Modify: `src/components/CTAFooter.jsx`
- Modify: `src/components/Hero.jsx`

**Step 1: Add Contact to App.jsx**

In `src/App.jsx`, import Contact and add it before `<CTA />`:

```jsx
import Contact from './components/Contact'
// ... existing imports ...

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <LogoStrip />
      <Services />
      <HowItWorks />
      <Work />
      <Comparison />
      <Pricing />
      <Testimonial />
      <FAQ />
      <Contact />
      <CTA />
      <Footer />
    </>
  )
}
```

**Step 2: Update Nav.jsx CTA button**

In `src/components/Nav.jsx`, change the "Get in touch →" link:

Find line 54–69 (the `<a href="mailto:...">` button) and replace with:
```jsx
<a
  href="#contact"
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#18181a', color: '#fff',
    padding: '10px 20px', borderRadius: 100,
    fontWeight: 500, fontSize: 13.5,
    textDecoration: 'none', whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = '#2a2830'; e.currentTarget.style.transform = 'translateY(-1px)' }}
  onMouseLeave={e => { e.currentTarget.style.background = '#18181a'; e.currentTarget.style.transform = 'none' }}
>
  Get in touch →
</a>
```

**Step 3: Update CTAFooter.jsx "Start a project" button**

In `src/components/CTAFooter.jsx`, change the `href="mailto:..."` on the "Start a project" button to `href="#contact"`.

**Step 4: Update Hero.jsx "Start a project" button**

In `src/components/Hero.jsx` line 92–98, change `href="mailto:..."` to `href="#contact"`.

**Step 5: Verify**

Visit `/`. Click "Get in touch" in nav — page scrolls to contact form. Submit the form with test data. Check Supabase dashboard → Table Editor → inquiries — row appears.

**Step 6: Commit**

```bash
git add src/App.jsx src/components/Nav.jsx src/components/CTAFooter.jsx src/components/Hero.jsx
git commit -m "feat: wire contact form into public site, replace mailto CTAs"
```

---

## Task 12: Admin Dashboard page

**Files:**
- Modify: `src/pages/admin/Dashboard.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ inquiries: 0, clients: 0, projects: 0, invoices: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: inquiries }, { count: clients }, { count: projects }, { count: invoices }] = await Promise.all([
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'unpaid'),
      ])
      setStats({ inquiries, clients, projects, invoices })
    }
    load()
  }, [])

  const cards = [
    { label: 'New inquiries', value: stats.inquiries, color: '#3b82f6' },
    { label: 'Active clients', value: stats.clients, color: '#10b981' },
    { label: 'Active projects', value: stats.projects, color: '#8b5cf6' },
    { label: 'Unpaid invoices', value: stats.invoices, color: '#f59e0b' },
  ]

  return (
    <div style={{ padding: '36px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 28, letterSpacing: '-0.4px' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {cards.map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 12, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color, letterSpacing: '-1px' }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step: Commit**

```bash
git add src/pages/admin/Dashboard.jsx
git commit -m "feat: admin dashboard with live stats"
```

---

## Task 13: Admin Inquiries page

**Files:**
- Modify: `src/pages/admin/Inquiries.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  contacted: { bg: '#fef3c7', text: '#d97706' },
  converted: { bg: '#dcfce7', text: '#16a34a' },
}

export default function AdminInquiries() {
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
  }

  async function setStatus(id, status) {
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await load()
    setSelected(s => s?.id === id ? { ...s, status } : s)
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Inquiries</h1>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                {['Name', 'Email', 'Service', 'Budget', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', background: selected?.id === r.id ? '#f8f6f2' : 'white' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{r.name}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.email}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.service_type}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{r.budget}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...badge, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.text }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#7a7888' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#18181a' }}>{selected.name}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <Detail label="Email" value={selected.email} />
            <Detail label="Company" value={selected.company || '—'} />
            <Detail label="Service" value={selected.service_type} />
            <Detail label="Budget" value={selected.budget} />
            <Detail label="Date" value={new Date(selected.created_at).toLocaleString()} />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Message</div>
              <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6 }}>{selected.message}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Status</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['new', 'contacted', 'converted'].map(s => (
                  <button key={s} onClick={() => setStatus(selected.id, s)} style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                    background: selected.status === s ? '#18181a' : 'white',
                    color: selected.status === s ? 'white' : '#18181a',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#18181a' }}>{value}</div>
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
```

**Step: Commit**

```bash
git add src/pages/admin/Inquiries.jsx
git commit -m "feat: admin inquiries page with status management"
```

---

## Task 14: Admin Clients page

**Files:**
- Modify: `src/pages/admin/Clients.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const PLANS = ['starter', 'growth', 'pro']
const STATUSES = ['active', 'inactive']

export default function AdminClients() {
  const session = useAuth()
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null) // null | 'create' | client object
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data ?? [])
  }

  function openCreate() {
    setForm({ name: '', email: '', company: '', phone: '', plan: 'starter', status: 'active' })
    setModal('create')
  }

  function openEdit(client) {
    setForm({ name: client.name, email: client.email, company: client.company ?? '', phone: client.phone ?? '', plan: client.plan, status: client.status })
    setModal(client)
  }

  async function save() {
    if (modal === 'create') {
      await supabase.from('clients').insert(form)
    } else {
      await supabase.from('clients').update(form).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function sendInvite(client) {
    setInviting(true)
    setInviteMsg('')
    const { error } = await supabase.functions.invoke('invite-client', {
      body: { email: client.email, name: client.name },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setInviting(false)
    setInviteMsg(error ? `Error: ${error.message}` : `Invite sent to ${client.email}`)
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Clients</h1>
        <button onClick={openCreate} style={darkBtn}>+ New client</button>
      </div>

      {inviteMsg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#16a34a', marginBottom: 16 }}>{inviteMsg}</div>}

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {['Name', 'Email', 'Company', 'Plan', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{c.name}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{c.email}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{c.company || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: '#f3f4f6', color: '#374151' }}>{c.plan}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: c.status === 'active' ? '#dcfce7' : '#f3f4f6', color: c.status === 'active' ? '#16a34a' : '#6b7280' }}>{c.status}</span>
                </td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(c)} style={ghostBtn}>Edit</button>
                  <button onClick={() => sendInvite(c)} disabled={inviting} style={ghostBtn}>
                    {inviting ? '…' : 'Invite'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New client' : 'Edit client'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Name *" value={form.name} onChange={set('name')} style={inp} />
              <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} style={inp} />
              <input placeholder="Company" value={form.company} onChange={set('company')} style={inp} />
              <input placeholder="Phone" value={form.phone} onChange={set('phone')} style={inp} />
              <select value={form.plan} onChange={set('plan')} style={inp}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
```

**Step: Commit**

```bash
git add src/pages/admin/Clients.jsx
git commit -m "feat: admin clients page with CRUD and invite"
```

---

## Task 15: Admin Projects page

**Files:**
- Modify: `src/pages/admin/Projects.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = ['proposal', 'active', 'complete']
const STATUS_COLORS = {
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ client_id: '', title: '', description: '', status: 'proposal', start_date: '', due_date: '' })

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  async function load() {
    const { data } = await supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false })
    setProjects(data ?? [])
  }

  function openCreate() {
    setForm({ client_id: '', title: '', description: '', status: 'proposal', start_date: '', due_date: '' })
    setModal('create')
  }

  function openEdit(p) {
    setForm({ client_id: p.client_id, title: p.title, description: p.description ?? '', status: p.status, start_date: p.start_date ?? '', due_date: p.due_date ?? '' })
    setModal(p)
  }

  async function save() {
    const payload = { ...form, start_date: form.start_date || null, due_date: form.due_date || null }
    if (modal === 'create') await supabase.from('projects').insert(payload)
    else await supabase.from('projects').update(payload).eq('id', modal.id)
    setModal(null)
    load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Projects</h1>
        <button onClick={openCreate} style={darkBtn}>+ New project</button>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {['Title', 'Client', 'Status', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{p.title}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{p.clients?.name ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: STATUS_COLORS[p.status]?.bg, color: STATUS_COLORS[p.status]?.text }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{p.due_date ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(p)} style={ghostBtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New project' : 'Edit project'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.client_id} onChange={set('client_id')} style={inp}>
                <option value="">Select client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Title *" value={form.title} onChange={set('title')} style={inp} />
              <textarea placeholder="Description" value={form.description} onChange={set('description')} rows={3} style={{ ...inp, resize: 'vertical' }} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Start date</label>
                  <input type="date" value={form.start_date} onChange={set('start_date')} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Due date</label>
                  <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
```

**Step: Commit**

```bash
git add src/pages/admin/Projects.jsx
git commit -m "feat: admin projects page with CRUD"
```

---

## Task 16: Admin Invoices page

**Files:**
- Modify: `src/pages/admin/Invoices.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = ['unpaid', 'paid', 'overdue']
const STATUS_COLORS = {
  unpaid: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ client_id: '', description: '', amount: '', status: 'unpaid', due_date: '' })

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  async function load() {
    const { data } = await supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false })
    setInvoices(data ?? [])
  }

  function openCreate() {
    setForm({ client_id: '', description: '', amount: '', status: 'unpaid', due_date: '' })
    setModal('create')
  }

  function openEdit(inv) {
    setForm({ client_id: inv.client_id, description: inv.description, amount: String(inv.amount), status: inv.status, due_date: inv.due_date ?? '' })
    setModal(inv)
  }

  async function save() {
    const payload = { ...form, amount: parseFloat(form.amount), due_date: form.due_date || null }
    if (modal === 'create') await supabase.from('invoices').insert(payload)
    else await supabase.from('invoices').update(payload).eq('id', modal.id)
    setModal(null)
    load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Invoices</h1>
        <button onClick={openCreate} style={darkBtn}>+ New invoice</button>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {['Client', 'Description', 'Amount', 'Status', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#7a7888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#18181a' }}>{inv.clients?.name ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{inv.description}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#18181a' }}>${Number(inv.amount).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ ...badge, background: STATUS_COLORS[inv.status]?.bg, color: STATUS_COLORS[inv.status]?.text }}>{inv.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#7a7888' }}>{inv.due_date ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(inv)} style={ghostBtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>
              {modal === 'create' ? 'New invoice' : 'Edit invoice'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.client_id} onChange={set('client_id')} style={inp}>
                <option value="">Select client *</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Description *" value={form.description} onChange={set('description')} style={inp} />
              <input placeholder="Amount *" type="number" value={form.amount} onChange={set('amount')} style={inp} />
              <select value={form.status} onChange={set('status')} style={inp}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div>
                <label style={{ fontSize: 11, color: '#7a7888', display: 'block', marginBottom: 4 }}>Due date</label>
                <input type="date" value={form.due_date} onChange={set('due_date')} style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const badge = { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }
const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const darkBtn = { padding: '9px 18px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const ghostBtn = { padding: '8px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#18181a', fontSize: 12, cursor: 'pointer' }
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
```

**Step: Commit**

```bash
git add src/pages/admin/Invoices.jsx
git commit -m "feat: admin invoices page with CRUD"
```

---

## Task 17: Admin Messages page

**Files:**
- Modify: `src/pages/admin/Messages.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminMessages() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, name, email').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages()
  }, [selected])

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*').eq('client_id', selected.id).order('created_at')
    setMessages(data ?? [])
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)
    await supabase.from('messages').insert({ client_id: selected.id, body, from_admin: true })
    setBody('')
    await loadMessages()
    setSending(false)
  }

  return (
    <div style={{ padding: '36px 40px', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>
      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'auto', flexShrink: 0 }}>
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', background: selected?.id === c.id ? '#f8f6f2' : 'white' }}
            >
              <div style={{ fontSize: 13, fontWeight: 500, color: '#18181a' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#7a7888', marginTop: 2 }}>{c.email}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7888', fontSize: 14 }}>
              Select a client to view messages
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', fontWeight: 500, fontSize: 14, color: '#18181a' }}>
                {selected.name}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.from_admin ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                      background: m.from_admin ? '#18181a' : '#f3f4f6',
                      color: m.from_admin ? 'white' : '#18181a',
                    }}>
                      {m.body}
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
                <input
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message…"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, outline: 'none', background: '#faf9f7' }}
                />
                <button onClick={send} disabled={sending} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#18181a', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step: Commit**

```bash
git add src/pages/admin/Messages.jsx
git commit -m "feat: admin messages page with per-client threads"
```

---

## Task 18: Admin Notes page

**Files:**
- Modify: `src/pages/admin/Notes.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminNotes() {
  const [notes, setNotes] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ related_type: 'client', related_id: '', body: '' })

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
    supabase.from('projects').select('id, title').then(({ data }) => setProjects(data ?? []))
  }, [])

  async function load() {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    setNotes(data ?? [])
  }

  async function save() {
    await supabase.from('notes').insert(form)
    setModal(false)
    setForm({ related_type: 'client', related_id: '', body: '' })
    load()
  }

  async function del(id) {
    await supabase.from('notes').delete().eq('id', id)
    load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const relatedOptions = form.related_type === 'client' ? clients : projects
  const relatedLabel = id => {
    const list = form.related_type === 'client' ? clients : projects
    return list.find(x => x.id === id)?.name || list.find(x => x.id === id)?.title || id
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', letterSpacing: '-0.4px' }}>Notes</h1>
        <button onClick={() => setModal(true)} style={darkBtn}>+ New note</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notes.map(n => (
          <div key={n.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#7a7888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {n.related_type} · {new Date(n.created_at).toLocaleDateString()}
              </span>
              <button onClick={() => del(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7888', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: '#18181a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#18181a', marginBottom: 20 }}>New note</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={form.related_type} onChange={e => setForm(f => ({ ...f, related_type: e.target.value, related_id: '' }))} style={inp}>
                <option value="client">Client</option>
                <option value="project">Project</option>
              </select>
              <select value={form.related_id} onChange={set('related_id')} style={inp}>
                <option value="">Select {form.related_type} *</option>
                {relatedOptions.map(o => <option key={o.id} value={o.id}>{o.name || o.title}</option>)}
              </select>
              <textarea placeholder="Note *" value={form.body} onChange={set('body')} rows={5} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={ghostBtn}>Cancel</button>
              <button onClick={save} style={darkBtn}>Save</button>
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
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
const modalBox = { background: 'white', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }
```

**Step: Commit**

```bash
git add src/pages/admin/Notes.jsx
git commit -m "feat: admin notes page"
```

---

## Task 19: Client Dashboard

**Files:**
- Modify: `src/pages/client/Dashboard.jsx`

Replace with:

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export default function ClientDashboard() {
  const session = useAuth()
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data: client }) => {
      if (!client) return
      supabase.from('projects').select('*').eq('client_id', client.id).eq('status', 'active').then(({ data }) => setProjects(data ?? []))
      supabase.from('invoices').select('*').eq('client_id', client.id).neq('status', 'paid').then(({ data }) => setInvoices(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 28, letterSpacing: '-0.4px' }}>Dashboard</h1>

      {invoices.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#d97706' }}>
          You have {invoices.length} unpaid invoice{invoices.length > 1 ? 's' : ''}.
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 14 }}>Active projects</h2>
      {projects.length === 0 ? (
        <p style={{ fontSize: 13, color: '#7a7888' }}>No active projects.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a', marginBottom: 4 }}>{p.title}</div>
              {p.description && <div style={{ fontSize: 13, color: '#7a7888' }}>{p.description}</div>}
              {p.due_date && <div style={{ fontSize: 12, color: '#7a7888', marginTop: 6 }}>Due: {p.due_date}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step: Commit**

```bash
git add src/pages/client/Dashboard.jsx
git commit -m "feat: client dashboard"
```

---

## Task 20: Client Projects, Invoices, Messages, Requests pages

**Files:**
- Modify: `src/pages/client/Projects.jsx`
- Modify: `src/pages/client/Invoices.jsx`
- Modify: `src/pages/client/Messages.jsx`
- Modify: `src/pages/client/Requests.jsx`

**Step 1: Create a shared hook to get the client record**

Add this helper at the top of each client page (inline, not a separate file — too simple to abstract):

```js
async function getClientId(userId) {
  const { data } = await supabase.from('clients').select('id').eq('user_id', userId).single()
  return data?.id
}
```

**Step 2: Replace `src/pages/client/Projects.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const STATUS_COLORS = {
  proposal: { bg: '#f3f4f6', text: '#6b7280' },
  active: { bg: '#dcfce7', text: '#16a34a' },
  complete: { bg: '#dbeafe', text: '#1d4ed8' },
}

export default function ClientProjects() {
  const session = useAuth()
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data: client }) => {
      if (!client) return
      supabase.from('projects').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).then(({ data }) => setProjects(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Projects</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a' }}>{p.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[p.status]?.bg, color: STATUS_COLORS[p.status]?.text }}>{p.status}</span>
            </div>
            {p.description && <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{p.description}</div>}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#7a7888' }}>
              {p.start_date && <span>Started: {p.start_date}</span>}
              {p.due_date && <span>Due: {p.due_date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Replace `src/pages/client/Invoices.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const STATUS_COLORS = {
  unpaid: { bg: '#fef3c7', text: '#d97706' },
  paid: { bg: '#dcfce7', text: '#16a34a' },
  overdue: { bg: '#fee2e2', text: '#dc2626' },
}

export default function ClientInvoices() {
  const session = useAuth()
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data: client }) => {
      if (!client) return
      supabase.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).then(({ data }) => setInvoices(data ?? []))
    })
  }, [session])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Invoices</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {invoices.map(inv => (
          <div key={inv.id} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#18181a', marginBottom: 4 }}>{inv.description}</div>
              {inv.due_date && <div style={{ fontSize: 12, color: '#7a7888' }}>Due: {inv.due_date}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#18181a', marginBottom: 6 }}>${Number(inv.amount).toLocaleString()}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[inv.status]?.bg, color: STATUS_COLORS[inv.status]?.text }}>{inv.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Replace `src/pages/client/Messages.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export default function ClientMessages() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data }) => {
      if (data) { setClientId(data.id); loadMessages(data.id) }
    })
  }, [session])

  async function loadMessages(id) {
    const { data } = await supabase.from('messages').select('*').eq('client_id', id ?? clientId).order('created_at')
    setMessages(data ?? [])
  }

  async function send() {
    if (!body.trim() || !clientId) return
    setSending(true)
    await supabase.from('messages').insert({ client_id: clientId, body, from_admin: false })
    setBody('')
    await loadMessages()
    setSending(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Messages</h1>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', height: 500 }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#7a7888', fontSize: 13, paddingTop: 40 }}>No messages yet.</div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.from_admin ? 'flex-start' : 'flex-end' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                background: m.from_admin ? '#f3f4f6' : '#18181a',
                color: m.from_admin ? '#18181a' : 'white',
              }}>
                {m.from_admin && <div style={{ fontSize: 10, fontWeight: 600, color: '#b8906a', marginBottom: 4 }}>Vibefox Studio</div>}
                {m.body}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10 }}>
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, outline: 'none', background: '#faf9f7' }}
          />
          <button onClick={send} disabled={sending} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#18181a', color: 'white', fontSize: 13, cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Replace `src/pages/client/Requests.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const STATUS_COLORS = {
  open: { bg: '#dbeafe', text: '#1d4ed8' },
  'in-progress': { bg: '#fef3c7', text: '#d97706' },
  done: { bg: '#dcfce7', text: '#16a34a' },
}

export default function ClientRequests() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ title: '', description: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!session) return
    supabase.from('clients').select('id').eq('user_id', session.user.id).single().then(({ data }) => {
      if (data) { setClientId(data.id); load(data.id) }
    })
  }, [session])

  async function load(id) {
    const { data } = await supabase.from('requests').select('*').eq('client_id', id ?? clientId).order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  async function submit(e) {
    e.preventDefault()
    if (!clientId) return
    await supabase.from('requests').insert({ ...form, client_id: clientId })
    setForm({ title: '', description: '' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    load()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#18181a', marginBottom: 24, letterSpacing: '-0.4px' }}>Requests</h1>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 16 }}>Submit a request</h2>
        {submitted ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#16a34a' }}>Request submitted!</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input placeholder="Title *" value={form.title} onChange={set('title')} required style={inp} />
            <textarea placeholder="Describe what you need *" value={form.description} onChange={set('description')} required rows={4} style={{ ...inp, resize: 'vertical' }} />
            <button type="submit" style={{ padding: '11px 20px', borderRadius: 100, border: 'none', background: '#18181a', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start' }}>
              Submit request
            </button>
          </form>
        )}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#18181a', marginBottom: 14 }}>Past requests</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requests.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#18181a' }}>{r.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.text }}>{r.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7a7888', lineHeight: 1.5 }}>{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inp = { padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#18181a', background: '#faf9f7', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
```

**Step 6: Commit**

```bash
git add src/pages/client/
git commit -m "feat: all client portal pages (projects, invoices, messages, requests)"
```

---

## Task 21: Fix ProtectedRoute hook-in-condition bug

The `ProtectedRoute.jsx` written in Task 5 has a React rules-of-hooks violation — `useIsAdmin` is called inside a conditional. Fix it.

**Files:**
- Modify: `src/components/ProtectedRoute.jsx`

Replace with:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export function AdminRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (!session || session.user?.email !== ADMIN_EMAIL) return <Navigate to="/admin/login" replace />
  return children
}

export function ClientRoute({ children }) {
  const session = useAuth()
  if (session === undefined) return null
  if (!session) return <Navigate to="/client/login" replace />
  return children
}
```

Also remove `useIsAdmin` from `src/lib/auth.jsx` since it's no longer used:

In `src/lib/auth.jsx`, delete the last two lines:
```js
// Remove these:
export function useIsAdmin(session) {
  return session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL
}
```

**Step: Commit**

```bash
git add src/components/ProtectedRoute.jsx src/lib/auth.jsx
git commit -m "fix: remove hooks-in-condition violation in ProtectedRoute"
```

---

## Task 22: Final verification

**Step 1: Full smoke test**

Run `npm run dev` and verify:

1. `/` — marketing site loads, all sections visible
2. Click "Get in touch" → scrolls to contact form
3. Submit the contact form → thank-you state, row appears in Supabase `inquiries` table
4. `/admin/login` → sign in with your Supabase account → redirects to dashboard
5. Admin dashboard shows stat cards (all 0 is fine)
6. Admin Inquiries → the test inquiry you just submitted appears
7. Admin Clients → create a test client, "Invite" button calls the edge function
8. Admin Projects → create a project linked to the test client
9. Admin Invoices → create an invoice linked to the test client
10. Admin Messages → select a client, send a message
11. Admin Notes → create a note
12. Sign out → redirects to `/admin/login`
13. `/client/login` → sign in as an invited client → redirects to client dashboard
14. Client portal pages all load without errors

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete full-stack implementation with Supabase, admin panel, and client portal"
```
