"use server";

export type DeliveryCheckResult =
  { error: string } | { estimatedDays: string; codAvailable: boolean };

// No live courier/serviceability integration exists in this project (no
// phase adds one) — this validates the pincode format and returns a
// standard estimate, same as most storefronts show before checkout even
// once a courier partner is wired up. Not a substitute for real order
// tracking (spec §30), which is sourced from admin-entered shipment data,
// not this widget.
export async function checkDeliveryAction(
  pincode: string,
): Promise<DeliveryCheckResult> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return { error: "Enter a valid 6-digit pincode" };
  }
  return { estimatedDays: "4–6 business days", codAvailable: true };
}
