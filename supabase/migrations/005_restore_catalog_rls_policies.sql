-- Restore least-privilege storefront access after enabling RLS in the dashboard.
-- Catalog data is public only when the parent product is active. Anonymous users
-- can create checkout records, but cannot read or modify catalog/order data.

alter table public.products enable row level security;
alter table public.product_weight_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke insert, update, delete, truncate, references, trigger
on table public.products, public.product_weight_options
from anon;

grant select
on table public.products, public.product_weight_options
to anon;

grant select, insert, update, delete
on table public.products, public.product_weight_options
to authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product weights" on public.product_weight_options;
create policy "Public can read active product weights"
on public.product_weight_options
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_weight_options.product_id
      and products.active = true
  )
);

drop policy if exists "Admins can manage product weights" on public.product_weight_options;
create policy "Admins can manage product weights"
on public.product_weight_options
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke select, update, delete, truncate
on table public.orders, public.order_items
from anon;

grant insert
on table public.orders, public.order_items
to anon;

grant select, insert, update
on table public.orders, public.order_items
to authenticated;

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can create order items" on public.order_items;
create policy "Customers can create order items"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
on public.order_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
