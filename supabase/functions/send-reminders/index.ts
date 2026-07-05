// Supabase Edge Function: send-reminders
// Runs on a daily cron schedule OR can be triggered manually for a specific appointment.
//
// Cron setup in supabase/config.toml:
//   [functions.send-reminders]
//   schedule = "0 7 * * *"   # Daily at 7:00 AM UTC
//
// Environment variables required (set in Supabase dashboard):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER
//   SUPABASE_URL  (auto-set)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-set)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendSMS(to: string, body: string): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`)}`,
    },
    body: params.toString(),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    console.error('Twilio error:', JSON.stringify(errBody))
  }
  return res.ok
}

Deno.serve(async (req) => {
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const specificAppointmentId: string | null = body?.appointmentId ?? null

    // --- REMINDER_ENGINE ---
    // Query appointments WHERE date = tomorrow AND reminder_sent = FALSE
    // OR if a specific appointmentId was passed (manual trigger from provider)

    let query = supabase
      .from('appointments')
      .select(`
        id, datetime, status, location, reminder_sent,
        patient:patient_id (id, name, phone),
        provider:provider_id (id, name)
      `)
      .eq('reminder_sent', false)
      .eq('status', 'upcoming')

    if (specificAppointmentId) {
      query = query.eq('id', specificAppointmentId)
    } else {
      // Target appointments exactly 3 days from now
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const dateStr = threeDaysFromNow.toISOString().split('T')[0]
      query = query
        .gte('datetime', `${dateStr}T00:00:00Z`)
        .lt('datetime', `${dateStr}T23:59:59Z`)
    }

    const { data: appointments, error } = await query
    if (error) throw error

    const results: Array<{ appointmentId: string; status: string; phone?: string }> = []

    for (const appt of appointments ?? []) {
      const patient = appt.patient as any
      const provider = appt.provider as any
      const phone: string | null = patient?.phone ?? null

      if (!phone) {
        results.push({ appointmentId: appt.id, status: 'skipped_no_phone' })
        continue
      }

      const time = new Date(appt.datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const date = new Date(appt.datetime).toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })
      const messageBody = `Reminder: Your antenatal appointment is in 3 days (${date}) at ${time} with ${provider?.name ?? 'your provider'} at ${appt.location ?? 'the health facility'}. Please attend. – MHealth`

      const sent = await sendSMS(phone, messageBody)

      if (sent) {
        // Update reminder_sent = TRUE
        await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)

        // Log to reminders table
        await supabase.from('reminders').insert({
          appointment_id: appt.id,
          delivery_status: 'sent',
          phone_number: phone,
        })

        results.push({ appointmentId: appt.id, status: 'sent', phone })
      } else {
        // Log failure
        await supabase.from('reminders').insert({
          appointment_id: appt.id,
          delivery_status: 'failed',
          phone_number: phone,
        })
        results.push({ appointmentId: appt.id, status: 'failed', phone })
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Reminder engine error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err), detail: JSON.stringify(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
