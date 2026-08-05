-- Adds business-vs-personal account info to profiles, captured at signup.
-- Business accounts show their business name as the event organizer
-- ("Organisé par <business_name>") instead of the signer's personal name.
--
-- Same caveat as the events-moderation migration: this repo doesn't track
-- the profiles table's history, so this is written defensively (IF NOT
-- EXISTS) and doesn't assume anything about existing RLS beyond "users can
-- update their own profile row", which the app already relies on elsewhere
-- (ProfileModal's updateProfile). If that assumption is wrong, the
-- self-service UPDATE in useStore.js's signup() will just fail silently
-- (logged via console.warn) without blocking account creation.

alter table public.profiles
  add column if not exists account_type text not null default 'personal'
    check (account_type in ('personal', 'business')),
  add column if not exists business_name text,
  add column if not exists phone text;

comment on column public.profiles.account_type is 'personal | business — set at signup';
comment on column public.profiles.business_name is 'Business/organizer display name, shown on events when account_type = business';
comment on column public.profiles.phone is 'Contact phone, collected at signup for business accounts';
