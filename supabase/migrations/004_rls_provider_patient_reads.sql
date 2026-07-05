-- Migration 004: RLS policies for provider/patient cross-reads

-- Allow any authenticated user to read users with role='provider'
-- Required so patients can see the provider list during onboarding
CREATE POLICY "Authenticated users can read provider profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (role = 'provider');

-- Allow providers to read user records of their assigned patients
-- Required so the provider messages list can show patient names
CREATE POLICY "Providers can read assigned patient user records"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.user_id = public.users.id
        AND pp.assigned_provider_id = auth.uid()
    )
  );
