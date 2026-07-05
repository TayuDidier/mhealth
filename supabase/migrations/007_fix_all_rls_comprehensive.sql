-- Migration 007: Comprehensive RLS fix — safe to run at any state
--
-- Problem: Policies that subquery public.users from within public.users RLS
-- cause infinite recursion → 500 errors on ALL users table queries.
-- Also fixes cross-table recursion where patient_profiles policies query users
-- and users policies query patient_profiles in a cycle.
--
-- Solution: A single SECURITY DEFINER function reads the caller's role
-- without going through RLS, used everywhere a role check is needed.

-- ============================================================
-- HELPER FUNCTION (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- USERS TABLE — drop all policies, recreate cleanly
-- ============================================================
DROP POLICY IF EXISTS "Users can read own profile"                      ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"                    ON public.users;
DROP POLICY IF EXISTS "Admin reads all users"                           ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read provider profiles"  ON public.users;
DROP POLICY IF EXISTS "Providers can read assigned patient user records" ON public.users;
DROP POLICY IF EXISTS "Providers can read all patient user records"     ON public.users;
DROP POLICY IF EXISTS "Authenticated users read provider info"          ON public.users;

-- Own profile read/write
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admin sees everyone (non-recursive)
CREATE POLICY "Admin reads all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Any authenticated user can see provider names/IDs (needed for appointment booking)
CREATE POLICY "Authenticated users can read provider profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (role = 'provider');

-- Providers can see patient records for their assigned patients
-- Uses current_user_role() to avoid querying users table recursively
CREATE POLICY "Providers can read assigned patient user records"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'provider'
    AND role = 'patient'
    AND EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.user_id = public.users.id
        AND pp.assigned_provider_id = auth.uid()
    )
  );

-- ============================================================
-- PATIENT_PROFILES TABLE — fix recursive policy
-- ============================================================
DROP POLICY IF EXISTS "Providers read assigned patients" ON public.patient_profiles;

CREATE POLICY "Providers read assigned patients"
  ON public.patient_profiles FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'provider'
    AND assigned_provider_id = auth.uid()
  );

-- ============================================================
-- APPOINTMENTS TABLE — fix recursive admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admin sees all appointments" ON public.appointments;

CREATE POLICY "Admin sees all appointments"
  ON public.appointments FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- HEALTH_CONTENT TABLE — fix recursive admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admin manages health content" ON public.health_content;

CREATE POLICY "Admin manages health content"
  ON public.health_content FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- PROVIDERS TABLE — fix recursive admin policy
-- ============================================================
DROP POLICY IF EXISTS "Admin manages providers" ON public.providers;

CREATE POLICY "Admin manages providers"
  ON public.providers FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin');
