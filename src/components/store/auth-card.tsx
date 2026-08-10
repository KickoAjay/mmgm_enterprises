import type { ReactNode } from "react";

// Shared layout for the four auth pages (register/login/forgot/reset
// password) — Phase 3 replaces the bare page shell with the real Header/
// Footer; this just centers a form card with brand + heading.
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-24">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Enterprises
      </span>
      <h1 className="mt-4 font-serif text-2xl text-foreground">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-8">{children}</div>
      {footer ? (
        <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </main>
  );
}
