import { getAdminEmail } from './auth.ts'

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface NotifyAdminParams {
  subject: string
  html: string
  from?: string
}

/**
 * Send an email notification to the admin via Resend.
 * Best-effort: returns a warning string on failure instead of throwing.
 */
export async function notifyAdmin(params: NotifyAdminParams): Promise<string | null> {
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()

  if (!resendKey) {
    const warning = 'RESEND_API_KEY not set — email notification skipped.'
    console.warn('notifyAdmin', warning)
    return warning
  }

  const adminEmail = getAdminEmail()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from ?? 'VibeFox Studio <notifications@vibefoxstudio.com>',
        to: adminEmail,
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      const warning = `Resend error (${res.status}): ${text}`
      console.error('notifyAdmin', warning)
      return warning
    }

    return null
  } catch (error) {
    const warning = error instanceof Error ? error.message : 'Email notification failed.'
    console.error('notifyAdmin', { message: warning })
    return warning
  }
}

/** Build a simple HTML notification body from key-value pairs */
export function buildNotificationHtml(fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return rows
}
