import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const supabaseAdmin = getSupabaseAdminClient()

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return json({ created: false })
  }

  const email = user.email ?? ''
  const name = user.user_metadata?.name || email.split('@')[0]

  const { error: insertError } = await supabaseAdmin.from('clients').insert({
    user_id: user.id,
    email,
    name,
    plan: 'starter',
    status: 'active',
  })

  if (insertError) {
    return json({ error: insertError.message }, 400)
  }

  return json({ created: true })
})
