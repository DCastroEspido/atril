import { defineConfig } from 'vitest/config';

// Database policy tests, run against the Atril Staging project (`npm run test:db`). Kept out of the default run.
export default defineConfig({
  test: { include: ['supabase/tests/**/*.test.ts'], environment: 'node', testTimeout: 20000, fileParallelism: false },
});
