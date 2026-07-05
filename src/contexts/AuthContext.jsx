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
    return { user: data?.user, error }
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
      return { user: u, error: null }
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
    if (!error && data.user) {
      await supabase.from('users').insert({ id: data.user.id, email, ...metadata })
    }
    return { user: data?.user, error }
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
      ops.push(supabase.from('patient_profiles').upsert({ user_id: user.id, ...patientUpdates }))
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
