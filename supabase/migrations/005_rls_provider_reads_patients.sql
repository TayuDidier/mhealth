-- Migration 005: Allow providers to read all patient user records
-- Required so providers can search any patient to start a conversation

CREATE POLICY "Providers can read all patient user records"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    role = 'patient'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'provider'
    )
  );
