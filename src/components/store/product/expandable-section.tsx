import type { ReactNode } from "react";

// Plain <details>/<summary> — native expand/collapse, no client JS needed.
export function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-border py-4" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold tracking-wide text-foreground uppercase">
        {title}
        <span className="text-lg text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}
