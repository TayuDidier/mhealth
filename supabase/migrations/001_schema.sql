-- MHealth Antenatal Care System — Supabase Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text unique not null,
  role        text not null check (role in ('patient', 'provider', 'admin')),
  phone       text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PATIENT PROFILES
-- ============================================================
create table if not exists public.patient_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.users(id) on delete cascade unique,
  gestational_week      int,
  due_date              date,
  blood_type            text,
  gravida               int default 1,
  para                  int default 0,
  assigned_provider_id  uuid references public.users(id),
  location              text,
  onboarding_complete   boolean default false,
  created_at            timestamptz default now()
);

-- ============================================================
-- PROVIDERS
-- ============================================================
create table if not exists public.providers (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete cascade unique,
  specialty     text,
  clinic_name   text,
  status        text default 'pending' check (status in ('pending', 'active', 'inactive', 'deactivated')),
  created_at    timestamptz default now()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table if not exists public.appointments (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid references public.users(id) on delete cascade,
  provider_id     uuid references public.users(id),
  datetime        timestamptz not null,
  status          text default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  notes           text,
  location        text,
  reminder_sent   boolean default false,
  created_at      timestamptz default now()
);

create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_provider on public.appointments(provider_id);
create index idx_appointments_datetime on public.appointments(datetime);

-- ============================================================
-- REMINDERS LOG
-- ============================================================
create table if not exists public.reminders (
  id                uuid primary key default uuid_generate_v4(),
  appointment_id    uuid references public.appointments(id) on delete cascade,
  sent_at           timestamptz default now(),
  delivery_status   text default 'sent',
  phone_number      text
);

-- ============================================================
-- HEALTH CONTENT
-- ============================================================
create table if not exists public.health_content (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  body              text not null,
  trimester         text check (trimester in ('1', '2', '3', 'general')),
  cover_image_url   text,
  read_time         int default 3,
  created_by        uuid references public.users(id),
  created_at        timestamptz default now()
);

-- ============================================================
-- MEDICAL RECORDS
-- ============================================================
create table if not exists public.medical_records (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid references public.users(id) on delete cascade,
  provider_id     uuid references public.users(id),
  visit_date      date not null,
  bp_systolic     int,
  bp_diastolic    int,
  weight_kg       numeric(5,2),
  notes           text,
  lab_results     text,
  created_at      timestamptz default now()
);

create index idx_medical_records_patient on public.medical_records(patient_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  sender_id     uuid references public.users(id) on delete cascade,
  receiver_id   uuid references public.users(id) on delete cascade,
  content       text not null,
  created_at    timestamptz default now(),
  read_at       timestamptz
);

create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_receiver on public.messages(receiver_id);

-- Enable Realtime for messages table
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.providers enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;
alter table public.messages enable row level security;
alter table public.health_content enable row level security;
alter table public.reminders enable row level security;

-- Users: see own profile
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Admin reads all users" on public.users for select using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Patient profiles: own profile only (+ provider can see their patients)
create policy "Patients read own profile" on public.patient_profiles for select using (auth.uid() = user_id);
create policy "Patients update own profile" on public.patient_profiles for all using (auth.uid() = user_id);
create policy "Providers read assigned patients" on public.patient_profiles for select using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'provider')
  and assigned_provider_id = auth.uid()
);

-- Appointments: patients see own, providers see theirs, admin sees all
create policy "Patients see own appointments" on public.appointments for select using (auth.uid() = patient_id);
create policy "Patients create appointments" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "Patients update own appointments" on public.appointments for update using (auth.uid() = patient_id);
create policy "Providers see their appointments" on public.appointments for select using (auth.uid() = provider_id);
create policy "Providers update appointments" on public.appointments for update using (auth.uid() = provider_id);
create policy "Admin sees all appointments" on public.appointments for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Medical records: patients read, providers write for their patients
create policy "Patients read own records" on public.medical_records for select using (auth.uid() = patient_id);
create policy "Providers read+write records" on public.medical_records for all using (auth.uid() = provider_id);

-- Messages: only sender and receiver
create policy "Message sender read/write" on public.messages for all using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Health content: everyone reads, only admin writes
create policy "Anyone reads health content" on public.health_content for select using (true);
create policy "Admin manages health content" on public.health_content for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);

-- Providers table: read by all authenticated, write by admin
create policy "Auth users read providers" on public.providers for select using (auth.uid() is not null);
create policy "Admin manages providers" on public.providers for all using (
  exists(select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
);
