/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Unset: Atril runs without accounts or the shared library. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key; safe to ship, row level security does the protecting. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
