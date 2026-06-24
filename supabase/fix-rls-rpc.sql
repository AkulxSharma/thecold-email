-- thecold.email — FIX: anon INSERT policies + registration-gate RPC.
-- Diagnosed 2026-06-24: tables existed but anon INSERT was denied (42501)
-- and is_email_registered RPC was missing (404). Run this whole block in the
-- Supabase SQL editor. Idempotent — safe to re-run.

-- 1. RLS on (no-op if already on)
alter table public.registrations enable row level security;
alter table public.submissions  enable row level security;

-- 2. anon INSERT policies (drop-then-create so re-runs don't error)
drop policy if exists "anon insert registrations" on public.registrations;
create policy "anon insert registrations" on public.registrations
  for insert to anon with check (true);

drop policy if exists "anon insert submissions" on public.submissions;
create policy "anon insert submissions" on public.submissions
  for insert to anon with check (true);

-- 3. Case-insensitive uniqueness (blocks double-register).
-- Tables are empty, so no dup cleanup needed.
create unique index if not exists registrations_email_unique
  on public.registrations (lower(email));

-- 3b. Submissions: UNLIMITED entries per person, but each must target a
-- DIFFERENT person. Unique on (lower(email), lower(target_name)) so the same
-- email can't submit the same target twice. Repeat target → 23505.
create unique index if not exists submissions_email_target_unique
  on public.submissions (lower(email), lower(target_name));

-- 4. Registration-gate RPC — returns ONLY a boolean, no PII.
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

grant execute on function public.is_email_registered(text) to anon;
