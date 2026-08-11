import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Shared by the catalog (Phase 4) and cart (Phase 6) — the only
// public-facing read of stock status, routed through the SECURITY DEFINER
// `get_product_availability` RPC rather than selecting from `inventory`
// directly, which stays admin-only. Accepts whichever client the caller
// already has (anon/session client for a logged-in read, service-role
// client for a guest cart read) — the RPC is granted to both anon and
// authenticated, and a service-role client can call it too.
export async function getAvailabilityMap(
  supabase: SupabaseClient<Database>,
  productIds: string[],
): Promise<Map<string, boolean>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("get_product_availability", {
    p_product_ids: productIds,
  });
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.product_id, row.is_available]));
}
