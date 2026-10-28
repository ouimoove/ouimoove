-- Readable event links: ouimoove.app/e/festival-afrobeats-lome instead of /e/<uuid>.
-- Old UUID links keep working. Run this BEFORE deploying the site version that
-- reads events.slug.

alter table public.events add column if not exists slug text;

-- "Soirée Jazz — Hôtel du Lac!" -> "soiree-jazz-hotel-du-lac"
create or replace function public.event_slug_base(t text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      left(
        trim(both '-' from regexp_replace(
          regexp_replace(
            translate(lower(coalesce(t, '')), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa'),
            '[^a-z0-9]+', '-', 'g'),
          '-+', '-', 'g')),
        60),
      ''),
    'evenement');
$$;

-- First free slug: base, base-2, base-3 ...
create or replace function public.event_unique_slug(t text, own_id uuid)
returns text
language plpgsql
as $$
declare
  base text := public.event_slug_base(t);
  candidate text := base;
  n int := 1;
begin
  while exists (select 1 from public.events e where e.slug = candidate and e.id <> own_id) loop
    n := n + 1;
    candidate := left(base, 56) || '-' || n;
  end loop;
  return candidate;
end;
$$;

-- Give every existing event a slug (oldest first, so the earliest keeps the plain name).
do $$
declare r record;
begin
  for r in select id, title from public.events where slug is null order by created_at, id loop
    update public.events set slug = public.event_unique_slug(r.title, r.id) where id = r.id;
  end loop;
end $$;

create unique index if not exists events_slug_key on public.events (slug);

-- New events get a slug automatically; it never changes afterwards so shared
-- links stay valid even if the organizer edits the title.
create or replace function public.events_set_slug()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.slug := public.event_unique_slug(new.title, new.id);
  else
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists events_set_slug on public.events;
create trigger events_set_slug
  before insert or update on public.events
  for each row execute function public.events_set_slug();
