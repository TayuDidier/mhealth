-- Migration 002: Emergency Contact + Emergency Alerts log

-- Add emergency contact fields to patient_profiles
alter table public.patient_profiles
  add column if not exists emergency_contact_name  text,
  add column if not exists emergency_contact_phone text;

-- ============================================================
-- EMERGENCY ALERTS log table
-- ============================================================
create table if not exists public.emergency_alerts (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid references public.users(id) on delete cascade,
  patient_name  text,
  triggered_at  timestamptz default now(),
  recipients    jsonb not null default '[]'::jsonb
  -- recipients shape: [{ "name": "...", "phone": "..." }]
);

create index idx_emergency_alerts_patient on public.emergency_alerts(patient_id);
create index idx_emergency_alerts_triggered on public.emergency_alerts(triggered_at desc);

-- RLS
alter table public.emergency_alerts enable row level security;

-- Patients can insert their own alerts and read them back
create policy "Patients insert own alerts"
  on public.emergency_alerts for insert
  with check (auth.uid() = patient_id);

create policy "Patients read own alerts"
  on public.emergency_alerts for select
  using (auth.uid() = patient_id);

-- Admins see all alerts
create policy "Admin sees all emergency alerts"
  on public.emergency_alerts for all
  using (
    exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );
