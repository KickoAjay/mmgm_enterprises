const DEFAULT_TIMEOUT_MS = 3_000;

// Supabase Auth calls run on every page via middleware and session reads.
// When Auth is slow or unreachable (520 / fetch failed), the default client
// can retry long enough to make the storefront feel stuck. Cap each request
// so anonymous browsing and catalog pages still render.
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (init?.signal) {
    const upstream = init.signal;
    if (upstream.aborted) {
      clearTimeout(timeoutId);
      return Promise.reject(
        upstream.reason ?? new DOMException("Aborted", "AbortError"),
      );
    }
    upstream.addEventListener(
      "abort",
      () => controller.abort(upstream.reason),
      { once: true },
    );
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}
