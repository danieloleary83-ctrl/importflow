"use client";

import { createBrowserClient } from "@supabase/ssr";

// Not using the generated <Database> generic here: our hand-written schema
// types don't include the full Relationships metadata postgrest-js expects,
// which produced false "never" type errors on joined/embedded queries.
// We still get type safety at the edges via src/lib/types/database.ts
// interfaces and explicit casts where it matters.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
