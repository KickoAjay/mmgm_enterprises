export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-background p-5">
      <p className="text-meta text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
