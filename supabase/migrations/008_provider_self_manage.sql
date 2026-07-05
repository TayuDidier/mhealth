-- Migration 008: Allow providers to manage their own providers row.
--
-- Problem: public.providers only had "Auth users read providers" (SELECT) and
-- "Admin manages providers" (FOR ALL, admin). A provider therefore could not
-- update their own specialty / clinic_name from their profile page — the write
-- was silently rejected by RLS.
--
-- Solution: a self-management policy scoped to the caller's own row.

DROP POLICY IF EXISTS "Providers manage own profile" ON public.providers;

CREATE POLICY "Providers manage own profile"
  ON public.providers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
