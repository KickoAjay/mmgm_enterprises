import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminEnquiry = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export async function getAdminEnquiries(): Promise<AdminEnquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((e) => ({
    id: e.id,
    fullName: e.full_name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    isRead: e.is_read,
    createdAt: e.created_at,
  }));
}

export async function getAdminEnquiry(enquiryId: string): Promise<AdminEnquiry | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    isRead: data.is_read,
    createdAt: data.created_at,
  };
}
