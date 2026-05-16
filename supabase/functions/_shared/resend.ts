import { getAdminEmail } from './auth.ts'

export function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/**
 * Send an email to an arbitrary recipient via Resend.
 * Best-effort: returns a warning string on failure instead of throwing.
 */
export async function sendEmail(params: SendEmailParams): Promise<string | null> {
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim()

  if (!resendKey) {
    const warning = 'RESEND_API_KEY not set — email send skipped.'
    console.warn('sendEmail', warning)
    return warning
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from ?? 'VibeFox Studio <notifications@vibefoxstudio.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      const warning = `Resend error (${res.status}): ${text}`
      console.error('sendEmail', warning)
      return warning
    }

    return null
  } catch (error) {
    const warning = error instanceof Error ? error.message : 'Email send failed.'
    console.error('sendEmail', { message: warning })
    return warning
  }
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
  const adminEmail = getAdminEmail()
  return sendEmail({ to: adminEmail, subject: params.subject, html: params.html, from: params.from })
}

/** Build a simple HTML notification body from key-value pairs */
export function buildNotificationHtml(fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return rows
}
