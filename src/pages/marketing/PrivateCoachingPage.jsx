import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../../components/Nav'
import { Footer } from '../../components/CTAFooter'
import SEOHead from '../../components/SEOHead'

const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coaching-checkout`

const ROLE_SUGGESTIONS = ['Student', 'Freelancer', 'Founder', 'Engineer', 'Designer']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function PrivateCoachingPage() {
  const [params] = useSearchParams()
  const wasCanceled = params.get('canceled') === '1'

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_role: '',
    experience_level: '',
    reason: '',
    outcome: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <SEOHead
        title="Private Coaching & Consulting — Vibefox Studio"
        description="1:1 AI Software Engineering coaching with Vibefox Studio."
        path="/privatecoaching"
        noindex
      />
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-orange-500">Private</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            1:1 AI Software Engineering Coaching
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            One hour, one-on-one. Bring your code, your stack, your roadblocks. Walk away unstuck.
          </p>
          <p className="mt-6 text-2xl font-semibold text-slate-900">$500 / hour</p>
        </header>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">What you get</h2>
          <ul className="space-y-2 text-slate-700">
            <li>• 60 minutes of focused 1:1 coaching with Richie (Vibefox Studio)</li>
            <li>• Live code review, architecture feedback, or pair-programming on your real project</li>
            <li>• Concrete next steps you can act on the same week</li>
            <li>• Follow-up notes in writing</li>
          </ul>
        </section>

        {wasCanceled && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Checkout was canceled. Your information is still here — you can resubmit anytime.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-900">Tell me about you</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required value={form.first_name} onChange={update('first_name')} />
            <Field label="Last name" required value={form.last_name} onChange={update('last_name')} />
          </div>

          <Field type="email" label="Email" required value={form.email} onChange={update('email')} />
          <Field label="Phone (optional)" value={form.phone} onChange={update('phone')} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company or role</label>
            <input
              type="text"
              value={form.company_role}
              onChange={update('company_role')}
              placeholder="e.g. Founder at Acme, Student at NYU…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, company_role: s }))}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-orange-500 hover:text-orange-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Experience level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, experience_level: level }))}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    form.experience_level === level
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-orange-500'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              What do you want coaching on? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.reason}
              onChange={update('reason')}
              placeholder="The project, the stack, the specific problems you're stuck on…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              What do you want to walk away with? <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.outcome}
              onChange={update('outcome')}
              placeholder="A clearer architecture, a working feature, a decision made…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Starting checkout…' : 'Continue to checkout — $500'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Secure payment via Stripe. You'll receive a confirmation email with your booking link.
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}

function Field({ label, type = 'text', required = false, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  )
}
