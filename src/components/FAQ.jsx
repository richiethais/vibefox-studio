import { useState } from 'react'
import { useFadeUp } from './useFadeUp'
import Eyebrow from './Eyebrow'
import { h2Style } from './sectionStyles'
import useIsMobile from './useIsMobile'

const faqs = [
  { q: "What's included in a typical project?", a: "Every project includes design, development, launch, and two rounds of revisions. We handle domain connection, SSL, and hosting setup. Retainer plans are optional but recommended to keep everything running after launch." },
  { q: "How long does a project take?", a: "Landing pages go live in 3–5 business days. Full websites take 1–2 weeks. Custom web apps with databases and user auth run 3–6 weeks depending on scope. A clear timeline is agreed before any work starts." },
  { q: "What counts as a \"minor update\" in the retainer?", a: "Minor updates include text changes, phone numbers, hours, adding a photo, and small copy edits. Structural changes — new pages, new sections, new features — are quoted separately. Full redesigns are separate projects starting at $1,500." },
  { q: "Do I need to sign a long-term contract?", a: "No. Retainer plans are month-to-month and can be cancelled with 30 days notice. Project work is billed 50% upfront, 50% on delivery. No lock-in, no surprises." },
  { q: "Can you build something with user login and a database?", a: "Yes. We build full-stack apps with user auth, real-time data, file uploads, and secure per-user access. Booking systems, client portals, internal tools — all in scope. Custom app quotes start at $4,000." },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)
  const ref = useFadeUp()
  const isMobile = useIsMobile()

  return (
    <section id="faq" ref={ref} style={{ padding: isMobile ? '80px 18px' : '96px 40px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Eyebrow>Common questions</Eyebrow>
        <h2 className="fade-up d1" style={{ ...h2Style, fontSize: isMobile ? 'clamp(30px, 10vw, 44px)' : h2Style.fontSize, letterSpacing: isMobile ? '-1px' : h2Style.letterSpacing }}>Everything you need <em style={{ fontStyle: 'italic', color: '#b8906a' }}>to know.</em></h2>

        <div className="fade-up d2" style={{ marginTop: isMobile ? 36 : 52, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  padding: isMobile ? '18px 0' : '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                  fontSize: isMobile ? 14 : 15, fontWeight: 500, color: open === i ? '#b8906a' : '#18181a',
                  fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.2px', transition: 'color 0.18s',
                }}
              >
                {faq.q}
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: open === i ? 'white' : '#7a7888', flexShrink: 0,
                  background: open === i ? '#18181a' : '#f5f3f0',
                  transform: open === i ? 'rotate(45deg)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}>+</span>
              </button>
              <div style={{
                maxHeight: open === i ? 220 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1)',
              }}>
                <p style={{ paddingBottom: 22, fontSize: isMobile ? 14 : 14.5, color: '#7a7888', lineHeight: 1.68, maxWidth: 580, fontWeight: 300, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
