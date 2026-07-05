import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DEMO_USERS, SEED_PATIENTS, SEED_PROVIDERS } from '../data/seedData'

const AuthContext = createContext(null)

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      const saved = localStorage.getItem('mhealth-demo-user')
      if (saved) {
        const u = JSON.parse(saved)
        setUser(u)
        setProfile(u)
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!userData) return
    // Providers carry specialty + status (needed for the approval gate); patients
    // carry their pregnancy profile. Load whichever applies to this role.
    if (userData.role === 'provider') {
      const { data: prov } = await supabase
        .from('providers').select('specialty, status').eq('user_id', userId).single()
      setProfile({ ...userData, ...(prov || {}) })
      return
    }
    const { data: patientData } = await supabase
      .from('patient_profiles')
      .select('gestational_week, due_date, blood_type, gravida, para, assigned_provider_id, location, onboarding_complete, emergency_contact_name, emergency_contact_phone')
      .eq('user_id', userId)
      .single()
    setProfile({ ...userData, ...(patientData || {}) })
  }

  async function signIn(email, password) {
    if (DEMO_MODE) {
      const demo = DEMO_USERS[email]
      if (demo && demo.password === password) {
        const u = { ...demo }
        delete u.password
        localStorage.setItem('mhealth-demo-user', JSON.stringify(u))
        setUser(u)
        setProfile(u)
        return { user: u, error: null }
      }
      return { user: null, error: { message: 'Invalid email or password. Try patient@demo.com / demo123' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data?.user) return { user: data?.user, error }
    // The Supabase auth user's `role` is the JWT role ("authenticated"), not the
    // app role — fetch the real role so callers can route to the correct
    // dashboard on the first navigation (no flash of the wrong portal).
    const { data: userRow } = await supabase
      .from('users').select('role').eq('id', data.user.id).single()
    return { user: { ...data.user, role: userRow?.role }, error: null }
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  async function signUp(email, password, metadata) {
    if (DEMO_MODE) {
      const id = `demo-${Date.now()}`
      const u = { id, email, ...metadata }
      localStorage.setItem('mhealth-demo-user', JSON.stringify(u))
      setUser(u)
      setProfile(u)
      return { user: u, session: { demo: true }, error: null }
    }

    // Clear any existing session first. Without this, signing up while another
    // account is still signed in (or when Supabase returns an obfuscated
    // "email already exists" response with no new session) would leave the old
    // session active — landing the new registrant in someone else's account.
    await supabase.auth.signOut().catch(() => {})

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
    if (error) return { user: null, session: null, error }

    // Supabase returns a user with an empty `identities` array when the email is
    // already registered (obfuscated to prevent user enumeration). Surface it.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return {
        user: null, session: null,
        error: { message: 'An account with this email already exists. Please sign in instead.' },
      }
    }

    // Only create the profile row once we hold the new user's session, so the
    // RLS insert check (auth.uid() = id) passes. Surface any insert failure
    // instead of silently leaving an auth user with no profile row.
    if (data.session && data.user) {
      const { error: insErr } = await supabase.from('users').insert({ id: data.user.id, email, ...metadata })
      if (insErr) return { user: null, session: null, error: insErr }
    }

    return { user: data.user, session: data.session, error: null }
  }

  async function signOut() {
    if (DEMO_MODE) {
      localStorage.removeItem('mhealth-demo-user')
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
  }

  const PATIENT_PROFILE_KEYS = new Set([
    'gestational_week', 'due_date', 'blood_type', 'gravida', 'para',
    'assigned_provider_id', 'location', 'onboarding_complete',
    'emergency_contact_name', 'emergency_contact_phone',
  ])

  async function updateProfile(updates) {
    if (DEMO_MODE) {
      const updated = { ...profile, ...updates }
      localStorage.setItem('mhealth-demo-user', JSON.stringify(updated))
      setProfile(updated)
      return { error: null }
    }

    const userUpdates = {}
    const patientUpdates = {}
    for (const [k, v] of Object.entries(updates)) {
      if (PATIENT_PROFILE_KEYS.has(k)) patientUpdates[k] = v
      else userUpdates[k] = v
    }

    const ops = []
    if (Object.keys(userUpdates).length > 0) {
      ops.push(supabase.from('users').update(userUpdates).eq('id', user.id))
    }
    if (Object.keys(patientUpdates).length > 0) {
      // Conflict on user_id (its UNIQUE constraint), not the default primary key `id`.
      // Otherwise the upsert tries to INSERT a new row and collides with the
      // existing row's UNIQUE(user_id), failing with a duplicate-key error.
      ops.push(supabase.from('patient_profiles').upsert({ user_id: user.id, ...patientUpdates }, { onConflict: 'user_id' }))
    }

    const results = await Promise.all(ops)
    const error = results.find(r => r.error)?.error || null
    if (!error) setProfile(prev => ({ ...prev, ...updates }))
    return { error }
  }

  const value = { user, profile, loading, signIn, signUp, signOut, updateProfile, sendPasswordReset, updatePassword, isDemoMode: DEMO_MODE }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
