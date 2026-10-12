-- =====================================================================
-- Ouimoove Weddings — database setup
--
-- HOW TO APPLY: Supabase dashboard → SQL editor → New query → paste this
-- whole file → Run. Safe to run more than once: it only creates what is
-- missing and replaces its own functions and policies. It never changes
-- the existing Ouimoove tables (events, orders, profiles, ...).
--
-- What it adds:
--   weddings                 one row per couple's wedding (names, cultures,
--                            budget, hashtag, public website settings)
--   wedding_members          partner / planner / family invites
--   wedding_events           the journey: knocking, dowry, civil, religious,
--                            reception, honeymoon, extra events
--   wedding_guests           guest list (his / hers, wish list / invited / cut)
--   wedding_tables           seating plan tables
--   wedding_budget_items     budget lines and vendor reservations
--   wedding_dowry_items      what to bring to the knocking and the dowry list
--   wedding_tasks            the checklist
--   wedding_rsvps            answers sent from the couple's public website
--   wedding_vendors          the Ouimoove network of wedding providers
--   wedding_vendor_leads     quote requests sent to providers / to Ouimoove
--   storage bucket           wedding-photos (website cover photos)
--
-- Access model: the couple who created the wedding (owner) and the people
-- they invite (partner / planner = can edit, viewer = read only) see the
-- wedding. Nobody else does. The public website only exposes what the
-- couple publishes, through get_wedding_site(). Guests answer through
-- submit_wedding_rsvp() without an account.
--
-- Relies on public.is_admin() from 20260918000000_super_admin_tier.sql.
-- =====================================================================


-- ── 0. Check ────────────────────────────────────────────────────────
-- Stops before changing anything if the admin helper is missing.
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Ouimoove Weddings: public.is_admin() is missing. Apply 20260918000000_super_admin_tier.sql first, then run this file again.';
  end if;
end $$;


-- ── 1. Tables ───────────────────────────────────────────────────────

