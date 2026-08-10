-- ============================================================================
-- MMGM Enterprises — Phase 4: catalog filtering support
--
-- Two additions needed for the /sarees catalog (filters, sort, search):
--
--   1. `products.discount_percent` — a stored generated column so the
--      Discount filter (spec §18: 10%+/20%+/30%+/50%+) and "Biggest
--      Discount" sort (spec §19) can be expressed as plain column
--      comparisons instead of computing percentages in application code
--      per row.
--
--   2. `get_product_availability(uuid[])` — a SECURITY DEFINER function
--      exposing only (product_id, is_available) for a given set of
--      products. `inventory` itself stays admin-only per the Phase 2 RLS
--      policies (exact stock counts are never exposed to the browser);
--      this is the narrow, explicit exception that lets the Availability
--      filter and "Out of Stock" badges work for anon/authenticated
--      customers without widening access to the underlying table.
-- ============================================================================

alter table products
  add column discount_percent smallint generated always as (
    case
      when original_price > 0
        then round(((original_price - selling_price) / original_price) * 100)::smallint
      else 0
    end
  ) stored;

create index idx_products_discount_percent on products(discount_percent);

create or replace function public.get_product_availability(p_product_ids uuid[])
returns table (product_id uuid, is_available boolean)
language sql
security definer
set search_path = public
stable
as $$
  select i.product_id, (i.is_available and i.quantity > 0) as is_available
  from inventory i
  where i.product_id = any(p_product_ids);
$$;

grant execute on function public.get_product_availability(uuid[]) to anon, authenticated;
