import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_ADMIN_EMAIL = 'richiethais@gmail.com'

export function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getAdminEmail() {
  return (Deno.env.get('ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL).trim().toLowerCase()
}

export async function requireAdminUser(request: Request) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const supabaseAdmin = getSupabaseAdminClient()
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  if ((user.email || '').trim().toLowerCase() !== getAdminEmail()) {
    throw new Error('Forbidden')
  }

  return { supabaseAdmin, user }
}
