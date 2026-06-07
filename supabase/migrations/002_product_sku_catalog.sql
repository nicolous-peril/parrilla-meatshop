-- Channel-specific product SKUs, configurations, inventory, and variable weights.
-- This migration keeps the existing product IDs so historical order item links remain valid.

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

alter table public.products
  add column if not exists sku varchar(5),
  add column if not exists base_product_key text,
  add column if not exists sales_channel text,
  add column if not exists configuration text,
  add column if not exists moq numeric(12, 3) not null default 1,
  add column if not exists moq_unit text not null default 'item',
  add column if not exists on_hand_qty numeric(12, 3) not null default 0,
  add column if not exists notes text,
  add column if not exists default_option boolean not null default false,
  add column if not exists brand_priority integer not null default 0;

-- Split legacy Retail/Reseller rows before reducing each row to one sales channel.
insert into public.products (
  id,
  name,
  category,
  sub_category,
  channels,
  packaging,
  pack_size,
  price,
  reseller_price,
  slab_price,
  kg_per_box,
  brand,
  stock,
  featured,
  home_retail_featured,
  home_wholesale_featured,
  promo,
  description,
  image_path,
  sort_order,
  active,
  sales_channel,
  configuration,
  moq,
  moq_unit,
  on_hand_qty,
  notes,
  default_option,
  brand_priority
)
select
  case
    when id like 'retail-%' then 'reseller-' || substring(id from 8)
    else id || '-reseller'
  end,
  name,
  category,
  sub_category,
  array['reseller']::text[],
  packaging,
  pack_size,
  coalesce(reseller_price, price),
  null,
  slab_price,
  kg_per_box,
  brand,
  stock,
  featured,
  false,
  false,
  promo,
  description,
  image_path,
  sort_order,
  active,
  'reseller',
  case
    when lower(coalesce(pack_size, packaging, '')) ~ '500\s*g' then '500g'
    when lower(coalesce(pack_size, packaging, '')) ~ '1\s*kg' then '1kg'
    else null
  end,
  5,
  coalesce(packaging, 'pack'),
  0,
  null,
  false,
  0
from public.products source
where source.channels @> array['retail', 'reseller']::text[]
  and not exists (
    select 1
    from public.products existing
    where existing.id = case
      when source.id like 'retail-%' then 'reseller-' || substring(source.id from 8)
      else source.id || '-reseller'
    end
  );

update public.products
set
  sales_channel = coalesce(
    sales_channel,
    case
      when channels @> array['wholesale']::text[] then 'wholesale'
      when channels @> array['reseller']::text[] and not channels @> array['retail']::text[] then 'reseller'
      else 'retail'
    end
  ),
  configuration = coalesce(
    configuration,
    case
      when lower(coalesce(pack_size, packaging, '')) ~ '500\s*g' then '500g'
      when lower(coalesce(pack_size, packaging, '')) ~ '1\s*kg' then '1kg'
      else null
    end
  ),
  base_product_key = coalesce(
    base_product_key,
    trim(both '-' from regexp_replace(
      lower(regexp_replace(name, '\s*\(box\)\s*$', '', 'i')),
      '[^a-z0-9]+',
      '-',
      'g'
    ))
  );

update public.products
set channels = array[sales_channel]::text[]
where channels is distinct from array[sales_channel]::text[];

update public.products
set
  moq = case when sales_channel = 'reseller' and moq = 1 then 5 else moq end,
  moq_unit = case
    when sales_channel = 'wholesale' then 'box'
    when sales_channel = 'reseller' then 'pack'
    when lower(coalesce(packaging, '')) like '%piece%' then 'piece'
    when lower(coalesce(packaging, '')) like '%tray%' then 'tray'
    when lower(coalesce(packaging, '')) like '%liter%' then 'liter'
    else 'pack'
  end;

