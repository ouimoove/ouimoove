-- Super-admin tier: separates "can moderate" (admin) from "can manage who
-- else is an admin" (super_admin). Every currently-admin account is
-- grandfathered to super_admin here so nothing loses access; from now on
-- a super_admin can promote an *existing* account (one that already
-- signed up with its own email/password or Google login) to admin —
-- promote_to_admin never creates credentials, it only elevates a profile
-- that's already there, so no two admins ever share one login.
--
-- Roles stay a single column on profiles (already true before this
-- migration) — this only adds a 4th allowed value, it doesn't introduce
-- a second, overlapping flag. A profile is exactly one of:
-- 'user' | 'organizer' | 'admin' | 'super_admin'.

-- 1. Widen whatever check-constrains profiles.role, without assuming its
-- name (it predates the tracked migration history).
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'organizer', 'admin', 'super_admin'));

-- 2. Grandfather every current admin.
update public.profiles set role = 'super_admin' where role = 'admin';

-- 3. is_admin() must keep recognizing super_admin too, so every existing
-- policy built on it (event moderation, verification queue, city
-- requests, etc.) keeps working unchanged for the grandfathered accounts.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- 4. New: is_super_admin() — the one thing a regular admin must not be
-- able to do is manage other admins.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- 5. Promote an EXISTING account to admin. Super-admin only. Looks the
-- target up by email — if no profile matches, it tells the caller the
-- person needs to sign up first, rather than ever creating an account
-- or credentials on their behalf.
create or replace function public.promote_to_admin(target_email text)
returns jsonb
language plpgsql
security definer
as $$
declare
  target_id uuid;
  target_role text;
begin
  if not public.is_super_admin() then
    return jsonb_build_object('ok', false, 'error', 'Seuls les super admins peuvent ajouter des admins.');
  end if;

  select id, role into target_id, target_role
  from public.profiles
  where lower(email) = lower(target_email)
  limit 1;

  if target_id is null then
    return jsonb_build_object('ok', false, 'error', 'Aucun compte trouvé avec cet email. La personne doit d''abord créer son propre compte OuiMoove.');
  end if;

  if target_role in ('admin', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Ce compte est déjà administrateur.');
  end if;

  update public.profiles set role = 'admin' where id = target_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.promote_to_admin(text) to authenticated;

-- 6. Demote an admin back to a regular user. Super-admin only, and can
-- never target a super_admin — protects against an ordinary admin (or a
-- compromised admin account) ever removing a super admin, and against a
-- super admin fat-fingering their own or a peer's super_admin row through
-- this path.
create or replace function public.demote_admin(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  target_role text;
begin
  if not public.is_super_admin() then
    return jsonb_build_object('ok', false, 'error', 'Seuls les super admins peuvent retirer un admin.');
  end if;

  select role into target_role from public.profiles where id = target_user_id;

  if target_role is distinct from 'admin' then
    return jsonb_build_object('ok', false, 'error', 'Ce compte n''est pas un admin standard.');
  end if;

  update public.profiles set role = 'user' where id = target_user_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.demote_admin(uuid) to authenticated;

-- 7. Let a super admin list every admin/super_admin profile (for the
-- "manage admins" screen). Additive/permissive policy — Postgres OR's
-- permissive policies together, so this only ever widens who can read
-- profiles, never narrows an existing policy.
drop policy if exists profiles_super_admin_select_all on public.profiles;
create policy profiles_super_admin_select_all
  on public.profiles for select
  to authenticated
  using (public.is_super_admin());
