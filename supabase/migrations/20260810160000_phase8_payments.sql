-- ============================================================================
-- MMGM Enterprises — Phase 8: Cashfree payment confirmation
--
-- Payment confirmation (order status + inventory decrement) must happen
-- exactly once per order no matter how many times it's triggered — the
-- payment-return page does a best-effort immediate check, and the Cashfree
-- webhook is the authoritative, possibly-delayed, possibly-duplicated
-- confirmation (spec §56.9 "duplicate webhooks must not create duplicate
-- orders", §56.8 "inventory must update safely"). Doing every write inside
-- one SECURITY DEFINER function makes the whole confirmation one
-- transaction with a row lock on the order, so a webhook arriving mid-way
-- through the return page's own attempt can't double-apply the inventory
-- decrement or the status-history rows.
--
-- Callable only by the service role — this must never be reachable with
-- the anon/authenticated key, since it marks a payment as paid.
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
    update inventory set quantity = greatest(0, quantity - v_item.quantity)
      where product_id = v_item.product_id;
    insert into inventory_transactions
      (product_id, change_type, quantity_delta, reason, reference_order_id)
      values (v_item.product_id, 'SALE', -v_item.quantity,
              'Order payment confirmed', v_order.id);
  end loop;

  return 'confirmed';
end;
$$;

revoke all on function public.confirm_order_payment(text, text) from public;
grant execute on function public.confirm_order_payment(text, text) to service_role;