with numbered as (
  select
    id,
    case sales_channel
      when 'retail' then '1'
      when 'reseller' then '2'
      when 'wholesale' then '3'
    end || lpad(
      row_number() over (
        partition by sales_channel
        order by sort_order, name, id
      )::text,
      4,
      '0'
    ) as next_sku
  from public.products
  where sku is null
)
update public.products product
set sku = numbered.next_sku
from numbered
where product.id = numbered.id;

create or replace function public.generate_product_sku()
returns trigger
language plpgsql
as $$
declare
  prefix integer;
  next_value integer;
begin
  prefix := case new.sales_channel
    when 'retail' then 10000
    when 'reseller' then 20000
    when 'wholesale' then 30000
    else null
  end;

  if prefix is null then
    raise exception 'Invalid sales channel: %', new.sales_channel;
  end if;

  if new.sku is null
    or new.sku = ''
    or (tg_op = 'UPDATE' and new.sales_channel is distinct from old.sales_channel)
  then
    perform pg_advisory_xact_lock(hashtext('product-sku-' || new.sales_channel));

    select greatest(
      prefix,
      coalesce(max(sku::integer), prefix)
    ) + 1
    into next_value
    from public.products
    where sales_channel = new.sales_channel
      and sku ~ '^[123][0-9]{4}$';

    if next_value >= prefix + 10000 then
      raise exception 'No SKU numbers remain for channel %', new.sales_channel;
    end if;

    new.sku := next_value::text;
  end if;

  new.channels := array[new.sales_channel]::text[];
  new.base_product_key := coalesce(
    nullif(new.base_product_key, ''),
    trim(both '-' from regexp_replace(
      lower(regexp_replace(new.name, '\s*\(box\)\s*$', '', 'i')),
      '[^a-z0-9]+',
      '-',
      'g'
    ))
  );

  return new;
end;
$$;

drop trigger if exists products_generate_sku on public.products;
create trigger products_generate_sku
before insert or update of sales_channel on public.products
for each row execute function public.generate_product_sku();

alter table public.products
  alter column sku set not null,
  alter column base_product_key set not null,
  alter column sales_channel set not null;

alter table public.products
  drop constraint if exists products_sku_format_check,
  add constraint products_sku_format_check check (sku ~ '^[123][0-9]{4}$'),
  drop constraint if exists products_sales_channel_check,
  add constraint products_sales_channel_check check (sales_channel in ('retail', 'reseller', 'wholesale')),
  drop constraint if exists products_moq_check,
  add constraint products_moq_check check (moq > 0),
  drop constraint if exists products_on_hand_qty_check,
  add constraint products_on_hand_qty_check check (on_hand_qty >= 0);

create unique index if not exists products_sku_unique on public.products (sku);
create index if not exists products_base_channel_idx
  on public.products (base_product_key, sales_channel, active, sort_order);

create table if not exists public.product_weight_options (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  weight_label text not null,
  weight_value numeric(12, 3),
  price numeric(12, 2) not null,
  on_hand_qty numeric(12, 3) not null default 0,
  status text not null default 'available',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_weight_price_check check (price >= 0),
  constraint product_weight_qty_check check (on_hand_qty >= 0),
  constraint product_weight_status_check check (status in ('available', 'unavailable')),
  constraint product_weight_product_label_unique unique (product_id, weight_label)
);

drop trigger if exists product_weight_options_set_updated_at on public.product_weight_options;
create trigger product_weight_options_set_updated_at
before update on public.product_weight_options
for each row execute function public.set_updated_at();

alter table public.product_weight_options enable row level security;

drop policy if exists "Public can read active product weights" on public.product_weight_options;
create policy "Public can read active product weights"
on public.product_weight_options for select
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
on public.product_weight_options for all
using (public.is_admin())
with check (public.is_admin());

alter table public.order_items
  add column if not exists sku varchar(5),
  add column if not exists selected_configuration text,
  add column if not exists selected_brand text,
  add column if not exists selected_weight text,
  add column if not exists moq numeric(12, 3),
  add column if not exists moq_unit text,
  add column if not exists notes_snapshot text;
