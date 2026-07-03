// Single source of truth for the site FAQ — rendered by <FAQ /> and used to
// build the FAQPage structured data so schema always matches visible content.
export const faqs = [
  { q: "What's included in a typical project?", a: "Every project includes design, development, launch, and two rounds of revisions. We handle domain connection, SSL, and hosting setup. Growth plans are optional but recommended to keep everything running after launch." },
  { q: "How long does a project take?", a: "Landing pages go live in 3–5 business days. Full websites take 1–2 weeks. Custom web apps with databases and user auth run 3–6 weeks depending on scope. A clear timeline is agreed before any work starts." },
  { q: "What counts as a \"minor update\" in the growth plan?", a: "Minor updates include text changes, phone numbers, hours, adding a photo, and small copy edits. Structural changes — new pages, new sections, new features — are quoted separately. Full redesigns are separate projects starting at $1,500." },
  { q: "Do I need to sign a long-term contract?", a: "No. Growth plans are month-to-month and can be cancelled with 30 days notice. Project work is billed 50% upfront, 50% on delivery. No lock-in, no surprises." },
  { q: "Can you build something with user login and a database?", a: "Yes. We build full-stack apps with user auth, real-time data, file uploads, and secure per-user access. Booking systems, client portals, internal tools — all in scope. Custom app quotes start at $4,000." },
]

// Rendered on /support and used for its FAQPage structured data.
export const supportFaqs = [
  {
    q: 'How do I pay an invoice?',
    a: 'Open the secure invoice link we sent you — it shows the full breakdown and a Pay Now button. Payments are handled by Stripe and accept all major cards. Once paid, the page updates automatically and your receipt is emailed to you.',
  },
  {
    q: "I paid, but I don't see a receipt.",
    a: "Stripe emails receipts within a few minutes of payment — check spam or promotions folders first. If it still hasn't arrived, email inquiries@vibefoxstudio.com and we'll resend it.",
  },
  {
    q: 'How do I request changes to my website?',
    a: 'Log in to the client portal and use the Support tab to describe what you need. Minor updates on a growth plan (text, hours, photos, small copy edits) are included; larger changes get a quick quote first.',
  },
  {
    q: "I can't log in to the client portal.",
    a: 'Use the "Forgot password" option on the login page to reset your password. If your email isn\'t recognized or the reset never arrives, contact us and we\'ll sort out your account.',
  },
  {
    q: 'How fast do you respond?',
    a: 'Within 1 business day, usually much sooner. Billing and site-down issues are prioritized ahead of everything else.',
  },
]
