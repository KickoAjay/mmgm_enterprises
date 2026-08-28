// Shared site URL helper — Vercel env vars are sometimes set without a
// protocol (e.g. "mmgm-enterprises.vercel.app"), which breaks `new URL()`.
export function normalizeSiteUrl(url?: string): string {
  const fallback = "http://localhost:3000";
  let trimmed = (url ?? fallback).trim().replace(/\/+$/, "");
  if (!trimmed) trimmed = fallback;

  if (!/^https?:\/\//i.test(trimmed)) {
    const isLocal =
      trimmed.startsWith("localhost") ||
      trimmed.startsWith("127.0.0.1") ||
      /^10\./.test(trimmed) ||
      /^192\.168\./.test(trimmed) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(trimmed);
    trimmed = `${isLocal ? "http" : "https"}://${trimmed}`;
  }

  return trimmed;
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
