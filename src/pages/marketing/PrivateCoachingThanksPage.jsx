import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Cal, { getCalApi } from '@calcom/embed-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'
import useIsMobile from '../../components/useIsMobile'
import { supabase } from '../../lib/supabase'
import { parseFunctionError } from '../../lib/supabaseFunctions'

const DEFAULT_BOOKING_URL = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'
const CAL_NAMESPACE = 'private-coaching-thanks'
const CAL_THEME_VARS = {
  light: {
    'cal-brand': '#b8906a',
    'cal-brand-emphasis': '#a57d57',
    'cal-brand-text': '#ffffff',
    'cal-brand-subtle': '#e6d7c7',
    'cal-brand-accent': '#ffffff',
    'cal-text': '#3a3840',
    'cal-text-emphasis': '#18181a',
    'cal-text-subtle': '#7a7888',
    'cal-text-muted': '#a6a2ad',
    'cal-bg': '#fffdfb',
    'cal-bg-emphasis': '#f3ebe3',
    'cal-bg-subtle': '#faf6f1',
    'cal-bg-muted': '#f5efe8',
    'cal-border': 'rgba(184, 144, 106, 0.24)',
    'cal-border-subtle': 'rgba(184, 144, 106, 0.18)',
    'cal-border-booker': 'rgba(184, 144, 106, 0.18)',
    'cal-border-booker-width': '1px',
    'radius': '10px',
    'radius-md': '14px',
    'radius-lg': '18px',
    'radius-xl': '22px',
    'radius-2xl': '24px',
    'radius-3xl': '28px',
  },
}

function getCalConfig(isMobile) {
  return {
    layout: isMobile ? 'column_view' : 'month_view',
    theme: 'light',
    name: '',
    email: '',
  }
}

function getEmbedHeight(isMobile) {
  return isMobile ? 'min(88vw, 360px)' : '860px'
}

function getEmbedMaxWidth(isMobile) {
  return isMobile ? '420px' : '1200px'
}

function getEmbedClassName(isMobile) {
  return [
    'w-full overflow-hidden rounded-xl bg-white',
    isMobile ? 'aspect-square' : 'h-[860px]',
  ].join(' ')
}

function getUiConfig(isMobile) {
  return {
    hideEventTypeDetails: true,
    showTimezoneWhenEventDetailsHidden: true,
    layout: isMobile ? 'column_view' : 'month_view',
    cssVarsPerTheme: CAL_THEME_VARS,
  }
}

const CAL_BASE_CONFIG = {
  theme: 'light',
}

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

function getCalLink(bookingUrl) {
  try {
    const normalizedUrl = normalizeBookingUrl(bookingUrl)
    if (!normalizedUrl) return ''

    const url = new URL(normalizedUrl)
    return url.pathname.replace(/^\/+|\/+$/g, '')
  } catch {
    return ''
  }
}

