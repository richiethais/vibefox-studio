import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const result = {
    env: {
      hasAdminEmail: Boolean(Deno.env.get('ADMIN_EMAIL')?.trim()),
      hasStripeSecretKey: Boolean(Deno.env.get('STRIPE_SECRET_KEY')?.trim()),
      hasSupabaseServiceRoleKey: Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()),
      hasSupabaseUrl: Boolean(Deno.env.get('SUPABASE_URL')?.trim()),
    },
    stripe: { error: null as string | null, ok: false },
    supabase: { error: null as string | null, ok: false },
  }

  try {
    const stripe = getStripeClient()
    await stripe.accounts.retrieve()
    result.stripe.ok = true
  } catch (error) {
    result.stripe.error = error instanceof Error ? error.message : 'Unknown Stripe error.'
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient()
    const { error } = await supabaseAdmin.from('clients').select('id', { head: true, count: 'exact' })
    if (error) {
      result.supabase.error = error.message
    } else {
      result.supabase.ok = true
    }
  } catch (error) {
    result.supabase.error = error instanceof Error ? error.message : 'Unknown Supabase error.'
  }

  return json(result)
})
