import { SITE_URL } from '../src/lib/publicSeo.js'
import { fetchInvoiceByToken, getInvoiceSeo } from '../src/lib/invoiceSeo.js'

export const config = { runtime: 'edge' }

function escapeAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Rewrites the meta tags in the built index.html so the invoice link previews
// the payment, while leaving the SPA script/style tags intact so real visitors
// still get the interactive React invoice page.
function applyInvoiceMeta(html, seo) {
  const canonical = `${SITE_URL}${seo.path}`
  const title = escapeAttr(seo.title)
  const description = escapeAttr(seo.description)
  const image = escapeAttr(seo.image)

  const replacements = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`],
    [/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`],
    [/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`],
    [/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="website"`],
    [/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`],
    [/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`],
    [/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`],
    [/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`],
    [/<meta property="og:image:alt" content="[^"]*"/, `<meta property="og:image:alt" content="${title}"`],
    [/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`],
    [/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`],
    [/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${image}"`],
    // Keep payment links out of search results.
    [/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="noindex,nofollow"`],
  ]

  let next = html
  for (const [pattern, value] of replacements) {
    next = next.replace(pattern, value)
  }

  if (!/<meta property="og:image:width"/.test(next)) {
    next = next.replace(
      '</head>',
      '    <meta property="og:image:width" content="1200" />\n' +
      '    <meta property="og:image:height" content="630" />\n  </head>',
    )
  }

  return next
}

function renderFallback(seo) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="canonical" href="${SITE_URL}${seo.path}" />
    <meta name="robots" content="noindex,nofollow" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttr(seo.title)}" />
    <meta property="og:description" content="${escapeAttr(seo.description)}" />
    <meta property="og:url" content="${SITE_URL}${seo.path}" />
    <meta property="og:image" content="${escapeAttr(seo.image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(seo.title)}" />
    <meta name="twitter:description" content="${escapeAttr(seo.description)}" />
    <meta name="twitter:image" content="${escapeAttr(seo.image)}" />
    <title>${escapeAttr(seo.title)}</title>
    <meta name="description" content="${escapeAttr(seo.description)}" />
  </head>
  <body style="margin:0;background:#f5f3f0;color:#18181a;font-family:system-ui,sans-serif;">
    <noscript>Open this invoice at <a href="${SITE_URL}${seo.path}">${SITE_URL}${seo.path}</a></noscript>
    <script>window.location.replace(${JSON.stringify(seo.path)})</script>
  </body>
</html>`
}

export default async function handler(request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  const invoice = await fetchInvoiceByToken({
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    token,
  })
  const seo = getInvoiceSeo(invoice, token)

  let body
  try {
    // Pull the deployed SPA shell so the React app still boots for real visitors.
    const shell = await fetch(`${url.origin}/index.html`, {
      headers: { 'x-invoice-meta': '1' },
    })
    if (!shell.ok) throw new Error(`shell ${shell.status}`)
    body = applyInvoiceMeta(await shell.text(), seo)
  } catch {
    body = renderFallback(seo)
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Short edge cache; invoice state (paid/unpaid) can change.
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
