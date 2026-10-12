-- OuiMoove ⇄ Sèvizi bridge: quote requests that couples send to Sèvizi providers.
-- The sevizi-bridge edge function (service role) is the only writer; couples
-- can read their own rows. Offers are not stored here: they are fetched live
-- from Sèvizi each time the couple opens "Mes demandes".

create table if not exists public.wedding_sevizi_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  wedding_id  uuid references public.weddings(id) on delete set null,
  category    text not null check (char_length(category) <= 30),
  city        text check (char_length(city) <= 80),
  event_date  date,
  guests      integer check (guests between 1 and 5000),
  budget      bigint check (budget >= 0),
  message     text check (char_length(message) <= 800),
  sevizi_request_id uuid,
  created_at  timestamptz not null default now()
);

create index if not exists wedding_sevizi_requests_user_idx
  on public.wedding_sevizi_requests (user_id, created_at desc);

alter table public.wedding_sevizi_requests enable row level security;

drop policy if exists wedding_sevizi_requests_select on public.wedding_sevizi_requests;
create policy wedding_sevizi_requests_select on public.wedding_sevizi_requests
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies on purpose: only the edge function writes.
