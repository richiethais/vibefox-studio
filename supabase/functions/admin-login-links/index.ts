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
  // 0 means never expires
  const parsed = Number(value ?? DEFAULT_EXPIRES_MINUTES)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ValidationError('Expiry time must be a whole number of minutes.')
  }

  if (parsed === 0) return 0

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

      // 0 = never expires, use year 2099
      const expiresAt = expiresInMinutes === 0
        ? '2099-12-31T23:59:59.999Z'
        : new Date(Date.now() + expiresInMinutes * 60_000).toISOString()

      const { error: insertError } = await supabaseAdmin.from('admin_login_links').insert({
        token,
        label,
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
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!token || !uuidPattern.test(token)) {
        return json({ error: 'This admin access link is no longer valid.' }, 404)
      }

      const supabaseAdmin = getSupabaseAdminClient()
      const { data: link, error } = await supabaseAdmin
        .from('admin_login_links')
        .select('id, expires_at, used_at, revoked_at')
        .eq('token', token)
        .maybeSingle()

      if (error) {
        return json({ error: error.message }, 500)
      }

      const isExpired = !link?.expires_at || new Date(link.expires_at).getTime() <= Date.now()

      if (!link || link.used_at || link.revoked_at || isExpired) {
        return json({ error: 'This admin access link is no longer valid.' }, 404)
      }

      // Generate a fresh magic link at resolve time so it never arrives expired
      const baseUrl = normalizeBaseUrl(body.base_url) ||
        normalizeBaseUrl(Deno.env.get('SITE_URL')) ||
        DEFAULT_SITE_URL
      const redirectUrl = buildShareUrl(baseUrl, token)

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: getAdminEmail(),
        options: { redirectTo: redirectUrl },
      })

      if (linkError || !linkData.properties?.action_link) {
        return json({ error: linkError?.message || 'Could not generate login link.' }, 500)
      }

      return json({ action_link: linkData.properties.action_link })
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
        .update({ used_at: new Date().toISOString() })
        .eq('id', link.id)

      if (updateError) {
        return json({ error: updateError.message }, 500)
      }

      return json({ ok: true })
    }

    if (action === 'revoke-session') {
      const { supabaseAdmin } = await requireAdminUser(request)
      const linkId = cleanText(body.link_id)

      if (!linkId) {
        throw new ValidationError('Link ID is required.')
      }

      const { error: updateError } = await supabaseAdmin
        .from('admin_login_links')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', linkId)

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
