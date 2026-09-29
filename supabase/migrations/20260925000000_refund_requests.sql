-- Refund requests: an organizer asks, an admin approves (the payout itself is
-- done by the process-refund edge function with the service role).
--
-- Clients get read-only access; every write goes through process-refund, so
-- no browser can create, approve or edit a refund by itself.
--
-- The table keeps a snapshot of what the admin needs to decide (buyer, event,
-- amount, method, payout number) so the admin screen doesn't need read access
-- to the underlying orders.

create table if not exists public.refund_requests (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  requested_by    uuid not null,
  reason          text,
  status          text not null default 'pending'
                  check (status in ('pending', 'processing', 'paid_out', 'manual', 'rejected')),

  -- snapshot for the admin screen
  buyer_name      text,
  event_title     text,
  order_total     integer not null,
  payment_method  text,
  payout_phone    text,

  -- payout tracking
  payout_provider text,
  payout_token    text,
  payout_error    text,

  decided_by      uuid,
  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);

-- One open request per order; a rejected one can be requested again.
create unique index if not exists refund_requests_one_open_per_order
  on public.refund_requests (order_id)
  where status in ('pending', 'processing');

alter table public.refund_requests enable row level security;

-- Admins see every request; a requester sees their own. No insert/update/
-- delete policies on purpose (service role only).
drop policy if exists refund_requests_admin_select on public.refund_requests;
create policy refund_requests_admin_select
  on public.refund_requests for select
  to authenticated
  using (public.is_admin());

drop policy if exists refund_requests_requester_select on public.refund_requests;
create policy refund_requests_requester_select
  on public.refund_requests for select
  to authenticated
  using (requested_by = auth.uid());
