-- Run after creating the Supabase Auth user for parrillameatshop@gmail.com.

insert into public.admin_profiles (user_id, full_name, role)
select id, 'Parrilla Meat Shop', 'owner'
from auth.users
where email = 'parrillameatshop@gmail.com'
on conflict (user_id) do update set
  full_name = excluded.full_name,
  role = excluded.role;
