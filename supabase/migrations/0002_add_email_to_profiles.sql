-- Add email column to profiles and backfill from auth.users
alter table public.profiles add column if not exists email text;
create unique index if not exists idx_profiles_email_unique on public.profiles(email) where email is not null;
-- Backfill
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');
-- Optional: future policy tweaks could rely on email
