// Stub for the "server-only" package under Vitest — that package throws
// on import outside Next's own bundler by design (verified in Phase 10),
// which would otherwise make it impossible to unit test any pure logic
// living in a file that also happens to import next/headers. Aliased in
// vitest.config.ts; never used outside the test runner.
export {};
