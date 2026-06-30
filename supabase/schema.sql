-- thecold.email — Supabase schema.
-- NOTE: if registrations.age_band already exists in prod, run: alter table public.registrations rename column age_band to age;
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
  age           text,
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

-- ---------------------------------------------------------------------------
-- Registration gate (added 2026-06-24)
-- The anon key cannot SELECT (insert-only RLS above), so a SECURITY DEFINER
-- function runs the lookup server-side and returns ONLY a boolean — no rows,
-- no PII exposed. Used for (1) dedup before inserting a registration and
-- (2) gating the submission flow.
-- NOTE: delete any test rows BEFORE adding the unique index below, or it fails.
-- ---------------------------------------------------------------------------

-- Case-insensitive uniqueness so the same email can't register twice.
create unique index if not exists registrations_email_unique
  on public.registrations (lower(email));

-- Submissions: unlimited entries per person, but each must target a different
-- person — same email + same target_name is rejected (23505).
create unique index if not exists submissions_email_target_unique
  on public.submissions (lower(email), lower(target_name));

create or replace function public.is_email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.registrations
    where lower(email) = lower(trim(p_email))
  );
$$;

-- Let the public anon role call the gate function.
grant execute on function public.is_email_registered(text) to anon;
