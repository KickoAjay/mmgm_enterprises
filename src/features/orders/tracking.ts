"use server";

import { createServiceClient } from "@/lib/db/service";

export type TrackedOrder = {
  orderNumber: string;
  status: string;
  placedAt: string | null;
  statusHistory: { status: string; createdAt: string }[];
  shipment: {
    courierName: string | null;
    trackingNumber: string | null;
    estimatedDelivery: string | null;
  } | null;
};

export type TrackOrderState = { error: string } | { order: TrackedOrder } | null;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

// Guests have no session/RLS to scope an order lookup, so identity is
// proven at request time instead: order number + the email or mobile
// number on file for that order (spec §30). Deliberately returns the same
// generic error whether the order number or the contact detail was wrong,
// so this can't be used to enumerate valid order numbers. No rate
// limiting exists anywhere in this project yet (§42 is Phase 14) — a
// known gap, not unique to this endpoint.
export async function trackOrderAction(
  _prevState: TrackOrderState,
  formData: FormData,
): Promise<TrackOrderState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const genericError = {
    error: "We couldn't find a matching order. Check your order number and contact details.",
  };
  if (!orderNumber || !contact) {
    return { error: "Enter your order number and registered email or mobile number" };
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return genericError;

  let identityEmail: string | null = null;
  let identityPhone: string | null = null;
  if (order.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email, mobile")
      .eq("id", order.user_id)
      .maybeSingle();
    identityEmail = user?.email ?? null;
    identityPhone = user?.mobile ?? null;
  } else {
    identityEmail = order.guest_email;
    identityPhone = order.guest_phone;
  }

  const matchesEmail = identityEmail ? normalizeEmail(identityEmail) === normalizeEmail(contact) : false;
  const matchesPhone = identityPhone ? normalizePhone(identityPhone) === normalizePhone(contact) : false;
  if (!matchesEmail && !matchesPhone) return genericError;

  const [{ data: history }, { data: shipment }] = await Promise.all([
    supabase
      .from("order_status_history")
      .select("status, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase.from("shipments").select("*").eq("order_id", order.id).maybeSingle(),
  ]);

  return {
    order: {
      orderNumber: order.order_number,
      status: order.status,
      placedAt: order.placed_at,
      statusHistory: (history ?? []).map((h) => ({ status: h.status, createdAt: h.created_at })),
      shipment: shipment
        ? {
            courierName: shipment.courier_name,
            trackingNumber: shipment.tracking_number,
            estimatedDelivery: shipment.estimated_delivery,
          }
        : null,
    },
  };
}
