# Client Support Page Design

**Date:** 2026-03-14
**Replaces:** `/client/requests` (Requests.jsx)
**New route:** `/client/support`

## Summary

Replace the existing Requests page with a Support page that has three sections:
1. Hardcoded FAQ accordion
2. Contact form (subject + message)
3. Past submission history

Submissions are saved to the existing `requests` table and trigger an admin email via a new `submit-support` edge function using Resend.

---

## Architecture

```
Client (browser)
  └── GET /client/support  → Support.jsx
        ├── [on load]      → supabase.from('requests').select(*)
        └── [on submit]    → functions/submit-support (edge function)
                                ├── verifies JWT (must be logged-in client)
                                ├── looks up client_id from clients table
                                ├── inserts row into requests table
                                └── calls Resend API → email to ADMIN_EMAIL
```

### Files changed / created

| File | Action |
|---|---|
| `src/pages/client/Support.jsx` | Create (replaces Requests.jsx) |
| `supabase/functions/submit-support/index.ts` | Create (new edge function) |
| `src/components/client/ClientLayout.jsx` | Edit — nav label + href |
| `src/App.jsx` (or router file) | Edit — swap route component |

### No DB migration needed
Reuses the existing `requests` table (id, client_id, title, description, status, created_at). `title` maps to "subject", `description` maps to "message".

### New secret required
`RESEND_API_KEY` — set via `npx supabase secrets set RESEND_API_KEY=<key> --project-ref tgugladqhpzadqehdzny`

---

## Page Layout

```
Support                                   ← h1

┌─ FAQ ───────────────────────────────┐
│  ▸ How do I check project status?   │   accordion — click to expand
│  ▸ How do I pay an invoice?         │
│  ▸ How long until I get a reply?    │
│  ▸ Can I request project changes?   │
│  ▸ How do I update my info?         │
└─────────────────────────────────────┘

┌─ Send a message ────────────────────┐
│  Subject  _________________________ │
│  Message  _________________________ │
│           _________________________ │
│           _________________________ │
│  [   Send message   ]              │
└─────────────────────────────────────┘

Past submissions
┌─ Subject · status badge · date ────┐
│  Message preview...                │
└─────────────────────────────────────┘
```

Visual style matches client portal: white cards, `#18181a` text, tan `#f8f6f2` background, same input/button styles as Requests.jsx.

---

## FAQ Content (hardcoded, editable in source)

| Question | Answer |
|---|---|
| How do I check my project status? | Head to the Projects page — you'll see timelines and current progress there. |
| How do I pay an invoice? | Go to the Invoices page and click "Open invoice" or "Open payment link" next to the invoice. |
| How long until I get a reply? | We typically respond within 1 business day. |
| Can I request changes to my project? | Yes — use the form below to describe what you need and we'll get back to you. |
| How do I update my contact info? | Send us a message using the form below and we'll update it on our end. |

---

## Edge Function: `submit-support`

**Endpoint:** `POST /functions/v1/submit-support`
**Auth:** Bearer JWT (Supabase client session token) — any authenticated client, not just admin

**Flow:**
1. Parse `{ title, description }` from request body
2. Validate: both fields required, non-empty after trim
3. Extract JWT → `supabaseAdmin.auth.getUser(token)` → get `user.id`
4. Look up `clients` table where `user_id = user.id` → get `client_id`
5. Insert into `requests`: `{ client_id, title, description, status: 'open' }`
6. Call Resend API: send email to `ADMIN_EMAIL` with subject + message + client info
7. Return `{ ok: true }`

**Error handling:**
- 400 if title/description missing
- 401 if JWT invalid/missing
- 404 if client not found
- 500 on DB or Resend failure (but still return success if DB save succeeded — email is best-effort)

---

## Nav & Routing

- `ClientLayout.jsx`: change `{ to: '/client/requests', label: 'Requests' }` → `{ to: '/client/support', label: 'Support' }`
- Router: swap `<Route path="/client/requests" element={<ClientRequests />} />` for `<Route path="/client/support" element={<ClientSupport />} />`
- Old `Requests.jsx` can be deleted or kept (it's no longer routed to)
