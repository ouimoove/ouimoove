-- APPLIED 2026-08-05 via Supabase MCP.
-- Invitations previously only supported silent auto-accept on link click
-- (accept_invitation RPC), with no way for a guest to say they won't attend.
-- Adds 'declined' as a valid status and two RPCs used by the RSVP modal:
--   get_invitation_details — fetch event info for the invite screen without
--     requiring the invitation to already be accepted (events RLS only
--     allows reading a private event once accepted, which is what this
--     RPC exists to get around, scoped to the invited email via
--     SECURITY DEFINER).
--   respond_invitation — records 'accepted' or 'declined', replacing
--     accept_invitation (dropped; only ever called from useStore.js).
alter table public.event_invitations drop constraint if exists event_invitations_status_check;
alter table public.event_invitations add constraint event_invitations_status_check
  check (status is null or status = any (array['pending', 'accepted', 'declined']));

drop function if exists public.accept_invitation(text);

create or replace function public.get_invitation_details(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv event_invitations%rowtype;
  ev events%rowtype;
  user_email text;
begin
  user_email := auth.email();
  if user_email is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select * into inv from event_invitations where token = invite_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid invitation link');
  end if;

  if lower(inv.email) != lower(user_email) then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch', 'invited_email', inv.email);
  end if;

  select * into ev from events where id = inv.event_id;

  return jsonb_build_object(
    'ok', true,
    'status', inv.status,
    'event_id', inv.event_id,
    'event_title', ev.title,
    'event_date', ev.event_date,
    'event_city', ev.city,
    'event_emoji', ev.emoji
  );
end;
$$;

grant execute on function public.get_invitation_details(text) to authenticated;

create or replace function public.respond_invitation(invite_token text, decision text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv event_invitations%rowtype;
  user_email text;
begin
  if decision not in ('accepted', 'declined') then
    return jsonb_build_object('ok', false, 'error', 'Invalid response');
  end if;

  user_email := auth.email();
  if user_email is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select * into inv from event_invitations where token = invite_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid invitation link');
  end if;

  if lower(inv.email) != lower(user_email) then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch', 'invited_email', inv.email);
  end if;

  update event_invitations set status = decision where token = invite_token;
  return jsonb_build_object('ok', true, 'event_id', inv.event_id, 'status', decision);
end;
$$;

grant execute on function public.respond_invitation(text, text) to authenticated;
