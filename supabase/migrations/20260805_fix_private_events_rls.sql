-- APPLIED 2026-08-05 via Supabase MCP.
-- Fixes private events being publicly visible: `events_public_read_published`
-- (added by 20260723_events_moderation.sql) granted anon/authenticated SELECT
-- on any status='published' row with no is_private check, which fully
-- neutralized the older, correctly-scoped "published events are viewable by
-- everyone" policy (RLS policies for the same command/role are OR'ed).
drop policy if exists "events_public_read_published" on public.events;

-- Also backfills 'pending' into events.status's check constraint, since
-- events_owner_insert (from the same moderation migration) requires new
-- events to land with status = 'pending', which the constraint didn't allow.
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status = any (array['draft', 'pending', 'published', 'cancelled']));
