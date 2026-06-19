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

const BRAND = '#18181a'
const MUTED = '#7a7888'
const ACCENT = '#b8906a'
const BG = '#f5f3f0'

function statusStyle(invoice) {
  if (isInvoicePaid(invoice)) return { label: 'Paid', bg: '#dcfce7', color: '#16a34a' }
  if (invoice?.status === 'overdue') return { label: 'Overdue', bg: '#fee2e2', color: '#dc2626' }
  return { label: 'Unpaid', bg: '#fef3c7', color: '#d97706' }
}

function buildCard(invoice) {
  const paid = isInvoicePaid(invoice)
  const status = statusStyle(invoice)
  const amount = formatMoney(invoice?.amount, invoice?.currency)
  const who = invoice?.business_name || invoice?.customer_name_snapshot || 'Your account'
  const interval = getPaymentIntervalLabel(invoice?.payment_type, invoice?.billing_interval)
  const dueDate = formatInvoiceDate(invoice?.due_date)

  return h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: BG,
        padding: '72px',
        fontFamily: 'sans-serif',
        color: BRAND,
      },
    },
    // Header: brand + status badge
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '30px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          },
        },
        'vibefox studio',
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            padding: '10px 24px',
            borderRadius: '999px',
            background: status.bg,
            color: status.color,
            fontSize: '24px',
            fontWeight: 600,
          },
        },
        status.label,
      ),
    ),
    // Body: label + amount + recipient
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '26px',
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          },
        },
        paid ? 'Amount paid' : 'Amount due',
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '128px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          },
        },
        amount,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '34px',
            color: BRAND,
            marginTop: '28px',
          },
        },
        who,
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '26px',
            color: MUTED,
            marginTop: '8px',
          },
        },
        dueDate ? `${interval} · Due ${dueDate}` : interval,
      ),
    ),
    // Footer
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '2px solid rgba(0,0,0,0.08)',
          paddingTop: '28px',
          fontSize: '26px',
          color: MUTED,
        },
      },
      h('div', { style: { display: 'flex', color: ACCENT, fontWeight: 600 } },
        paid ? 'Payment received' : 'Pay securely online'),
      h('div', { style: { display: 'flex' } }, 'vibefoxstudio.com'),
    ),
  )
}

export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const invoice = await fetchInvoiceByToken({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
      token,
    })

    return new ImageResponse(buildCard(invoice), {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    // Never break a link preview — fall back to the default brand image.
    return Response.redirect(`${SITE_URL}/seo-preview.png`, 302)
  }
}
