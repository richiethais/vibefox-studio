import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const DEFAULT_BOOKING_URL = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'

function normalizeBookingUrl(bookingUrl) {
  if (typeof bookingUrl !== 'string') return ''

  const trimmed = bookingUrl.trim()
  if (!trimmed) return ''

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getEmbedUrl(bookingUrl) {
  const normalizedUrl = normalizeBookingUrl(bookingUrl)
  if (!normalizedUrl) return ''

  const separator = normalizedUrl.includes('?') ? '&' : '?'
  return `${normalizedUrl}${separator}embed=true`
}

export default function PrivateCoachingThanksPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const debugBooking = params.get('debug_booking') === '1'
  const [bookingUrl, setBookingUrl] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(true)

  const canUseDebugBooking = import.meta.env.DEV && debugBooking
  const embedUrl = getEmbedUrl(bookingUrl)

  useEffect(() => {
    let active = true

    async function verifyAccess() {
      if (canUseDebugBooking) {
        if (!active) return
        setBookingUrl(DEFAULT_BOOKING_URL)
        setError('')
        setVerifying(false)
        return
      }

      if (!sessionId) {
        if (!active) return
        setError('This booking page is only available right after a successful coaching payment.')
        setVerifying(false)
        return
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('verify-coaching-session', {
          body: { session_id: sessionId },
        })

        if (fnError) {
          const parsed = await parseFunctionError(fnError, 'Could not verify coaching access.')
          throw new Error(parsed.message || 'Could not verify coaching access.')
        }

        if (!data?.booking_url) {
          throw new Error('Booking link missing from verification response.')
        }

        if (!active) return
        setBookingUrl(data.booking_url)
        setError('')
      } catch (err) {
        if (!active) return
        setBookingUrl('')
        setError(err.message || 'Could not verify coaching access.')
      } finally {
        if (active) setVerifying(false)
      }
    }

    verifyAccess()
    return () => { active = false }
  }, [canUseDebugBooking, sessionId])

  const hasAccess = Boolean(bookingUrl) && !error

  return (
    <>
      <SEOHead
        title="Coaching confirmed — book your session"
        description="Your coaching payment was received. Pick a time on the calendar."
        path="/privatecoaching/thanks"
        noindex
      />
      <MarketingLayout hideCTA>
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-24">
          <header className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Payment confirmed
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Pick your 60-minute coaching slot below.
            </p>
            {sessionId && (
              <p className="mt-2 text-xs text-slate-400">Reference: {sessionId.slice(-12)}</p>
            )}
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {verifying ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                <h2 className="text-xl font-semibold text-slate-900">Verifying your booking access…</h2>
                <p className="mt-3 text-sm text-slate-500">This usually takes just a moment.</p>
              </div>
            ) : hasAccess ? (
              <>
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-semibold text-slate-900">Choose your time</h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Choose any available 60-minute session without leaving this page.
                  </p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <iframe
                    title="Book your private coaching session"
                    src={embedUrl}
                    className="min-h-[760px] w-full overflow-hidden rounded-xl bg-white"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="camera; microphone; fullscreen; payment"
                  />
                </div>
                {error && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <h2 className="text-2xl font-semibold text-slate-900">Booking access unavailable</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {error || 'We could not verify this payment session.'}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Email inquiries@vibefoxstudio.com if you completed payment and still cannot access your booking page.
                </p>
              </div>
            )}
          </section>
        </div>
      </MarketingLayout>
    </>
  )
}
