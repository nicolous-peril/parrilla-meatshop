-- Parrilla Meat Shop initial production schema.
-- Run this in Supabase SQL Editor, or through the Supabase CLI once local CLI setup is available.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  sub_category text,
  channels text[] not null default '{}',
  packaging text,
  pack_size text,
  price numeric(12, 2),
  reseller_price numeric(12, 2),
  slab_price numeric(12, 2),
  kg_per_box text,
  brand text,
  stock text not null default 'in-stock',
  featured boolean not null default false,
  home_retail_featured boolean not null default false,
  home_wholesale_featured boolean not null default false,
  promo text,
  description text,
  image_path text not null default '/images/parrilla logo.png',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_stock_check check (stock in ('in-stock', 'out-of-stock'))
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  constraint admin_profiles_role_check check (role in ('owner', 'staff'))
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('PMS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status text not null default 'pending',
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  fulfillment text not null default 'Pickup',
  notes text,
  subtotal numeric(12, 2) not null default 0,
  final_total numeric(12, 2),
  payment_status text not null default 'unpaid',
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  constraint orders_payment_status_check check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  constraint orders_fulfillment_check check (fulfillment in ('Pickup', 'Delivery'))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  name text not null,
  channel text not null,
  qty integer not null,
  packaging text,
  unit_price numeric(12, 2),
  amount numeric(12, 2),
  availability text not null default 'pending',
  actual_weight text,
  final_price numeric(12, 2),
  created_at timestamptz not null default now(),
  constraint order_items_channel_check check (channel in ('retail', 'reseller', 'wholesale')),
  constraint order_items_qty_check check (qty > 0),
  constraint order_items_availability_check check (availability in ('pending', 'available', 'partial', 'unavailable'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

alter table public.products enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles for select
using (public.is_admin());

drop policy if exists "Admins can manage admin profiles" on public.admin_profiles;
create policy "Admins can manage admin profiles"
on public.admin_profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders for insert
with check (true);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders for select
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can create order items" on public.order_items;
create policy "Customers can create order items"
on public.order_items for insert
with check (true);

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items for select
using (public.is_admin());

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
on public.order_items for update
using (public.is_admin())
with check (public.is_admin());
