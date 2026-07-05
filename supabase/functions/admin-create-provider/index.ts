// Edge Function: admin-create-provider
//
// Creates a provider login account on behalf of the hospital admin. Provider
// self-registration is disabled, so this is how new providers are onboarded.
//
// Security: the caller must present a valid session whose user has role='admin'
// in public.users. Only then does the function use the service-role key to
// create the auth user + users row + providers row.
//
// Required secrets (auto-provided by Supabase): SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Authenticate the caller and require the admin role.
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!jwt) return json({ error: 'Missing authorization.' }, 401)

    const { data: caller, error: callerErr } = await admin.auth.getUser(jwt)
    if (callerErr || !caller?.user) return json({ error: 'Invalid session.' }, 401)

    const { data: callerRow } = await admin
      .from('users').select('role').eq('id', caller.user.id).single()
    if (callerRow?.role !== 'admin') return json({ error: 'Admin access required.' }, 403)

    // 2. Validate input.
    const { name, email, phone, specialty, password } = await req.json()
    if (!name || !email || !password) {
      return json({ error: 'Name, email and password are required.' }, 400)
    }
    if (String(password).length < 8) {
      return json({ error: 'Password must be at least 8 characters.' }, 400)
    }

    // 3. Create the auth user (email pre-confirmed so they can sign in now).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: 'provider' },
    })
    if (createErr || !created?.user) {
      return json({ error: createErr?.message || 'Could not create the account.' }, 400)
    }
    const id = created.user.id

    // 4. Profile rows. Roll back the auth user if either insert fails so we
    //    never leave an orphaned/half-created account.
    const { error: uErr } = await admin.from('users')
      .insert({ id, email, name, phone, role: 'provider' })
    if (uErr) {
      await admin.auth.admin.deleteUser(id)
      return json({ error: uErr.message }, 400)
    }

    const { error: pErr } = await admin.from('providers')
      .insert({ user_id: id, specialty: specialty || null, status: 'active' })
    if (pErr) {
      await admin.auth.admin.deleteUser(id)
      return json({ error: pErr.message }, 400)
    }

    return json({ id, name, email, phone, specialty: specialty || '', status: 'active', role: 'provider' })
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unexpected error.' }, 500)
  }
})
