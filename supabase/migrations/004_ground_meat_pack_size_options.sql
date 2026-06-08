-- Convert Ground Beef and Ground Pork from separate 1kg/500g product rows
-- into the standardized pack-size configuration model.

update public.products
set
  name = 'Ground Beef',
  configuration = null,
  pack_size = 'Pack Size Options',
  packaging = 'Pack Size Options',
  description = 'Frozen Beef product with selectable pack sizes.',
  stock = 'in-stock',
  active = true
where id = 'retail-ground-beef-1-kg';

update public.products
set
  name = 'Ground Pork',
  configuration = null,
  pack_size = 'Pack Size Options',
  packaging = 'Pack Size Options',
  description = 'Frozen Pork product with selectable pack sizes.',
  stock = 'in-stock',
  active = true
where id = 'retail-ground-pork-1-kg';

insert into public.product_weight_options (
  product_id,
  weight_label,
  weight_value,
  price,
  on_hand_qty,
  status,
  sort_order
)
select
  'retail-ground-beef-1-kg',
  '1 kg',
  1,
  coalesce((select price from public.products where id = 'retail-ground-beef-1-kg'), 420),
  coalesce((select on_hand_qty from public.products where id = 'retail-ground-beef-1-kg'), 0),
  case when coalesce((select on_hand_qty from public.products where id = 'retail-ground-beef-1-kg'), 0) > 0 then 'available' else 'unavailable' end,
  0
union all
select
  'retail-ground-beef-1-kg',
  '0.5 kg',
  0.5,
  round(coalesce((select price from public.products where id = 'retail-ground-beef-1-kg'), 420) * 0.5, 2),
  coalesce((select on_hand_qty from public.products where id = 'retail-ground-beef-500g'), 0),
  case when coalesce((select on_hand_qty from public.products where id = 'retail-ground-beef-500g'), 0) > 0 then 'available' else 'unavailable' end,
  1
union all
select
  'retail-ground-pork-1-kg',
  '1 kg',
  1,
  coalesce((select price from public.products where id = 'retail-ground-pork-1-kg'), 280),
  coalesce((select on_hand_qty from public.products where id = 'retail-ground-pork-1-kg'), 0),
  case when coalesce((select on_hand_qty from public.products where id = 'retail-ground-pork-1-kg'), 0) > 0 then 'available' else 'unavailable' end,
  0
union all
select
  'retail-ground-pork-1-kg',
  '0.5 kg',
  0.5,
  round(coalesce((select price from public.products where id = 'retail-ground-pork-1-kg'), 280) * 0.5, 2),
  coalesce((select on_hand_qty from public.products where id = 'retail-ground-pork-500g'), 0),
  case when coalesce((select on_hand_qty from public.products where id = 'retail-ground-pork-500g'), 0) > 0 then 'available' else 'unavailable' end,
  1
on conflict (product_id, weight_label)
do update set
  weight_value = excluded.weight_value,
  price = excluded.price,
  on_hand_qty = excluded.on_hand_qty,
  status = excluded.status,
  sort_order = excluded.sort_order;

update public.products
set
  active = false,
  stock = 'out-of-stock'
where id in ('retail-ground-beef-500g', 'retail-ground-pork-500g');

select public.sync_product_inventory_from_weights('retail-ground-beef-1-kg');
select public.sync_product_inventory_from_weights('retail-ground-pork-1-kg');
