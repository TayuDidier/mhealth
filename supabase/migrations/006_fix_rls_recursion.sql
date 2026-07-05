-- Migration 006: Fix RLS infinite recursion
--
-- Policies on public.users that subquery public.users cause infinite loops.
-- The fix: a SECURITY DEFINER function that reads the caller's role
-- without going through RLS, then use it in all affected policies.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ── Fix migration 005 policy (directly recursive) ─────────────
DROP POLICY IF EXISTS "Providers can read all patient user records" ON public.users;

CREATE POLICY "Providers can read all patient user records"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    role = 'patient'
    AND public.current_user_role() = 'provider'
  );

-- ── Fix original admin policy from 001_schema.sql (also recursive) ──
DROP POLICY IF EXISTS "Admin reads all users" ON public.users;

CREATE POLICY "Admin reads all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');
