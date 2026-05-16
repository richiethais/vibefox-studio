import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const DEFAULT_BOOKING_URL = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'

function getBookingPopupUrl(bookingUrl) {
  try {
    const url = new URL(bookingUrl)
    const path = url.pathname.replace(/\/+$/, '')
    return `https://app.cal.com${path}/embed?embed=coachingThanks&embedType=modal&layout=month_view`
  } catch {
    return bookingUrl
  }
}

export default function PrivateCoachingThanksPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const debugBooking = params.get('debug_booking') === '1'
  const [bookingUrl, setBookingUrl] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(true)
  const [popupError, setPopupError] = useState('')

  const canUseDebugBooking = import.meta.env.DEV && debugBooking
  const bookingPopupUrl = getBookingPopupUrl(bookingUrl)

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

  function openBookingPopup() {
    if (!bookingPopupUrl) return

    setPopupError('')

    const popup = window.open(
      bookingPopupUrl,
      'vibefox-coaching-booking',
      'popup=yes,width=1180,height=920,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes'
    )

    if (popup) {
      popup.focus()
      return
    }

    setPopupError('Your browser blocked the popup. Opening the secure booking page in this tab instead.')
    window.location.href = bookingPopupUrl
  }

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
                    Open your secure booking calendar and choose any available 60-minute session.
                  </p>
                </div>
                <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">Book your 60-minute session</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This opens the booking calendar in a focused popup so you can schedule immediately after payment.
                  </p>
                  <button
                    type="button"
                    onClick={openBookingPopup}
                    className="mt-5 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: '#0f172a' }}
                  >
                    Open secure booking popup
                  </button>
                  <p className="mt-3 text-xs text-slate-500">
                    If your browser blocks popups, the secure booking page will open in the current tab instead.
                  </p>
                </div>
                {popupError && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {popupError}
                  </div>
                )}
                {error && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {error}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <a
                    href={bookingPopupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: '#0f172a' }}
                  >
                    Open booking in a new tab
                  </a>
                </div>
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
