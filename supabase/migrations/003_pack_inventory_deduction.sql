create or replace function public.sync_product_inventory_from_weights(p_product_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_qty numeric(12, 3);
begin
  select coalesce(sum(on_hand_qty), 0)
  into total_qty
  from public.product_weight_options
  where product_id = p_product_id;

  update public.products
  set
    on_hand_qty = total_qty,
    stock = case when total_qty > 0 then 'in-stock' else 'out-of-stock' end
  where id = p_product_id
    and exists (
      select 1
      from public.product_weight_options
      where product_id = p_product_id
    );
end;
$$;

create or replace function public.product_weight_options_sync_parent_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_product_inventory_from_weights(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists product_weight_options_sync_parent_inventory on public.product_weight_options;
create trigger product_weight_options_sync_parent_inventory
after insert or update or delete on public.product_weight_options
for each row execute function public.product_weight_options_sync_parent_inventory();

create or replace function public.deduct_pack_inventory_for_order(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_product_id text;
  item_weight_id uuid;
  item_qty numeric(12, 3);
  locked_product public.products%rowtype;
  locked_weight public.product_weight_options%rowtype;
  remaining_qty numeric(12, 3);
begin
  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    item_product_id := item->>'product_id';
    item_weight_id := nullif(item->>'selected_weight_id', '')::uuid;
    item_qty := (item->>'qty')::numeric;

    if item_product_id is null or item_qty is null or item_qty <= 0 then
      raise exception 'Invalid inventory deduction item.';
    end if;

    select *
    into locked_product
    from public.products
    where id = item_product_id
      and active = true
    for update;

    if not found then
      raise exception 'Product % is not available.', item_product_id;
    end if;

    if exists (
      select 1
      from public.product_weight_options
      where product_id = item_product_id
    ) then
      if item_weight_id is null then
        raise exception 'Selected pack size is required for product %.', item_product_id;
      end if;

      select *
      into locked_weight
      from public.product_weight_options
      where id = item_weight_id
        and product_id = item_product_id
      for update;

      if not found or locked_weight.status <> 'available' then
        raise exception 'Selected pack size is not available.';
      end if;

      remaining_qty := locked_weight.on_hand_qty - item_qty;
      if remaining_qty < 0 then
        raise exception 'Insufficient pack size inventory.';
      end if;

      update public.product_weight_options
      set
        on_hand_qty = remaining_qty,
        status = case when remaining_qty > 0 then 'available' else 'unavailable' end
      where id = locked_weight.id;

      perform public.sync_product_inventory_from_weights(item_product_id);
    else
      remaining_qty := locked_product.on_hand_qty - item_qty;
      if locked_product.stock = 'out-of-stock' or remaining_qty < 0 then
        raise exception 'Insufficient product inventory.';
      end if;

      update public.products
      set
        on_hand_qty = remaining_qty,
        stock = case when remaining_qty > 0 then 'in-stock' else 'out-of-stock' end
      where id = item_product_id;
    end if;
  end loop;
end;
$$;

grant execute on function public.deduct_pack_inventory_for_order(jsonb) to anon;
grant execute on function public.deduct_pack_inventory_for_order(jsonb) to authenticated;
