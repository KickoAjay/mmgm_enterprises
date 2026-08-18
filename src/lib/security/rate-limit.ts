import "server-only";
import { headers } from "next/headers";

// In-memory fixed-window limiter — a real first line of defense against
// casual credential-stuffing/email-bombing on a single warm serverless
// instance, not a substitute for a shared store (Redis/Upstash). On
// Vercel each cold start gets a fresh Map, and concurrent instances don't
// share counts, so a well-resourced attacker can route around it; that
// tradeoff is accepted here rather than adding an external dependency
// this project doesn't otherwise need. Good enough to blunt naive
// scripted abuse of the login/reset/resend forms, which is the actual
// threat model for a project at this stage.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Bound memory: buckets are cheap (two numbers) but unbounded keys (IP +
// action) would leak forever otherwise. Sweep opportunistically.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// x-forwarded-for is attacker-controlled on a direct connection, but
// behind Vercel's edge network the first hop is trustworthy — this is
// the standard way to get the real client IP in a Next.js Server Action.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
