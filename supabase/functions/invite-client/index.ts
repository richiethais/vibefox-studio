import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_EMAIL = 'richie@vibefoxstudio.com'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || user?.email !== ADMIN_EMAIL) {
    return new Response('Forbidden', { status: 403 })
  }

  const { email, name } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ id: data.user.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
