import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrderDate } from "@/features/orders/format";
import {
  ORDER_STATUS_LABELS,
  TIMELINE_STATUSES,
  TIMELINE_STEP_LABELS,
  isOffTimelineStatus,
  type OrderStatus,
} from "@/features/orders/status";

export type StatusHistoryEntry = { status: string; createdAt: string };

// Pure/presentational — no server-only imports — so it can render inside
// both a Server Component (/account/orders/[orderId]) and a Client
// Component (/track-order, rendering a Server Action's result).
export function OrderStatusTimeline({
  currentStatus,
  history,
}: {
  currentStatus: string;
  history: StatusHistoryEntry[];
}) {
  if (isOffTimelineStatus(currentStatus)) {
    const entry = history.find((h) => h.status === currentStatus);
    return (
      <div className="border border-border bg-secondary p-4">
        <p className="text-sm font-medium text-foreground">
          {ORDER_STATUS_LABELS[currentStatus as OrderStatus] ?? currentStatus}
        </p>
        {entry ? (
          <p className="text-meta mt-1 text-muted-foreground">
            {formatOrderDate(entry.createdAt)}
          </p>
        ) : null}
      </div>
    );
  }

  const currentIndex = TIMELINE_STATUSES.indexOf(currentStatus as OrderStatus);
  const historyByStatus = new Map(history.map((h) => [h.status, h.createdAt]));

  return (
    <ol className="flex flex-col gap-0">
      {TIMELINE_STATUSES.map((status, index) => {
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const timestamp = historyByStatus.get(status);
        const isLast = index === TIMELINE_STATUSES.length - 1;

        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {reached ? <Check className="size-3.5" /> : null}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "w-px flex-1",
                    index < currentIndex ? "bg-primary" : "bg-border",
                  )}
                  style={{ minHeight: "1.5rem" }}
                />
              ) : null}
            </div>
            <div className="pb-6">
              <p
                className={cn(
                  "text-sm",
                  reached ? "font-medium text-foreground" : "text-muted-foreground",
                  isCurrent && "font-semibold",
                )}
              >
                {TIMELINE_STEP_LABELS[status]}
              </p>
              {timestamp ? (
                <p className="text-meta mt-0.5 text-muted-foreground">
                  {formatOrderDate(timestamp)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
