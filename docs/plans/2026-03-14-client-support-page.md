# Client Support Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `/client/requests` with a `/client/support` page featuring a hardcoded FAQ accordion, a contact form that saves to the `requests` table and emails the admin via Resend, and a past-submissions history list.

**Architecture:** Reuse the existing `requests` table and RLS — no DB migration needed. A new `submit-support` edge function handles auth, DB insert, and Resend email. The frontend page (`Support.jsx`) fetches history directly from Supabase and calls the edge function on submit.

**Tech Stack:** React 18, React Router v6, Supabase JS client, Supabase Edge Functions (Deno), Resend email API

---

## Prerequisites

Before starting, confirm you have a Resend API key:
1. Create a free account at https://resend.com
2. Verify your sending domain (`vibefoxstudio.com`) under Domains → Add Domain, then follow the DNS instructions
3. Create an API key under API Keys → Create API Key
4. Set the secret: `npx supabase secrets set RESEND_API_KEY=re_xxxx --project-ref tgugladqhpzadqehdzny`

> If you skip Resend for now, the form will still save to the DB — email is best-effort and won't block submission.

---

## Task 1: Create the `submit-support` Edge Function

**Files:**
- Create: `supabase/functions/submit-support/index.ts`

This function verifies the client's JWT, looks up their `client_id`, inserts a row into `requests`, and sends an email to the admin via Resend. Email failure is non-fatal — the submission is still saved.

**Step 1: Create the file**

Create `supabase/functions/submit-support/index.ts` with this exact content:

```typescript
import { getSupabaseAdminClient, getAdminEmail } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function sendSupportEmail(params: {
  apiKey: string
  to: string
  clientName: string
  clientEmail: string
  title: string
  description: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VibeFox Studio <support@vibefoxstudio.com>',
      to: params.to,
      subject: `New support request: ${params.title}`,
      html: `
        <p><strong>From:</strong> ${params.clientName || 'Unknown'} &lt;${params.clientEmail}&gt;</p>
        <p><strong>Subject:</strong> ${params.title}</p>
        <hr />
        <p>${params.description.replace(/\n/g, '<br>')}</p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error (${res.status}): ${text}`)
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    // Verify the caller is an authenticated (client) user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const supabaseAdmin = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Look up the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return json({ error: 'Client account not found.' }, 404)
    }

    // Parse and validate form body
    const body = await request.json().catch(() => ({}))
    const title = cleanText(body.title)
    const description = cleanText(body.description)

    if (!title) return json({ error: 'Subject is required.' }, 400)
    if (!description) return json({ error: 'Message is required.' }, 400)

    // Save to requests table
    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from('requests')
      .insert({
        client_id: client.id,
        description,
        status: 'open',
        title,
      })
      .select('id')
      .single()

    if (insertError) {
      return json({ error: insertError.message || 'Could not save support request.' }, 500)
    }

    // Send email (best-effort — failure does not fail the request)
    const adminEmail = getAdminEmail()
    let emailWarning: string | null = null
    const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()

    if (resendKey) {
      try {
        await sendSupportEmail({
          apiKey: resendKey,
          clientEmail: client.email || user.email || '',
          clientName: client.name || '',
          description,
          title,
          to: adminEmail,
        })
      } catch (error) {
        emailWarning = error instanceof Error ? error.message : 'Email notification failed.'
        console.error('submit-support email warning', { message: emailWarning })
      }
    } else {
      emailWarning = 'RESEND_API_KEY not set — email notification skipped.'
      console.warn('submit-support', emailWarning)
    }

    return json({ id: requestRow.id, ok: true, warning: emailWarning })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    console.error('submit-support error', { message })
    return json({ error: message }, 500)
  }
})
```

**Step 2: Deploy the function**

```bash
cd /Users/richie/Documents/GitHub/vibefox-studio
npx supabase functions deploy submit-support --project-ref tgugladqhpzadqehdzny --no-verify-jwt
```

Expected output: `Deployed Function submit-support`

**Step 3: Smoke-test the function (unauthenticated should 401)**

```bash
curl -s -X POST https://tgugladqhpzadqehdzny.supabase.co/functions/v1/submit-support \
  -H "Content-Type: application/json" \
  -d '{"title":"test","description":"test"}' | cat
```

Expected: `{"error":"Unauthorized"}` with HTTP 401.

**Step 4: Commit**

```bash
git add supabase/functions/submit-support/index.ts
git commit -m "feat: add submit-support edge function with Resend email"
```

---

## Task 2: Create `Support.jsx`

**Files:**
- Create: `src/pages/client/Support.jsx`

**Step 1: Create the file**

Create `src/pages/client/Support.jsx` with this exact content:

