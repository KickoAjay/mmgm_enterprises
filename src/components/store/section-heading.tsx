export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <h2 className="font-serif text-section text-foreground">{title}</h2>
      {subtitle ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
