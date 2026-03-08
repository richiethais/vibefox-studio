import SEOHead from '../../components/SEOHead'
import MarketingLayout from '../../components/marketing/MarketingLayout'
import PageHero from '../../components/marketing/PageHero'
import FAQ from '../../components/FAQ'
import Contact from '../../components/Contact'

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I choose the best digital marketing agency in Jacksonville, Florida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Look for a clear SEO strategy, measurable reporting, local market knowledge, and transparent communication cadence.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer ongoing SEO content publishing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Weekly or monthly blog publishing and on-page optimization are available in growth plans.',
        },
      },
    ],
  }

  return (
    <MarketingLayout>
      <SEOHead
        title="Digital Marketing FAQ | Jacksonville, Florida"
        description="Answers to common SEO, website, and digital marketing questions for Jacksonville businesses evaluating agency partners."
        path="/faq"
        keywords="digital marketing faq jacksonville florida, seo agency questions, jacksonville marketing support"
        structuredData={faqSchema}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions business owners ask before they invest in growth."
        sub="Clear answers about SEO, web strategy, timelines, and support from a Jacksonville-focused digital marketing team."
      />

      <FAQ />
      <Contact />
    </MarketingLayout>
  )
}