```jsx
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const STATUS_COLORS = {
  done: { bg: '#dcfce7', text: '#16a34a' },
  'in-progress': { bg: '#fef3c7', text: '#d97706' },
  open: { bg: '#dbeafe', text: '#1d4ed8' },
}

const FAQ_ITEMS = [
  {
    a: "Head to the Projects page — you'll see current progress and any milestones there.",
    q: 'How do I check my project status?',
  },
  {
    a: 'Go to the Invoices page and click "Open invoice" or "Open payment link" next to the invoice.',
    q: 'How do I pay an invoice?',
  },
  {
    a: 'We typically respond within 1 business day. For urgent matters, feel free to reach out directly.',
    q: 'How long until I get a reply?',
  },
  {
    a: "Yes — use the form below to describe what you need and we'll get back to you.",
    q: 'Can I request changes to my project?',
  },
  {
    a: "Send us a message using the form below and we'll update it on our end.",
    q: 'How do I update my contact info?',
  },
]

export default function ClientSupport() {
  const session = useAuth()
  const [clientId, setClientId] = useState(null)
  const [requests, setRequests] = useState([])
  const [form, setForm] = useState({ description: '', title: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const load = useCallback(async id => {
    const targetClientId = id ?? clientId
    if (!targetClientId) return

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at', { ascending: false })

    if (error) {
      setNotice({ text: error.message || 'Could not load submissions.', type: 'error' })
      setLoading(false)
      return
    }

    setRequests(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    if (!session) return

    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) {
        setNotice({ text: error?.message || 'Client account not found.', type: 'error' })
        setLoading(false)
        return
      }

      setClientId(data.id)
      load(data.id)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [session, load])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function submit(event) {
    event.preventDefault()
    if (!clientId || !form.title.trim() || !form.description.trim() || submitting) return

    setSubmitting(true)

    try {
      const { error } = await supabase.functions.invoke('submit-support', {
        body: {
          description: form.description.trim(),
          title: form.title.trim(),
        },
      })

      if (error) {
        const { message } = await parseFunctionError(error, 'Could not submit support request.')
        setNotice({ text: message, type: 'error' })
        setSubmitting(false)
        return
      }

      setForm({ description: '', title: '' })
      setNotice({ text: "Message sent. We'll get back to you soon.", type: 'success' })
      load()
    } catch {
      setNotice({ text: 'Could not submit support request.', type: 'error' })
    }

    setSubmitting(false)
  }

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  const toggleFaq = index => setOpenFaq(current => (current === index ? null : index))

  return (
    <div>
      <h1 style={{ color: '#18181a', fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 24 }}>Support</h1>

      {notice && (
        <div style={{
          background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 10,
          color: notice.type === 'error' ? '#dc2626' : '#16a34a',
          fontSize: 13,
          marginBottom: 14,
          padding: '10px 14px',
        }}>
          {notice.text}
        </div>
      )}

      {/* FAQ accordion */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '18px 24px 14px' }}>
          <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, margin: 0 }}>Frequently asked questions</h2>
        </div>
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} style={{ borderBottom: index < FAQ_ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
            <button
              onClick={() => toggleFaq(index)}
              style={{
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
                padding: '14px 24px',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ color: '#18181a', fontSize: 13, fontWeight: 500 }}>{item.q}</span>
              <span style={{ color: '#7a7888', flexShrink: 0, fontSize: 18, fontWeight: 300, lineHeight: 1 }}>
                {openFaq === index ? '−' : '+'}
              </span>
            </button>
            {openFaq === index && (
              <div style={{ color: '#7a7888', fontSize: 13, lineHeight: 1.6, padding: '0 24px 16px' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, marginBottom: 24, padding: 24 }}>
        <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Send a message</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            onChange={set('title')}
            placeholder="Subject *"
            required
            style={inp}
            value={form.title}
          />
          <textarea
            onChange={set('description')}
            placeholder="Describe what you need *"
            required
            rows={4}
            style={{ ...inp, resize: 'vertical' }}
            value={form.description}
          />
          <button
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            style={{
              alignSelf: 'flex-start',
              background: '#18181a',
              border: 'none',
              borderRadius: 100,
              color: 'white',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              opacity: submitting ? 0.6 : 1,
              padding: '11px 20px',
            }}
            type="submit"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>

      {/* Submission history */}
      <h2 style={{ color: '#18181a', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Past submissions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ color: '#7a7888', fontSize: 13 }}>Loading…</div>}

        {!loading && requests.length === 0 && (
          <div style={{ color: '#7a7888', fontSize: 13 }}>No submissions yet.</div>
        )}

        {!loading && requests.map(request => (
          <div key={request.id} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: '#18181a', fontSize: 13, fontWeight: 500 }}>{request.title}</div>
              <span style={{
                background: STATUS_COLORS[request.status]?.bg || '#f3f4f6',
                borderRadius: 100,
                color: STATUS_COLORS[request.status]?.text || '#6b7280',
                fontSize: 11,
                fontWeight: 600,
                marginLeft: 8,
                padding: '3px 9px',
                whiteSpace: 'nowrap',
              }}>
                {request.status}
              </span>
            </div>
            <div style={{ color: '#7a7888', fontSize: 13, lineHeight: 1.5 }}>{request.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inp = {
  background: '#faf9f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  boxSizing: 'border-box',
  color: '#18181a',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  padding: '11px 14px',
  width: '100%',
}
```

