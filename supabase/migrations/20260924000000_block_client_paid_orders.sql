-- DRAFT — do not run until the new create-paydunya-payment / verify-paydunya-payment /
-- paydunya-webhook functions are deployed (they now create + complete paid orders
-- server-side with the service role, which is exempt from these triggers).
--
-- Closes the "client writes its own paid order" hole: the browser could insert
-- an order with payment_status = 'paid' (or flip a pending one to 'paid') and
-- add order_items for any ticket, getting tickets without paying. After this,
-- a signed-in client can only:
--   * create 'paid' orders / items that are entirely free (price 0), and
--   * never mark a paid order 'paid' itself.
-- Everything paid goes through the edge functions (service_role).
--
-- Side effect, intended: with VITE_PAYMENT_MODE unset ('simulation'), paid
-- checkouts now fail instead of silently giving away tickets.

create or replace function public.guard_client_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Edge functions use the service role; never restrict those.
  if coalesce(auth.role(), '') = 'service_role' or auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.payment_status = 'paid' and coalesce(new.total_cfa, 0) > 0 then
      raise exception 'Paid orders can only be created by the payment service';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' and coalesce(new.total_cfa, 0) > 0 then
      raise exception 'Orders can only be marked paid by the payment service';
    end if;
    if new.total_cfa is distinct from old.total_cfa then
      raise exception 'Order totals cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_client_orders on public.orders;
create trigger guard_client_orders
  before insert or update on public.orders
  for each row execute function public.guard_client_orders();

-- Client-inserted order items must be for genuinely free ticket types.
create or replace function public.guard_client_order_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_price numeric;
begin
  if coalesce(auth.role(), '') = 'service_role' or auth.uid() is null then
    return new;
  end if;

  select price_cfa into ticket_price from public.ticket_types where id = new.ticket_type_id;
  if ticket_price is null or ticket_price > 0 or coalesce(new.unit_price_cfa, 0) > 0 then
    raise exception 'Paid tickets can only be added by the payment service';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_client_order_items on public.order_items;
create trigger guard_client_order_items
  before insert on public.order_items
  for each row execute function public.guard_client_order_items();
