import React from 'react'
import { ImageResponse } from '@vercel/og'
import { SITE_URL } from '../src/lib/publicSeo.js'
import {
  fetchInvoiceByToken,
  formatMoney,
  formatInvoiceDate,
  getPaymentIntervalLabel,
  isInvoicePaid,
} from '../src/lib/invoiceSeo.js'

export const config = { runtime: 'edge' }

const h = React.createElement

// Brand tokens (mirrors tailwind.config.js)
const INK = '#18181a'
const MUTED = '#7a7888'
const GOLD = '#b8906a'
const GOLD_SOFT = 'rgba(184,144,106,0.30)'
const HAIRLINE = 'rgba(184,144,106,0.38)'

// Fetch a Google font as TTF (an old UA forces the non-woff2 format Satori needs).
async function loadGoogleFont(query, text) {
  const url = `https://fonts.googleapis.com/css2?family=${query}${text ? `&text=${encodeURIComponent(text)}` : ''}`
  const css = await (
    await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)' },
    })
  ).text()
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/)
  if (!match) throw new Error('font src not found')
  return (await fetch(match[1])).arrayBuffer()
}

async function loadFonts() {
  try {
    const [serif, sans, sansMedium, sansSemibold] = await Promise.all([
      loadGoogleFont('DM+Serif+Display'),
      loadGoogleFont('DM+Sans:wght@400'),
      loadGoogleFont('DM+Sans:wght@500'),
      loadGoogleFont('DM+Sans:wght@600'),
    ])
    return [
      { name: 'DM Serif Display', data: serif, weight: 400, style: 'normal' },
      { name: 'DM Sans', data: sans, weight: 400, style: 'normal' },
      { name: 'DM Sans', data: sansMedium, weight: 500, style: 'normal' },
      { name: 'DM Sans', data: sansSemibold, weight: 600, style: 'normal' },
    ]
  } catch {
    return [] // Render with the default font rather than failing the preview.
  }
}

function statusPill(invoice) {
  if (isInvoicePaid(invoice)) return { label: 'Paid', color: '#3f7d57' }
  if (invoice?.status === 'overdue') return { label: 'Overdue', color: '#b4543f' }
  return { label: 'Unpaid', color: GOLD }
}

function hairline(extra = {}) {
  return h('div', { style: { display: 'flex', height: '1px', background: HAIRLINE, ...extra } })
}

function buildCard(invoice) {
  const paid = isInvoicePaid(invoice)
  const pill = statusPill(invoice)
  const amount = formatMoney(invoice?.amount, invoice?.currency)
  const who = invoice?.business_name || invoice?.customer_name_snapshot || 'Your account'
  const interval = getPaymentIntervalLabel(invoice?.payment_type, invoice?.billing_interval)
  const dueDate = formatInvoiceDate(invoice?.due_date)
  const subline = dueDate ? `${interval}  ·  Due ${dueDate}` : interval

  return h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f3f0',
        backgroundImage: 'linear-gradient(140deg, #faf9f7 0%, #f1ece4 100%)',
        padding: '78px 84px',
        fontFamily: 'DM Sans',
        color: INK,
      },
    },
    // Header — wordmark + status pill
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        h('div', {
          style: {
            display: 'flex',
            width: '13px',
            height: '13px',
            background: GOLD,
            transform: 'rotate(45deg)',
            marginRight: '20px',
          },
        }),
        h(
          'div',
          { style: { display: 'flex', fontFamily: 'DM Serif Display', fontSize: '42px', color: INK } },
          'Vibefox Studio',
        ),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            padding: '9px 26px',
            border: `1.5px solid ${pill.color}`,
            borderRadius: '999px',
            color: pill.color,
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          },
        },
        pill.label,
      ),
    ),
    hairline({ marginTop: '34px' }),
    // Main — amount block
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'center',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '23px',
            fontWeight: 600,
            color: GOLD,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            marginBottom: '18px',
          },
        },
        paid ? 'Amount paid' : 'Amount due',
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'DM Serif Display',
            fontSize: '158px',
            lineHeight: 1,
            color: INK,
          },
        },
        amount,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '36px',
            fontWeight: 500,
            color: INK,
            marginTop: '34px',
          },
        },
        who,
      ),
      h(
        'div',
        { style: { display: 'flex', fontSize: '24px', color: MUTED, marginTop: '8px' } },
        subline,
      ),
    ),
    // Footer
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      hairline({ marginBottom: '26px' }),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', fontSize: '23px', fontWeight: 500, color: GOLD } },
          h('div', {
            style: {
              display: 'flex',
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: GOLD,
              marginRight: '14px',
            },
          }),
          paid ? 'Payment received — thank you' : 'Secure online payment',
        ),
        h(
          'div',
          { style: { display: 'flex', fontSize: '23px', fontWeight: 500, color: MUTED, letterSpacing: '0.02em' } },
          'vibefoxstudio.com',
        ),
      ),
    ),
  )
}

export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const [invoice, fonts] = await Promise.all([
      fetchInvoiceByToken({
        supabaseUrl: process.env.VITE_SUPABASE_URL,
        supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
        token,
      }),
      loadFonts(),
    ])

    return new ImageResponse(buildCard(invoice), {
      width: 1200,
      height: 630,
      fonts: fonts.length ? fonts : undefined,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch {
    // Never break a link preview — fall back to the default brand image.
    return Response.redirect(`${SITE_URL}/seo-preview.png`, 302)
  }
}
