import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { notifyAdmin, buildNotificationHtml } from '../_shared/resend.ts'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    // Verify the caller is an authenticated user
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

    // Parse body
    const body = await request.json().catch(() => ({}))
    const message = cleanText(body.body)

    if (!message) return json({ error: 'Message is required.' }, 400)
    if (message.length > 5000) return json({ error: 'Message must be 5000 characters or less.' }, 400)

    // Insert the message into the messages table
    const { error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({ client_id: client.id, body: message, from_admin: false })

    if (insertError) {
      return json({ error: insertError.message || 'Could not send message.' }, 500)
    }

    // Send email notification (best-effort)
    await notifyAdmin({
      subject: `New message from ${client.name || 'a client'}`,
      html: buildNotificationHtml({
        'From': `${client.name || 'Unknown'} <${client.email || user.email || ''}>`,
        'Message': message,
      }),
    })

    return json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    console.error('notify-message error', { message })
    return json({ error: message }, 500)
  }
})
