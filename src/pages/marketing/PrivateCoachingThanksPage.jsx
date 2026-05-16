import { useSearchParams } from 'react-router-dom'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import SEOHead from '../../components/SEOHead'

const CAL_LINK = 'https://cal.com/vibefoxcoaching/private-coaching-consultation'
const BRAND_ACCENT = '#b8906a'

export default function PrivateCoachingThanksPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  return (
    <>
      <SEOHead
        title="Coaching confirmed — book your session"
        description="Your coaching payment was received. Pick a time on the calendar."
        path="/privatecoaching/thanks"
        noindex
      />
      <MarketingLayout hideCTA>
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-24">
          <header className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Payment confirmed
            </h1>
            <p className="mx-auto max-w-xl text-lg text-slate-600">
              Pick a 60-minute slot below. You'll also get a confirmation email with this link.
            </p>
            {sessionId && (
              <p className="mt-2 text-xs text-slate-400">Reference: {sessionId.slice(-12)}</p>
            )}
          </header>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <iframe
              src={`${CAL_LINK}?embed=true`}
              title="Book your coaching session"
              className="h-[750px] w-full border-0"
            />
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Calendar not loading?{' '}
            <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: BRAND_ACCENT }}>
              Book here directly
            </a>
            {' '}or visit {CAL_LINK}
          </p>
        </div>
      </MarketingLayout>
    </>
  )
}
