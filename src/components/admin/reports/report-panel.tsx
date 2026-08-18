export function ReportPanel({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border border-border bg-background p-5 ${className ?? ""}`}
    >
      <p className="text-meta font-semibold tracking-wide text-foreground uppercase">
        {title}
      </p>
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}
