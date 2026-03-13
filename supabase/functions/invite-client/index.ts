import { requireAdminUser } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const { supabaseAdmin } = await requireAdminUser(req)
    const { email, name } = await req.json()

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: 'https://vibefoxstudio.com/client/login',
    })

    if (error) {
      return json({ error: error.message }, 400)
    }

    return json({ id: data.user.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invite error.'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500
    return json({ error: message }, status)
  }
})
