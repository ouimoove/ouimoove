-- Removes duplicate RLS policies left over from the events-moderation and
-- earlier migrations. Multiple permissive policies for the same
-- table/command/role are OR'd together, so these weren't causing incorrect
-- access on their own — except one real gap: the old
-- "organizers can insert their own events" policy has no status check,
-- so it alone permits inserting events with status='published' directly,
-- bypassing the moderation queue that events_owner_insert enforces. That
-- loophole is closed here.

-- events: SELECT — drop inline-subquery duplicate of the is_admin() version.
drop policy if exists "events_admin_read_all" on public.events;

-- events: INSERT — drop the older policy that has no status='pending'
-- check (the actual security gap from the moderation feature).
drop policy if exists "organizers can insert their own events" on public.events;

-- events: UPDATE — keep events_owner_update (has a WITH CHECK clause);
-- drop the looser duplicate. Keep the is_admin() admin policy; drop the
-- inline-subquery duplicate.
drop policy if exists "organizers can update their own events" on public.events;
drop policy if exists "events_admin_update" on public.events;

-- events: DELETE — same pattern: keep one owner policy, one admin policy.
drop policy if exists "organizers can delete their own events" on public.events;
drop policy if exists "events_admin_delete" on public.events;

-- profiles: UPDATE — keep profiles_update_own (has a WITH CHECK clause);
-- drop the looser duplicate.
drop policy if exists "users can update their own profile" on public.profiles;
