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
const CREAM = '#f3ede1'
const MUTED = '#7a7888'
const GOLD = '#c8a97e'
const GOLD2 = '#b8906a'
const HAIRLINE = 'rgba(184,144,106,0.38)'

// Fetch a Google font binary. An old UA forces a Satori-compatible format
// (ttf/otf/woff) rather than woff2, which Satori cannot parse.
async function loadGoogleFont(query) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)' },
    })
  ).text()
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype|woff)['"]?\)/)
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
  return { label: 'Unpaid', color: GOLD2 }
}

// Scale the serif amount so longer totals stay on one line.
function amountFontSize(amount) {
  const len = amount.length
  if (len <= 7) return 150
  if (len <= 9) return 128
  if (len <= 11) return 106
  return 88
}

const diamond = (size, color, mr) =>
  h('div', {
    style: { display: 'flex', width: `${size}px`, height: `${size}px`, background: color, transform: 'rotate(45deg)', marginRight: `${mr}px` },
  })

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
    { style: { width: '1200px', height: '630px', display: 'flex', fontFamily: 'DM Sans' } },
    // Left — dark editorial sidebar
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '400px',
          background: 'linear-gradient(160deg, #1f1e23 0%, #2c2934 100%)',
          padding: '64px 56px',
          justifyContent: 'space-between',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        diamond(13, GOLD, 16),
        h('div', { style: { display: 'flex', fontFamily: 'DM Serif Display', fontSize: '34px', color: CREAM } }, 'Vibefox'),
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { display: 'flex', fontFamily: 'DM Serif Display', fontSize: '44px', color: GOLD } }, paid ? 'Receipt' : 'Invoice'),
        h('div', { style: { display: 'flex', fontSize: '21px', color: '#9a96a4', marginTop: '10px' } }, 'Vibefox Studio'),
      ),
    ),
    // Right — cream panel with the amount
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          background: 'linear-gradient(140deg, #faf9f7 0%, #f1ece4 100%)',
          padding: '66px 70px',
          justifyContent: 'space-between',
        },
      },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'flex-end' } },
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
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              fontSize: '23px',
              fontWeight: 600,
              color: GOLD2,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: '16px',
            },
          },
          paid ? 'Amount paid' : 'Amount due',
        ),
        h(
          'div',
          { style: { display: 'flex', fontFamily: 'DM Serif Display', fontSize: `${amountFontSize(amount)}px`, lineHeight: 1, color: INK } },
          amount,
        ),
        h('div', { style: { display: 'flex', fontSize: '34px', fontWeight: 500, color: INK, marginTop: '30px' } }, who),
        h('div', { style: { display: 'flex', fontSize: '23px', color: MUTED, marginTop: '8px' } }, subline),
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { display: 'flex', height: '1px', background: HAIRLINE, marginBottom: '22px' } }),
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', fontSize: '22px', fontWeight: 500, color: GOLD2 } },
            h('div', { style: { display: 'flex', width: '8px', height: '8px', borderRadius: '999px', background: GOLD2, marginRight: '14px' } }),
            paid ? 'Payment received — thank you' : 'Secure online payment',
          ),
          h('div', { style: { display: 'flex', fontSize: '22px', color: MUTED } }, 'vibefoxstudio.com'),
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
