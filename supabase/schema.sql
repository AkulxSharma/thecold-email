-- thecold.email — Supabase schema.
-- Run this in the Supabase SQL editor after creating the project.
-- Two tables: registrations (Procedure chat) + submissions (compose window).
-- RLS is ON with INSERT-only public policies, so the anon key can write entries
-- but cannot read anyone else's data. Read them in the Supabase dashboard.

create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  full_name     text,
  email         text,
  country       text,
  age_band      text,
  company       text,
  position      text,
  social        text,
  background    text[],
  why_joining   text,
  what_you_want text
);

create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text,
  target_name  text,
  target_email text,
  track        text,
  subject      text,
  body         text,
  attachments  text[]
);

alter table public.registrations enable row level security;
alter table public.submissions  enable row level security;

-- Public can INSERT (register / submit) but not select/update/delete.
create policy "anon insert registrations" on public.registrations
  for insert to anon with check (true);

create policy "anon insert submissions" on public.submissions
  for insert to anon with check (true);
