// Shared URL-building helpers for the /sarees catalog filters — used by
// both server-rendered filter Links and the client-side sort dropdown, so
// filter state lives entirely in the URL (shareable, bookmarkable, works
// without JS for every filter except Sort).

export function buildCatalogHref(
  basePath: string,
  current: Record<string, string | undefined>,
  updates: Record<string, string | null | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  // Any filter/sort/search change resets pagination, unless the caller is
  // explicitly changing the page itself.
  if (!("page" in updates)) params.delete("page");

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// Toggles `value` in/out of a comma-separated list param, returning the new
// value (or null to remove the param entirely when the list empties out).
export function toggleListValue(
  current: string | undefined,
  value: string,
): string | null {
  const list = current
    ? current
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  const idx = list.indexOf(value);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  return list.length > 0 ? list.join(",") : null;
}

export function parseListParam(value?: string): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}
