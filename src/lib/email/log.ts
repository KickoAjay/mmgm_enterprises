import "server-only";
import { createServiceClient } from "@/lib/db/service";

// Every transactional email logs here regardless of outcome —
// notification_logs.status records whether delivery actually succeeded,
// not just that a send was attempted. Shared by every email caller
// (payments/notify.ts, auth/actions.ts) so there's one place that decides
// how a send result becomes a notifications/notification_logs row pair.
export async function logEmailDelivery(
  title: string,
  body: string,
  status: "SENT" | "FAILED",
  errorDetail?: string,
): Promise<void> {
  const supabase = createServiceClient();
  const { data: notification } = await supabase
    .from("notifications")
    .insert({ title, body })
    .select("id")
    .single();
  await supabase.from("notification_logs").insert({
    notification_id: notification?.id ?? null,
    channel: "email",
    status,
    provider_response: errorDetail ? { error: errorDetail } : null,
  });
}
