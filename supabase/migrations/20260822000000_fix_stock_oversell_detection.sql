-- ============================================================================
-- Full audit fix: confirm_order_payment silently oversold instead of
-- surfacing it.
--
-- Found during a full audit: checkout only ever checks a boolean
-- "is this in stock at all" (get_product_availability, Phase 4) — the
-- exact quantity is deliberately never exposed to the browser (Phase 4's
-- own comment). That means two concurrent orders for the last unit of a
-- product can both reach PENDING_PAYMENT and both later be paid via
-- Cashfree. By the time the second one hits confirm_order_payment, stock
-- is already at 0 — the old `update inventory set quantity =
-- greatest(0, quantity - x)` clamped silently to 0 with no record that
-- anything was wrong. Payment has already been captured by Cashfree by
-- this point, so the order can never be "rejected" here (that would mean
-- keeping a customer's money with no order) — the only honest fix is to
-- confirm it same as always, but leave a clearly-flagged, admin-visible
-- order_status_history note when it happens, instead of pretending
-- nothing happened. `for update` on the inventory row (not just the
-- order row, which was already locked) ensures two orders racing to
-- confirm on the same product actually serialize through this check
-- rather than both reading the same stale quantity.
-- ============================================================================

create or replace function public.confirm_order_payment(
  p_cashfree_order_id text,
  p_cashfree_payment_id text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_order orders%rowtype;
  v_item record;
  v_available integer;
  v_any_oversold boolean := false;
begin
  select * into v_payment from payments where cashfree_order_id = p_cashfree_order_id;
  if not found then
    return 'not_found';
  end if;

  if v_payment.status = 'SUCCESS' then
    return 'already_confirmed';
  end if;

  select * into v_order from orders where id = v_payment.order_id for update;

  if v_order.status <> 'PENDING_PAYMENT' then
    update payments set status = 'SUCCESS', method = coalesce(method, 'Cashfree')
      where id = v_payment.id;
    return 'already_confirmed';
  end if;

  update payments set status = 'SUCCESS', method = 'Cashfree' where id = v_payment.id;
  update orders set status = 'ORDER_CONFIRMED' where id = v_order.id;

  insert into order_status_history (order_id, status, note) values
    (v_order.id, 'PAYMENT_CONFIRMED',
     'Payment verified via Cashfree' ||
     case when p_cashfree_payment_id is not null
       then ' (payment id: ' || p_cashfree_payment_id || ')' else '' end),
    (v_order.id, 'ORDER_CONFIRMED', 'Order confirmed');

  for v_item in select product_id, quantity from order_items where order_id = v_order.id loop
    select quantity into v_available from inventory
      where product_id = v_item.product_id for update;

    if v_available is not null and v_available < v_item.quantity then
      v_any_oversold := true;
      insert into order_status_history (order_id, status, note) values (
        v_order.id, 'ORDER_CONFIRMED',
        format(
          'OVERSOLD — product %s had %s in stock but this order needs %s. Inventory floored at 0. Needs manual review (refund or expedited restock).',
          v_item.product_id, v_available, v_item.quantity
        )
      );
    end if;

    update inventory set quantity = greatest(0, quantity - v_item.quantity)
      where product_id = v_item.product_id;
    insert into inventory_transactions
      (product_id, change_type, quantity_delta, reason, reference_order_id)
      values (v_item.product_id, 'SALE', -v_item.quantity,
              'Order payment confirmed', v_order.id);
  end loop;

  if v_any_oversold then
    return 'confirmed_oversold';
  end if;
  return 'confirmed';
end;
$$;