export default function PrivateCoachingThanksPage() {
  const [params] = useSearchParams()
  const isMobile = useIsMobile()
  const sessionId = params.get('session_id')
  const debugBooking = params.get('debug_booking') === '1'
  const [bookingUrl, setBookingUrl] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(true)
  const [embedError, setEmbedError] = useState('')
  const [alreadyBooked, setAlreadyBooked] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)
  const [finalizingBooking, setFinalizingBooking] = useState(false)

  const canUseDebugBooking = import.meta.env.DEV && debugBooking
  const calLink = getCalLink(bookingUrl)
  const embedUrl = getEmbedUrl(bookingUrl)
  const calConfig = getCalConfig(isMobile)
  const embedHeight = getEmbedHeight(isMobile)
  const embedMaxWidth = getEmbedMaxWidth(isMobile)
  const embedClassName = getEmbedClassName(isMobile)

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

        if (data?.already_booked) {
          if (!active) return
          setBookingUrl('')
          setAlreadyBooked(true)
          setBookingDetails(data.booking || null)
          setError('')
          return
        }

        if (!data?.booking_url) {
          throw new Error('Booking link missing from verification response.')
        }

        if (!active) return
        setBookingUrl(data.booking_url)
        setAlreadyBooked(false)
        setBookingDetails(null)
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

  const hasAccess = Boolean(bookingUrl) && !error && !alreadyBooked

  useEffect(() => {
    if (!hasAccess || !calLink) return

    let cancelled = false
    let ready = false
    let completionStarted = false
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !ready) {
        setEmbedError('The inline calendar is taking longer than expected. If it does not appear, use the direct booking link below.')
      }
    }, 8000)

    async function configureEmbed() {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE })
      if (cancelled) return

      cal('ui', getUiConfig(isMobile))

      cal('on', {
        action: 'linkReady',
        callback: () => {
          ready = true
          if (!cancelled) setEmbedError('')
        },
      })

      cal('on', {
        action: 'linkFailed',
        callback: () => {
          ready = false
          if (!cancelled) {
            setEmbedError('The booking calendar could not be loaded inline. Use the direct booking link below.')
          }
        },
      })

      cal('on', {
        action: 'bookingSuccessfulV2',
        callback: async event => {
          const payload = event?.detail?.data || event?.data || {}
          const bookingUid = payload?.uid || ''

          if (!sessionId || !bookingUid || cancelled || completionStarted) return

          completionStarted = true
          setFinalizingBooking(true)
          setEmbedError('')

          try {
            const { data, error: fnError } = await supabase.functions.invoke('complete-coaching-booking', {
              body: {
                session_id: sessionId,
                booking_uid: bookingUid,
                booking_start_at: payload?.startTime || null,
                booking_end_at: payload?.endTime || null,
              },
            })

            if (fnError) {
              const parsed = await parseFunctionError(fnError, 'Could not finalize coaching booking.')
              throw new Error(parsed.message || 'Could not finalize coaching booking.')
            }

            if (cancelled) return

            setAlreadyBooked(true)
            setBookingUrl('')
            setBookingDetails({
              uid: data?.booking_uid || bookingUid,
              start_at: payload?.startTime || null,
              end_at: payload?.endTime || null,
            })
            setError('')
          } catch (err) {
            if (!cancelled) {
              setEmbedError(err.message || 'Your booking was made, but we could not lock this session yet. Please refresh before trying again.')
            }
          } finally {
            if (!cancelled) setFinalizingBooking(false)
          }
        },
      })
    }

    setEmbedError('')
    configureEmbed().catch(() => {
      if (!cancelled) {
        setEmbedError('The booking calendar could not be loaded inline. Use the direct booking link below.')
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [calLink, hasAccess, isMobile, sessionId])

  return (
    <>
      <SEOHead
        title="Coaching confirmed — book your session"
        description="Your coaching payment was received. Pick a time on the calendar."
        path="/privatecoaching/thanks"
        noindex
      />
      <MarketingLayout hideCTA>
        <div className="mx-auto max-w-[1320px] px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
          <header className="mb-6 text-center sm:mb-10">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 sm:mb-3 sm:text-4xl">
              Payment confirmed
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Pick your 60-minute coaching slot below.
            </p>
            {sessionId && (
              <p className="mt-2 text-xs text-slate-400">Reference: {sessionId.slice(-12)}</p>
            )}
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {verifying ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                <h2 className="text-xl font-semibold text-slate-900">Verifying your booking access…</h2>
                <p className="mt-3 text-sm text-slate-500">This usually takes just a moment.</p>
              </div>
            ) : alreadyBooked ? (
              <div className="py-10 text-center sm:py-14">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">Your session is already booked</h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  This private coaching payment can only be used once, and your booking link has been locked.
                </p>
                {bookingDetails?.start_at && (
                  <p className="mt-4 text-sm font-medium text-slate-900">
                    Scheduled for {new Date(bookingDetails.start_at).toLocaleString()}
                  </p>
                )}
                <p className="mt-4 text-xs text-slate-500">
                  Need to change your time? Email inquiries@vibefoxstudio.com and we’ll help you reschedule.
                </p>
              </div>
            ) : hasAccess ? (
              <>
                <div className="mb-4 text-center sm:mb-5">
                  <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Choose your time</h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Choose any available 60-minute session without leaving this page.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
                  <div className="mx-auto overflow-hidden rounded-xl bg-white" style={{ maxWidth: embedMaxWidth }}>
                    <Cal
                      namespace={CAL_NAMESPACE}
                      calLink={calLink}
                      className={embedClassName}
                      style={{ width: '100%', height: embedHeight, overflow: 'auto' }}
                      config={{ ...CAL_BASE_CONFIG, ...calConfig }}
                    />
                  </div>
                </div>
                {embedError && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {embedError}
                  </div>
                )}
                {finalizingBooking && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Finalizing your booking…
                  </div>
                )}
                {error && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {error}
                  </div>
                )}
                {embedError && (
                  <div className="mt-6 text-center">
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: '#0f172a' }}
                    >
                      Open booking directly
                    </a>
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
