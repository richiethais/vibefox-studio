import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import FAQ from '../../components/FAQ'

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: "What's included in a typical project?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every project includes design, development, launch, and two rounds of revisions. We handle domain connection, SSL, and hosting setup. Growth plans are optional but recommended to keep everything running after launch.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does a project take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Landing pages go live in 3\u20135 business days. Full websites take 1\u20132 weeks. Custom web apps with databases and user auth run 3\u20136 weeks depending on scope. A clear timeline is agreed before any work starts.',
        },
      },
      {
        '@type': 'Question',
        name: 'What counts as a "minor update" in the growth plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Minor updates include text changes, phone numbers, hours, adding a photo, and small copy edits. Structural changes \u2014 new pages, new sections, new features \u2014 are quoted separately. Full redesigns are separate projects starting at $1,500.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to sign a long-term contract?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Growth plans are month-to-month and can be cancelled with 30 days notice. Project work is billed 50% upfront, 50% on delivery. No lock-in, no surprises.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can you build something with user login and a database?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We build full-stack apps with user auth, real-time data, file uploads, and secure per-user access. Booking systems, client portals, internal tools \u2014 all in scope. Custom app quotes start at $4,000.',
        },
      },
    ],
  }

  return (
    <MarketingLayout>
      <SEOHead
        title="VibefoxStudio FAQ | Jacksonville Digital Marketing Questions"
        description="Answers to common SEO, website, and digital marketing questions for Jacksonville businesses evaluating agency partners."
        path="/faq"
        keywords="digital marketing faq jacksonville florida, seo agency questions, jacksonville marketing support, best digital marketing agency in jacksonville florida"
        structuredData={faqSchema}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions business owners ask before they invest in growth."
        sub="Clear answers about SEO, web strategy, timelines, and support from a Jacksonville-focused VibefoxStudio digital marketing team."
      />

      <FAQ hideHeader />
    </MarketingLayout>
  )
}
