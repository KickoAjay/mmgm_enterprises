import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminCustomerListItem = {
  id: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  isActive: boolean;
  createdAt: string;
};

export async function getAdminCustomers(search?: string): Promise<AdminCustomerListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("users").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  const { data } = await query;
  return (data ?? []).map((u) => ({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    mobile: u.mobile,
    isActive: u.is_active,
    createdAt: u.created_at,
  }));
}

export type AdminCustomerDetail = {
  id: string;
  fullName: string | null;
  email: string;
  mobile: string | null;
  isActive: boolean;
  createdAt: string;
  totalSpent: number;
  orders: { id: string; orderNumber: string; status: string; grandTotal: number; placedAt: string | null }[];
  returns: { id: string; status: string; requestedAt: string }[];
  refunds: { id: string; amount: number; status: string; createdAt: string }[];
};

// Never selects/exposes anything payment-credential-shaped — orders'
// grand_total and payments.status only, no card/bank data exists
// anywhere in this schema for this to accidentally leak (spec §39
// "never expose sensitive payment credentials").
export async function getAdminCustomerDetail(userId: string): Promise<AdminCustomerDetail | null> {
  const supabase = await createClient();
  const { data: user } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (!user) return null;

  const [{ data: orders }, { data: returns }, { data: refunds }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, grand_total, placed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("returns")
      .select("id, status, requested_at")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false }),
    supabase
      .from("refunds")
      .select("id, amount, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const paidOrders = (orders ?? []).filter(
    (o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED",
  );
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.grand_total, 0);

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    mobile: user.mobile,
    isActive: user.is_active,
    createdAt: user.created_at,
    totalSpent,
    orders: (orders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      grandTotal: o.grand_total,
      placedAt: o.placed_at,
    })),
    returns: (returns ?? []).map((r) => ({ id: r.id, status: r.status, requestedAt: r.requested_at })),
    refunds: (refunds ?? []).map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      createdAt: r.created_at,
    })),
  };
}