create table if not exists public.weddings (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  groom_name     text not null default '' check (char_length(groom_name) <= 80),
  bride_name     text not null default '' check (char_length(bride_name) <= 80),
  family_name    text check (char_length(family_name) <= 80),
  groom_culture  text check (char_length(groom_culture) <= 40),
  bride_culture  text check (char_length(bride_culture) <= 40),
  country        text check (country ~ '^[A-Z]{2}$'),
  city           text check (char_length(city) <= 80),
  currency       text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  budget_total   bigint not null default 0 check (budget_total between 0 and 1000000000000),
  guest_target   integer not null default 150 check (guest_target between 0 and 100000),
  hashtag        text check (char_length(hashtag) <= 80),
  slogan         text check (char_length(slogan) <= 200),
  lang           text not null default 'fr' check (lang in ('fr', 'en')),
  slug           text unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
  site_published boolean not null default false,
  site           jsonb not null default '{}'::jsonb check (octet_length(site::text) <= 60000),
  prefs          jsonb not null default '{}'::jsonb check (octet_length(prefs::text) <= 20000),
  status         text not null default 'planning' check (status in ('planning', 'married')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.wedding_members (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  email        text not null check (char_length(email) between 3 and 200 and email = lower(email)),
  role         text not null default 'partner' check (role in ('partner', 'planner', 'viewer')),
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  invite_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (wedding_id, email)
);

create table if not exists public.wedding_events (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  kind         text not null check (kind in ('knocking', 'dowry', 'civil', 'religious', 'reception', 'honeymoon', 'custom')),
  variant      text check (char_length(variant) <= 30),
  title        text check (char_length(title) <= 120),
  included     boolean not null default true,
  event_date   date,
  end_date     date,
  start_time   time,
  venue        text check (char_length(venue) <= 160),
  city         text check (char_length(city) <= 80),
  map_url      text check (map_url ~ '^https://' and char_length(map_url) <= 500),
  dress_code   text check (char_length(dress_code) <= 200),
  notes        text check (char_length(notes) <= 4000),
  show_on_site boolean not null default true,
  done         boolean not null default false,
  sort         integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.wedding_tables (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  capacity    integer not null default 10 check (capacity between 1 and 100),
  shape       text not null default 'round' check (shape in ('round', 'rect')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.wedding_guests (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  side        text not null default 'groom' check (side in ('groom', 'bride', 'both')),
  grp         text not null default 'family' check (char_length(grp) <= 40),
  seats       integer not null default 1 check (seats between 1 and 50),
  priority    smallint not null default 2 check (priority between 1 and 3),
  status      text not null default 'list' check (status in ('list', 'in', 'out')),
  phone       text check (char_length(phone) <= 40),
  email       text check (char_length(email) <= 200),
  rsvp        text not null default 'pending' check (rsvp in ('pending', 'yes', 'no', 'maybe')),
  rsvp_count  integer check (rsvp_count between 0 and 50),
  events      text[] not null default '{}' check (cardinality(events) <= 10),
  table_id    uuid references public.wedding_tables(id) on delete set null,
  invited_at  timestamptz,
  notes       text check (char_length(notes) <= 1000),
  created_at  timestamptz not null default now()
);

create table if not exists public.wedding_vendors (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 120),
  category    text not null check (category in ('planner', 'venue', 'catering', 'decor', 'photo', 'video', 'music', 'mc',
                                                'makeup', 'attire', 'cake', 'transport', 'jewelry', 'stationery',
                                                'rentals', 'dowry', 'honeymoon', 'other')),
  city        text check (char_length(city) <= 80),
  country     text check (country ~ '^[A-Z]{2}$'),
  description text check (char_length(description) <= 1500),
  phone       text check (char_length(phone) <= 40),
  whatsapp    text check (char_length(whatsapp) <= 40),
  email       text check (char_length(email) <= 200),
  website     text check (website ~ '^https?://' and char_length(website) <= 300),
  instagram   text check (char_length(instagram) <= 100),
  price_from  bigint check (price_from >= 0),
  currency    text not null default 'XOF' check (currency ~ '^[A-Z]{3}$'),
  photo_url   text check (photo_url ~ '^https://' and char_length(photo_url) <= 500),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.wedding_budget_items (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  category     text not null default 'other' check (char_length(category) <= 30),
  label        text not null check (char_length(label) between 1 and 120),
  event_kind   text check (char_length(event_kind) <= 20),
  vendor_id    uuid references public.wedding_vendors(id) on delete set null,
  vendor_name  text check (char_length(vendor_name) <= 120),
  vendor_phone text check (char_length(vendor_phone) <= 40),
  status       text not null default 'planned' check (status in ('planned', 'contacted', 'quoted', 'booked', 'paid', 'cancelled')),
  estimated    bigint not null default 0 check (estimated >= 0),
  actual       bigint check (actual >= 0),
  paid         bigint not null default 0 check (paid >= 0),
  due_date     date,
  notes        text check (char_length(notes) <= 2000),
  created_at   timestamptz not null default now()
);

create table if not exists public.wedding_dowry_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  stage       text not null default 'dowry' check (stage in ('knocking', 'dowry')),
  label       text not null check (char_length(label) between 1 and 160),
  qty         integer not null default 1 check (qty between 0 and 100000),
  unit        text check (char_length(unit) <= 30),
  recipient   text not null default 'family' check (recipient in ('bride', 'father', 'mother', 'family', 'brothers',
                                                                   'sisters', 'uncles', 'aunts', 'elders', 'other')),
  category    text not null default 'other' check (category in ('drinks', 'cloth', 'jewelry', 'cash', 'food', 'household',
                                                                'beauty', 'livestock', 'symbolic', 'other')),
  est_cost    bigint not null default 0 check (est_cost >= 0),
  status      text not null default 'todo' check (status in ('todo', 'bought', 'ready')),
  notes       text check (char_length(notes) <= 1000),
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.wedding_tasks (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  tpl         text check (char_length(tpl) <= 60),
  title       text check (char_length(title) <= 200),
  event_kind  text check (char_length(event_kind) <= 20),
  due_date    date,
  done        boolean not null default false,
  done_at     timestamptz,
  assignee    text check (assignee in ('groom', 'bride', 'both', 'planner', 'family')),
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  check (tpl is not null or title is not null)
);

create table if not exists public.wedding_rsvps (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  guest_id    uuid references public.wedding_guests(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 120),
  phone       text check (char_length(phone) <= 40),
  attending   boolean not null,
  party_size  integer not null default 1 check (party_size between 1 and 20),
  message     text check (char_length(message) <= 1000),
  ip_hash     text check (char_length(ip_hash) <= 64),
  created_at  timestamptz not null default now()
);

create table if not exists public.wedding_vendor_leads (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references public.wedding_vendors(id) on delete cascade,  -- null = request to the Ouimoove team
  wedding_id  uuid references public.weddings(id) on delete set null,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category    text check (char_length(category) <= 30),
  name        text not null check (char_length(name) between 1 and 120),
  phone       text check (char_length(phone) <= 40),
  email       text check (char_length(email) <= 200),
  event_date  date,
  city        text check (char_length(city) <= 80),
  guests      integer check (guests between 0 and 100000),
  budget      bigint check (budget >= 0),
  currency    text check (currency ~ '^[A-Z]{3}$'),
  message     text check (char_length(message) <= 2000),
  status      text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at  timestamptz not null default now()
);

create index if not exists wedding_members_user_idx    on public.wedding_members (user_id);
create index if not exists wedding_members_wedding_idx on public.wedding_members (wedding_id);
create index if not exists wedding_events_wedding_idx  on public.wedding_events (wedding_id);
create index if not exists wedding_tables_wedding_idx  on public.wedding_tables (wedding_id);
create index if not exists wedding_guests_wedding_idx  on public.wedding_guests (wedding_id);
create index if not exists wedding_budget_wedding_idx  on public.wedding_budget_items (wedding_id);
create index if not exists wedding_dowry_wedding_idx   on public.wedding_dowry_items (wedding_id);
create index if not exists wedding_tasks_wedding_idx   on public.wedding_tasks (wedding_id);
create index if not exists wedding_rsvps_wedding_idx   on public.wedding_rsvps (wedding_id, created_at);
create index if not exists wedding_vendors_list_idx    on public.wedding_vendors (status, category);
create index if not exists wedding_vendors_owner_idx   on public.wedding_vendors (owner_id);
create index if not exists wedding_leads_vendor_idx    on public.wedding_vendor_leads (vendor_id);
create index if not exists wedding_leads_user_idx      on public.wedding_vendor_leads (user_id, created_at);


-- ── 2. Who can see / edit a wedding ─────────────────────────────────
-- 'owner' | 'partner' | 'planner' | 'viewer' | null (no access).
-- SECURITY DEFINER so policies can call it without recursing into RLS.

create or replace function public.wedding_access(p_wedding uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then null
    when exists (select 1 from public.weddings w where w.id = p_wedding and w.owner_id = auth.uid()) then 'owner'
    else (select m.role from public.wedding_members m
           where m.wedding_id = p_wedding and m.user_id = auth.uid() and m.status = 'accepted'
           limit 1)
  end
$$;

create or replace function public.can_view_wedding(p_wedding uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.wedding_access(p_wedding) is not null
$$;

create or replace function public.can_edit_wedding(p_wedding uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.wedding_access(p_wedding) in ('owner', 'partner', 'planner'), false)
$$;

grant execute on function public.wedding_access(uuid)   to authenticated;
grant execute on function public.can_view_wedding(uuid) to authenticated;
grant execute on function public.can_edit_wedding(uuid) to authenticated;
-- Vendor policies call is_admin() for signed-out visitors too.
grant execute on function public.is_admin() to anon, authenticated;


-- ── 3. Guards (triggers) ────────────────────────────────────────────

-- The owner of a wedding can never be changed from the app.
create or replace function public.weddings_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'owner_id cannot be changed';
    end if;
    new.updated_at := now();
  end if;
  if new.slug is not null then
    new.slug := lower(new.slug);
  end if;
  return new;
end;
$$;

drop trigger if exists weddings_guard on public.weddings;
create trigger weddings_guard
  before insert or update on public.weddings
  for each row execute function public.weddings_guard();

-- Invites: from the app, a member row can only be created as a pending
-- invite, and only accept_wedding_invite() (SECURITY DEFINER, so it runs
-- as the table owner) can attach a user or mark it accepted.
create or replace function public.wedding_members_guard()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.user_id := null;
      new.status := 'pending';
      new.accepted_at := null;
      new.invited_by := auth.uid();
      new.email := lower(btrim(new.email));
    else
      if new.user_id is distinct from old.user_id
         or new.status is distinct from old.status
         or new.invite_token is distinct from old.invite_token
         or new.email is distinct from old.email
         or new.wedding_id is distinct from old.wedding_id then
        raise exception 'Only the role of an invite can be changed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists wedding_members_guard on public.wedding_members;
create trigger wedding_members_guard
  before insert or update on public.wedding_members
  for each row execute function public.wedding_members_guard();

-- Vendors: a new listing always starts as 'pending' and unverified; only
-- an admin can approve, reject or verify. Editing a rejected listing sends
-- it back for review.
create or replace function public.wedding_vendors_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    if tg_op = 'UPDATE' then new.updated_at := now(); end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.status := 'pending';
    new.verified := false;
  else
    new.owner_id := old.owner_id;
    new.status := case when old.status = 'rejected' then 'pending' else old.status end;
    new.verified := old.verified;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists wedding_vendors_guard on public.wedding_vendors;
create trigger wedding_vendors_guard
  before insert or update on public.wedding_vendors
  for each row execute function public.wedding_vendors_guard();

-- Quote requests: at most 20 per person per day, always created as 'new'.
create or replace function public.wedding_leads_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.wedding_vendor_leads l
       where l.user_id = new.user_id and l.created_at > now() - interval '1 day') >= 20 then
    raise exception 'too_many_requests';
  end if;
  new.status := 'new';
  return new;
end;
$$;

drop trigger if exists wedding_leads_guard on public.wedding_vendor_leads;
create trigger wedding_leads_guard
  before insert on public.wedding_vendor_leads
  for each row execute function public.wedding_leads_guard();


-- ── 4. Row level security ───────────────────────────────────────────

alter table public.weddings enable row level security;

drop policy if exists weddings_select on public.weddings;
create policy weddings_select on public.weddings for select to authenticated
  using (owner_id = auth.uid() or public.can_view_wedding(id));

drop policy if exists weddings_insert on public.weddings;
create policy weddings_insert on public.weddings for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists weddings_update on public.weddings;
create policy weddings_update on public.weddings for update to authenticated
  using (public.can_edit_wedding(id))
  with check (public.can_edit_wedding(id));

drop policy if exists weddings_delete on public.weddings;
create policy weddings_delete on public.weddings for delete to authenticated
  using (owner_id = auth.uid());

alter table public.wedding_members enable row level security;

drop policy if exists wedding_members_select on public.wedding_members;
create policy wedding_members_select on public.wedding_members for select to authenticated
  using (public.can_view_wedding(wedding_id) or user_id = auth.uid());

drop policy if exists wedding_members_insert on public.wedding_members;
create policy wedding_members_insert on public.wedding_members for insert to authenticated
  with check (public.wedding_access(wedding_id) in ('owner', 'partner'));

drop policy if exists wedding_members_update on public.wedding_members;
create policy wedding_members_update on public.wedding_members for update to authenticated
  using (public.wedding_access(wedding_id) in ('owner', 'partner'))
  with check (public.wedding_access(wedding_id) in ('owner', 'partner'));

drop policy if exists wedding_members_delete on public.wedding_members;
create policy wedding_members_delete on public.wedding_members for delete to authenticated
  using (public.wedding_access(wedding_id) in ('owner', 'partner') or user_id = auth.uid());

-- Same four policies on every planning table: members see, editors change.
do $$
declare
  t text;
begin
  foreach t in array array['wedding_events', 'wedding_guests', 'wedding_tables',
                           'wedding_budget_items', 'wedding_dowry_items', 'wedding_tasks'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_view_wedding(wedding_id))',
                   t || '_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_wedding(wedding_id))',
                   t || '_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_wedding(wedding_id)) with check (public.can_edit_wedding(wedding_id))',
                   t || '_update', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_edit_wedding(wedding_id))',
                   t || '_delete', t);
  end loop;
end $$;

-- RSVPs arrive only through submit_wedding_rsvp(); the couple reads,
-- corrects and deletes them.
alter table public.wedding_rsvps enable row level security;

drop policy if exists wedding_rsvps_select on public.wedding_rsvps;
create policy wedding_rsvps_select on public.wedding_rsvps for select to authenticated
  using (public.can_view_wedding(wedding_id));

drop policy if exists wedding_rsvps_update on public.wedding_rsvps;
create policy wedding_rsvps_update on public.wedding_rsvps for update to authenticated
  using (public.can_edit_wedding(wedding_id))
  with check (public.can_edit_wedding(wedding_id));

drop policy if exists wedding_rsvps_delete on public.wedding_rsvps;
create policy wedding_rsvps_delete on public.wedding_rsvps for delete to authenticated
  using (public.can_edit_wedding(wedding_id));

-- Vendors: approved listings are public; owners manage their own;
-- admins see and moderate everything.
alter table public.wedding_vendors enable row level security;

drop policy if exists wedding_vendors_select on public.wedding_vendors;
create policy wedding_vendors_select on public.wedding_vendors for select to anon, authenticated
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

drop policy if exists wedding_vendors_insert on public.wedding_vendors;
create policy wedding_vendors_insert on public.wedding_vendors for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists wedding_vendors_update on public.wedding_vendors;
create policy wedding_vendors_update on public.wedding_vendors for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists wedding_vendors_delete on public.wedding_vendors;
create policy wedding_vendors_delete on public.wedding_vendors for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Quote requests: the person who sent it, the provider who received it,
-- and admins (who also handle requests sent to the Ouimoove team).
alter table public.wedding_vendor_leads enable row level security;

drop policy if exists wedding_leads_select on public.wedding_vendor_leads;
create policy wedding_leads_select on public.wedding_vendor_leads for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.wedding_vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

drop policy if exists wedding_leads_insert on public.wedding_vendor_leads;
create policy wedding_leads_insert on public.wedding_vendor_leads for insert to authenticated
  with check (
    user_id = auth.uid()
    and (vendor_id is null
         or exists (select 1 from public.wedding_vendors v where v.id = vendor_id and v.status = 'approved'))
  );

drop policy if exists wedding_leads_update on public.wedding_vendor_leads;
create policy wedding_leads_update on public.wedding_vendor_leads for update to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.wedding_vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.wedding_vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

drop policy if exists wedding_leads_delete on public.wedding_vendor_leads;
create policy wedding_leads_delete on public.wedding_vendor_leads for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on table
  public.weddings, public.wedding_members, public.wedding_events, public.wedding_tables,
  public.wedding_guests, public.wedding_budget_items, public.wedding_dowry_items,
  public.wedding_tasks, public.wedding_vendors, public.wedding_vendor_leads
  to authenticated;
grant select, update, delete on table public.wedding_rsvps to authenticated;
grant select on table public.wedding_vendors to anon;


-- ── 5. Functions the app calls ──────────────────────────────────────

-- Public wedding website: only what the couple chose to publish.
-- Private notes, budget, guest list and honeymoon details never leave.
create or replace function public.get_wedding_site(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w public.weddings%rowtype;
begin
  select * into w from public.weddings
   where slug = lower(btrim(p_slug)) and site_published;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'slug',       w.slug,
    'groom_name', w.groom_name,
    'bride_name', w.bride_name,
    'hashtag',    w.hashtag,
    'slogan',     w.slogan,
    'lang',       w.lang,
    'site',       w.site,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind',       e.kind,
               'variant',    e.variant,
               'title',      e.title,
               'date',       e.event_date,
               'end_date',   e.end_date,
               'time',       to_char(e.start_time, 'HH24:MI'),
               'venue',      e.venue,
               'city',       e.city,
               'map_url',    e.map_url,
               'dress_code', e.dress_code)
             order by e.event_date nulls last, e.sort)
        from public.wedding_events e
       where e.wedding_id = w.id and e.included and e.show_on_site
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_wedding_site(text) to anon, authenticated;

-- RSVP from the public website (no account needed). Matches the answer to
-- the guest list by phone number (last 8 digits) or exact name, and updates
-- that guest's RSVP. Limited to 15 answers per hour per visitor and 1,000
-- per day per wedding.
create or replace function public.submit_wedding_rsvp(
  p_slug       text,
  p_name       text,
  p_phone      text,
  p_attending  boolean,
  p_party_size integer,
  p_message    text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  w        public.weddings%rowtype;
  v_name   text := left(btrim(coalesce(p_name, '')), 120);
  v_phone  text := left(btrim(coalesce(p_phone, '')), 40);
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_msg    text := left(btrim(coalesce(p_message, '')), 1000);
  v_size   integer := least(greatest(coalesce(p_party_size, 1), 1), 20);
  v_ip     text := '';
  v_hash   text;
  v_guest  uuid;
begin
  if p_attending is null or char_length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select * into w from public.weddings
   where slug = lower(btrim(coalesce(p_slug, ''))) and site_published;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if w.site -> 'rsvp_open' = 'false'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'closed');
  end if;

  begin
    v_ip := btrim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
  exception when others then
    v_ip := '';
  end;
  v_hash := md5(w.id::text || ':' || coalesce(nullif(v_ip, ''), 'unknown'));

  if (select count(*) from public.wedding_rsvps r
       where r.wedding_id = w.id and r.ip_hash = v_hash and r.created_at > now() - interval '1 hour') >= 15
     or (select count(*) from public.wedding_rsvps r
          where r.wedding_id = w.id and r.created_at > now() - interval '1 day') >= 1000 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  if char_length(v_digits) >= 8 then
    select g.id into v_guest from public.wedding_guests g
     where g.wedding_id = w.id
       and right(regexp_replace(coalesce(g.phone, ''), '\D', '', 'g'), 8) = right(v_digits, 8)
     order by g.created_at
     limit 1;
  end if;
  if v_guest is null then
    select g.id into v_guest from public.wedding_guests g
     where g.wedding_id = w.id and lower(btrim(g.name)) = lower(v_name)
     order by g.created_at
     limit 1;
  end if;

  insert into public.wedding_rsvps (wedding_id, guest_id, name, phone, attending, party_size, message, ip_hash)
  values (w.id, v_guest, v_name, nullif(v_phone, ''), p_attending, v_size, nullif(v_msg, ''), v_hash);

  if v_guest is not null then
    update public.wedding_guests
       set rsvp = case when p_attending then 'yes' else 'no' end,
           rsvp_count = case when p_attending then v_size else 0 end
     where id = v_guest;
  end if;

  return jsonb_build_object('ok', true, 'matched', v_guest is not null);
end;
$$;

grant execute on function public.submit_wedding_rsvp(text, text, text, boolean, integer, text) to anon, authenticated;

-- Invite link preview ("Desire invites you to plan Desire & Keli's wedding").
create or replace function public.get_wedding_invite(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m public.wedding_members%rowtype;
  w public.weddings%rowtype;
begin
  select * into m from public.wedding_members where invite_token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  select * into w from public.weddings where id = m.wedding_id;
  return jsonb_build_object(
    'ok', true,
    'groom_name', w.groom_name,
    'bride_name', w.bride_name,
    'role', m.role,
    'status', m.status,
    'email_hint', left(m.email, 1) || '***@' || split_part(m.email, '@', 2)
  );
end;
$$;

grant execute on function public.get_wedding_invite(text) to anon, authenticated;

-- Accept an invite. The signed-in account's email must be the invited one.
create or replace function public.accept_wedding_invite(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  m       public.wedding_members%rowtype;
  v_email text := lower(coalesce(auth.email(), ''));
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into m from public.wedding_members where invite_token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  if m.status = 'accepted' then
    if m.user_id = auth.uid() then
      return jsonb_build_object('ok', true, 'wedding_id', m.wedding_id);
    end if;
    return jsonb_build_object('ok', false, 'error', 'already_used');
  end if;

  if m.email <> v_email then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch',
                              'email_hint', left(m.email, 1) || '***@' || split_part(m.email, '@', 2));
  end if;

  update public.wedding_members
     set user_id = auth.uid(), status = 'accepted', accepted_at = now()
   where id = m.id;

  return jsonb_build_object('ok', true, 'wedding_id', m.wedding_id);
end;
$$;

grant execute on function public.accept_wedding_invite(text) to authenticated;


-- ── 6. Live updates between partners (Supabase Realtime) ────────────
-- Optional: if Realtime is not enabled the app still works (it reloads
-- when you come back to the tab).
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['weddings', 'wedding_events', 'wedding_guests', 'wedding_tables',
                             'wedding_budget_items', 'wedding_dowry_items', 'wedding_tasks',
                             'wedding_rsvps', 'wedding_members'] loop
      if not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
exception when others then
  raise notice 'Realtime not enabled for wedding tables: %', sqlerrm;
end $$;


-- ── 7. Photos for wedding websites (Supabase Storage) ───────────────
-- Public bucket, 5 MB images. Each person uploads into their own folder
-- (<user id>/...). If this part fails, couples can still paste an image
-- link instead of uploading.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('wedding-photos', 'wedding-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;
exception when others then
  raise notice 'wedding-photos bucket not created: %', sqlerrm;
end $$;

do $$
begin
  execute 'drop policy if exists wedding_photos_insert on storage.objects';
  execute $p$
    create policy wedding_photos_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'wedding-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
  execute 'drop policy if exists wedding_photos_update on storage.objects';
  execute $p$
    create policy wedding_photos_update on storage.objects for update to authenticated
      using (bucket_id = 'wedding-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
  execute 'drop policy if exists wedding_photos_delete on storage.objects';
  execute $p$
    create policy wedding_photos_delete on storage.objects for delete to authenticated
      using (bucket_id = 'wedding-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
exception when others then
  raise notice 'wedding-photos upload policies not created: %', sqlerrm;
end $$;
