import { getAdminEmail, getSupabaseAdminClient, requireAdminUser } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

const DEFAULT_SITE_URL = 'https://vibefoxstudio.com'
const DEFAULT_EXPIRES_MINUTES = 60
const MIN_EXPIRES_MINUTES = 5
const MAX_EXPIRES_MINUTES = 7 * 24 * 60

class ValidationError extends Error {}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBaseUrl(value: unknown) {
  const candidate = cleanText(value)

  if (!candidate) return ''

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

function getBaseUrl(request: Request, body: Record<string, unknown>) {
  return (
    normalizeBaseUrl(body.base_url) ||
    normalizeBaseUrl(request.headers.get('origin')) ||
    normalizeBaseUrl(Deno.env.get('SITE_URL')) ||
    DEFAULT_SITE_URL
  )
}

function parseExpiresInMinutes(value: unknown) {
  const parsed = Number(value ?? DEFAULT_EXPIRES_MINUTES)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ValidationError('Expiry time must be a whole number of minutes.')
  }

  if (parsed < MIN_EXPIRES_MINUTES || parsed > MAX_EXPIRES_MINUTES) {
    throw new ValidationError(`Expiry time must be between ${MIN_EXPIRES_MINUTES} minutes and ${MAX_EXPIRES_MINUTES} minutes.`)
  }

  return parsed
}

function buildShareUrl(baseUrl: string, token: string) {
  return `${baseUrl}/admin/access?token=${encodeURIComponent(token)}`
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const body = await request.json().catch(() => ({}))
  const action = cleanText(body.action)

  try {
    if (action === 'create') {
      const { supabaseAdmin, user } = await requireAdminUser(request)
      const expiresInMinutes = parseExpiresInMinutes(body.expires_in_minutes)
      const label = cleanText(body.label) || null
      const token = crypto.randomUUID()
      const shareUrl = buildShareUrl(getBaseUrl(request, body), token)
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000).toISOString()

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: getAdminEmail(),
        options: { redirectTo: shareUrl },
      })

      if (error || !data.properties?.action_link) {
        return json({ error: error?.message || 'Could not generate an admin login link.' }, 400)
      }

      const { error: insertError } = await supabaseAdmin.from('admin_login_links').insert({
        token,
        label,
        action_link: data.properties.action_link,
        created_by_email: cleanText(user.email).toLowerCase() || getAdminEmail(),
        expires_at: expiresAt,
      })

      if (insertError) {
        return json({ error: insertError.message }, 500)
      }

      return json({
        expires_at: expiresAt,
        label,
        link: shareUrl,
        token,
      })
    }

    if (action === 'resolve') {
      const token = cleanText(body.token)

      if (!token) {
        throw new ValidationError('Link token is required.')
      }

      const supabaseAdmin = getSupabaseAdminClient()
      const { data: link, error } = await supabaseAdmin
        .from('admin_login_links')
        .select('action_link, expires_at, used_at')
        .eq('token', token)
        .maybeSingle()

      if (error) {
        return json({ error: error.message }, 500)
      }

      const isExpired = !link?.expires_at || new Date(link.expires_at).getTime() <= Date.now()

      if (!link || link.used_at || !link.action_link || isExpired) {
        return json({ error: 'This admin access link is no longer valid.' }, 404)
      }

      return json({ action_link: link.action_link })
    }

    if (action === 'consume') {
      const { supabaseAdmin } = await requireAdminUser(request)
      const token = cleanText(body.token)

      if (!token) {
        throw new ValidationError('Link token is required.')
      }

      const { data: link, error: loadError } = await supabaseAdmin
        .from('admin_login_links')
        .select('id')
        .eq('token', token)
        .is('used_at', null)
        .maybeSingle()

      if (loadError) {
        return json({ error: loadError.message }, 500)
      }

      if (!link) {
        return json({ ok: true })
      }

      const { error: updateError } = await supabaseAdmin
        .from('admin_login_links')
        .update({
          action_link: null,
          used_at: new Date().toISOString(),
        })
        .eq('id', link.id)

      if (updateError) {
        return json({ error: updateError.message }, 500)
      }

      return json({ ok: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected admin link error.'
    const status = message === 'Unauthorized'
      ? 401
      : message === 'Forbidden'
        ? 403
        : error instanceof ValidationError
          ? 400
          : 500

    return json({ error: message }, status)
  }
})
