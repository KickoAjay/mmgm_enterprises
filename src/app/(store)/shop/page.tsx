import { redirect } from "next/navigation";

// Spec §17 requires both /shop and /sarees to exist. /sarees is the single
// canonical implementation (filters, sort, search); /shop is a thin alias
// that preserves query params so links built as /shop?sort=newest etc.
// (see nav-links.ts, footer.tsx) still work.
export default async function ShopRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else if (value !== undefined) {
      qs.set(key, value);
    }
  }
  const query = qs.toString();
  redirect(query ? `/sarees?${query}` : "/sarees");
}
