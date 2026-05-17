import { getSupabaseAdminClient } from '../_shared/auth.ts'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getStripeClient } from '../_shared/stripe.ts'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeIso(value: unknown) {
  const candidate = cleanText(value)
  if (!candidate) return null

  const date = new Date(candidate)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const sessionId = cleanText(body.session_id)
    const bookingUid = cleanText(body.booking_uid)
    const bookingStartAt = normalizeIso(body.booking_start_at)
    const bookingEndAt = normalizeIso(body.booking_end_at)

    if (!sessionId) {
      return json({ error: 'Session ID is required.' }, 400)
    }

    if (!bookingUid) {
      return json({ error: 'Booking UID is required.' }, 400)
    }

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const inquiryId = cleanText(session.metadata?.inquiry_id)

    if (!inquiryId) {
      return json({ error: 'Invalid coaching session.' }, 403)
    }

    if (session.payment_status !== 'paid') {
      return json({ error: 'Payment has not been confirmed yet.' }, 403)
    }

    const supabaseAdmin = getSupabaseAdminClient()
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .select('id, form_key, status, stripe_session_id, cal_booking_uid, booked_at')
      .eq('id', inquiryId)
      .maybeSingle()

    if (inquiryError || !inquiry) {
      return json({ error: 'Coaching inquiry not found.' }, 404)
    }

    if (cleanText(inquiry.form_key) !== 'coaching') {
      return json({ error: 'Invalid coaching inquiry.' }, 403)
    }

    if (cleanText(inquiry.stripe_session_id) && cleanText(inquiry.stripe_session_id) !== sessionId) {
      return json({ error: 'Session mismatch.' }, 403)
    }

    const existingBookingUid = cleanText(inquiry.cal_booking_uid)

    if (inquiry.status === 'booked' || existingBookingUid) {
      if (existingBookingUid && existingBookingUid !== bookingUid) {
        return json({ error: 'This coaching payment has already been used to schedule a session.' }, 409)
      }

      return json({
        already_booked: true,
        booking_uid: existingBookingUid || bookingUid,
        booked_at: inquiry.booked_at,
        ok: true,
      })
    }

    const { error: updateError } = await supabaseAdmin
      .from('inquiries')
      .update({
        status: 'booked',
        booked_at: inquiry.booked_at || new Date().toISOString(),
        cal_booking_uid: bookingUid,
        cal_booking_start_at: bookingStartAt,
        cal_booking_end_at: bookingEndAt,
      })
      .eq('id', inquiryId)
      .in('status', ['paid', 'pending_payment'])
      .is('cal_booking_uid', null)

    if (updateError) {
      console.error('complete-coaching-booking update failed', updateError)
      return json({ error: 'Could not finalize coaching booking.' }, 500)
    }

    const { data: updated, error: updatedError } = await supabaseAdmin
      .from('inquiries')
      .select('status, booked_at, cal_booking_uid')
      .eq('id', inquiryId)
      .maybeSingle()

    if (updatedError || !updated) {
      return json({ error: 'Could not load coaching booking state.' }, 500)
    }

    if (cleanText(updated.cal_booking_uid) !== bookingUid) {
      return json({ error: 'This coaching payment has already been used to schedule a session.' }, 409)
    }

    return json({
      already_booked: false,
      booking_uid: bookingUid,
      booked_at: updated.booked_at,
      ok: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected booking completion error.'
    console.error('complete-coaching-booking failed', { message })
    return json({ error: 'Could not finalize coaching booking.' }, 500)
  }
})
