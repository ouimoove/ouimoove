-- 1) ticket_listings INSERT only checked seller_id = auth.uid() — it never
-- verified the order being listed actually belongs to that user. A crafted
-- insert could list someone else's order_item for resale (fraudulent
-- listing: collects a real buyer's money for a ticket the "seller" doesn't
-- own/control). Reuses the existing is_order_owner() helper (already used
-- elsewhere for the same ownership check) to close this.
drop policy if exists "listings_insert" on public.ticket_listings;
create policy "listings_insert"
  on public.ticket_listings for insert
  to authenticated
  with check (auth.uid() = seller_id and public.is_order_owner(order_id));

-- 2) Dedupe orders: five overlapping SELECT policies, two overlapping
-- INSERT policies — same non-exploitable but messy pattern as events/
-- profiles before. Keep the most complete/current-named ones.
drop policy if exists "Allow authenticated users to create orders for themselves" on public.orders;
drop policy if exists "users_can_select_own_orders_direct" on public.orders;
drop policy if exists "orders_select" on public.orders;
-- keep: orders_insert_own, orders_select_own_or_organizer (via can_view_order()), "Admins can view all orders"