**Step 2: Verify it renders (no runtime errors)**

Start the dev server if not already running:
```bash
cd /Users/richie/Documents/GitHub/vibefox-studio
npm run dev
```

Open http://localhost:5173/client/support (you'll add the route in Task 3 — do that first if you want to preview now).

**Step 3: Commit**

```bash
git add src/pages/client/Support.jsx
git commit -m "feat: add client support page with FAQ accordion and contact form"
```

---

## Task 3: Update Nav and Router

**Files:**
- Modify: `src/components/client/ClientLayout.jsx`
- Modify: `src/main.jsx`

### 3a — Update ClientLayout nav

**Step 1: Open `src/components/client/ClientLayout.jsx`**

Find this line in the `navItems` array:
```javascript
{ to: '/client/requests', label: 'Requests' },
```

Replace it with:
```javascript
{ to: '/client/support', label: 'Support' },
```

**Step 2: Verify the nav array looks like this after the edit:**
```javascript
const navItems = [
  { to: '/client/dashboard', label: 'Dashboard' },
  { to: '/client/projects', label: 'Projects' },
  { to: '/client/invoices', label: 'Invoices' },
  { to: '/client/messages', label: 'Messages' },
  { to: '/client/support', label: 'Support' },
]
```

### 3b — Update main.jsx router

**Step 1: Open `src/main.jsx`**

Add this import near the other client page imports:
```javascript
import ClientSupport from './pages/client/Support.jsx'
```

**Step 2: Find the old requests route inside the `<Route path="/client">` block:**
```jsx
<Route path="requests" element={<ClientRequests />} />
```

Replace it with:
```jsx
<Route path="support" element={<ClientSupport />} />
```

**Step 3: Remove the now-unused import (optional but clean):**
```javascript
// Remove this line:
import ClientRequests from './pages/client/Requests.jsx'
```

**Step 4: Verify the client routes block looks like this:**
```jsx
<Route path="/client" element={<ClientRoute><ClientLayout /></ClientRoute>}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<ClientDashboard />} />
  <Route path="projects" element={<ClientProjects />} />
  <Route path="invoices" element={<ClientInvoices />} />
  <Route path="messages" element={<ClientMessages />} />
  <Route path="support" element={<ClientSupport />} />
</Route>
```

**Step 5: Commit**

```bash
git add src/components/client/ClientLayout.jsx src/main.jsx
git commit -m "feat: rename Requests to Support in client nav and router"
```

---

## Task 4: Manual End-to-End Test

**Step 1: Confirm the page loads**

Navigate to http://localhost:5173/client/support while logged in as a client.

Expected:
- Page title "Support" visible
- FAQ accordion visible with 5 items
- Form with Subject and Message inputs
- "Past submissions" section (empty if no previous requests)

**Step 2: Test FAQ accordion**

Click any FAQ question.
Expected: Answer text appears below the question, `+` changes to `−`.
Click the same question again.
Expected: Answer collapses, `−` changes to `+`.

**Step 3: Test form validation**

Try clicking "Send message" with empty fields.
Expected: Button is disabled (greyed out), nothing submitted.

**Step 4: Test form submission**

Fill in Subject and Message, click "Send message".
Expected:
- Button shows "Sending…"
- Success notice appears: "Message sent. We'll get back to you soon."
- Form clears
- New submission appears in "Past submissions" list with `open` status badge
- Admin email sent to `richiethais@gmail.com` (check inbox)

**Step 5: Verify in Supabase**

Open https://supabase.com/dashboard/project/tgugladqhpzadqehdzny/editor
Run: `select * from requests order by created_at desc limit 5;`
Expected: New row visible with `status = 'open'` and correct `client_id`.

**Step 6: Final commit (if any fixes needed after testing)**

```bash
git add -p
git commit -m "fix: <describe what you fixed>"
```

---

## Task 5: Clean Up (Optional)

If `Requests.jsx` is no longer needed:

```bash
git rm src/pages/client/Requests.jsx
git commit -m "chore: remove deprecated Requests page"
```

Only do this after confirming the support page works end-to-end.
