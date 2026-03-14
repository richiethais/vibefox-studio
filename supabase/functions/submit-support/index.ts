import { getSupabaseAdminClient, getAdminEmail } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function sendSupportEmail(params: {
  apiKey: string
  to: string
  clientName: string
  clientEmail: string
  title: string
  description: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VibeFox Studio <support@vibefoxstudio.com>',
      to: params.to,
      subject: `New support request: ${params.title}`,
      html: `
        <p><strong>From:</strong> ${params.clientName || 'Unknown'} &lt;${params.clientEmail}&gt;</p>
        <p><strong>Subject:</strong> ${params.title}</p>
        <hr />
        <p>${params.description.replace(/\n/g, '<br>')}</p>
      `,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error (${res.status}): ${text}`)
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    // Verify the caller is an authenticated (client) user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const supabaseAdmin = getSupabaseAdminClient()

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    // Look up the client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return json({ error: 'Client account not found.' }, 404)
    }

    // Parse and validate form body
    const body = await request.json().catch(() => ({}))
    const title = cleanText(body.title)
    const description = cleanText(body.description)

    if (!title) return json({ error: 'Subject is required.' }, 400)
    if (!description) return json({ error: 'Message is required.' }, 400)

    // Save to requests table
    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from('requests')
      .insert({
        client_id: client.id,
        description,
        status: 'open',
        title,
      })
      .select('id')
      .single()

    if (insertError) {
      return json({ error: insertError.message || 'Could not save support request.' }, 500)
    }

    // Send email (best-effort — failure does not fail the request)
    const adminEmail = getAdminEmail()
    let emailWarning: string | null = null
    const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()

    if (resendKey) {
      try {
        await sendSupportEmail({
          apiKey: resendKey,
          clientEmail: client.email || user.email || '',
          clientName: client.name || '',
          description,
          title,
          to: adminEmail,
        })
      } catch (error) {
        emailWarning = error instanceof Error ? error.message : 'Email notification failed.'
        console.error('submit-support email warning', { message: emailWarning })
      }
    } else {
      emailWarning = 'RESEND_API_KEY not set — email notification skipped.'
      console.warn('submit-support', emailWarning)
    }

    return json({ id: requestRow.id, ok: true, warning: emailWarning })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    console.error('submit-support error', { message })
    return json({ error: message }, 500)
  }
})
