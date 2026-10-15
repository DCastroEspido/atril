import { defineConfig } from 'vitest/config';

// Database policy tests: need `supabase start` (Docker). Kept out of the default test run.
export default defineConfig({
  test: { include: ['supabase/tests/**/*.test.ts'], environment: 'node', testTimeout: 20000, fileParallelism: false },
});
