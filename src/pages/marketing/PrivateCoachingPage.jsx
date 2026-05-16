import { useId, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const BRAND_ACCENT = '#b8906a'

const ROLE_SUGGESTIONS = ['Student', 'Freelancer', 'Founder', 'Engineer', 'Designer']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const focusRingStyle = {
  outline: 'none',
  boxShadow: `0 0 0 2px ${BRAND_ACCENT}33`,
  borderColor: BRAND_ACCENT,
}

export default function PrivateCoachingPage() {
  const [params] = useSearchParams()
  const wasCanceled = params.get('canceled') === '1'

  const companyRoleId = useId()
  const reasonId = useId()
  const outcomeId = useId()
  const experienceLabelId = useId()

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
      const { data, error: fnError } = await supabase.functions.invoke('create-coaching-checkout', {
        body: form,
      })
      if (fnError) {
        const parsed = await parseFunctionError(fnError, 'Could not start checkout.')
        throw new Error(parsed.message || 'Could not start checkout.')
      }
      if (!data?.url) throw new Error('Checkout URL missing from response. Please try again.')
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <MarketingLayout hideCTA>
      <SEOHead
        title="Private Coaching & Consulting — Vibefox Studio"
        description="1:1 AI Software Engineering coaching with Vibefox Studio."
        path="/privatecoaching"
        noindex
      />
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-24">
        <header className="mb-12 text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-wider"
            style={{ color: BRAND_ACCENT }}
          >
            Private
          </p>
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
            <li>• 60 minutes of focused 1:1 coaching with Vibefox Studio</li>
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
            <Field
              label="First name"
              required
              value={form.first_name}
              onChange={update('first_name')}
              autoComplete="given-name"
            />
            <Field
              label="Last name"
              required
              value={form.last_name}
              onChange={update('last_name')}
              autoComplete="family-name"
            />
          </div>

          <Field
            type="email"
            label="Email"
            required
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            inputMode="email"
          />
          <Field
            type="tel"
            label="Phone (optional)"
            value={form.phone}
            onChange={update('phone')}
            autoComplete="tel"
            inputMode="tel"
          />

          <div>
            <label
              htmlFor={companyRoleId}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Company or role
            </label>
            <input
              id={companyRoleId}
              type="text"
              value={form.company_role}
              onChange={update('company_role')}
              placeholder="e.g. Founder at Acme, Student at NYU…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
              onFocus={(e) => Object.assign(e.target.style, focusRingStyle)}
              onBlur={(e) => {
                e.target.style.outline = ''
                e.target.style.boxShadow = ''
                e.target.style.borderColor = ''
              }}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`Use "${s}" as company or role`}
                  onClick={() => setForm((p) => ({ ...p, company_role: s }))}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = BRAND_ACCENT
                    e.currentTarget.style.color = BRAND_ACCENT
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = ''
                    e.currentTarget.style.color = ''
                  }}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p id={experienceLabelId} className="mb-1 block text-sm font-medium text-slate-700">
              Experience level
            </p>
            <div
              role="radiogroup"
              aria-labelledby={experienceLabelId}
              className="flex flex-wrap gap-2"
            >
              {EXPERIENCE_LEVELS.map((level) => {
                const checked = form.experience_level === level
                return (
                  <label
                    key={level}
                    className="cursor-pointer rounded-full border px-4 py-1.5 text-sm transition"
                    style={
                      checked
                        ? {
                          borderColor: BRAND_ACCENT,
                          background: BRAND_ACCENT,
                          color: '#fff',
                        }
                        : { borderColor: '#cbd5e1', color: '#334155' }
                    }
                  >
                    <input
                      type="radio"
                      name="experience_level"
                      value={level}
                      checked={checked}
                      onChange={update('experience_level')}
                      className="sr-only"
                    />
                    {level}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor={reasonId}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              What do you want coaching on? <span className="text-red-500">*</span>
            </label>
            <textarea
              id={reasonId}
              required
              rows={4}
              value={form.reason}
              onChange={update('reason')}
              placeholder="The project, the stack, the specific problems you're stuck on…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
              onFocus={(e) => Object.assign(e.target.style, focusRingStyle)}
              onBlur={(e) => {
                e.target.style.outline = ''
                e.target.style.boxShadow = ''
                e.target.style.borderColor = ''
              }}
            />
          </div>

          <div>
            <label
              htmlFor={outcomeId}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              What do you want to walk away with? <span className="text-red-500">*</span>
            </label>
            <textarea
              id={outcomeId}
              required
              rows={3}
              value={form.outcome}
              onChange={update('outcome')}
              placeholder="A clearer architecture, a working feature, a decision made…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
              onFocus={(e) => Object.assign(e.target.style, focusRingStyle)}
              onBlur={(e) => {
                e.target.style.outline = ''
                e.target.style.boxShadow = ''
                e.target.style.borderColor = ''
              }}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = BRAND_ACCENT
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ''
            }}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Starting checkout…' : 'Continue to checkout — $500'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Secure payment via Stripe. You'll receive a confirmation email with your booking link.
          </p>
        </form>
      </div>
    </MarketingLayout>
  )
}

function Field({
  label,
  type = 'text',
  required = false,
  value,
  onChange,
  autoComplete,
  inputMode,
}) {
  const inputId = useId()
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
        onFocus={(e) => {
          e.target.style.outline = 'none'
          e.target.style.boxShadow = `0 0 0 2px ${BRAND_ACCENT}33`
          e.target.style.borderColor = BRAND_ACCENT
        }}
        onBlur={(e) => {
          e.target.style.outline = ''
          e.target.style.boxShadow = ''
          e.target.style.borderColor = ''
        }}
      />
    </div>
  )
}
