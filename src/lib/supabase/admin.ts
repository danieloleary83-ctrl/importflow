import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client using the SERVICE ROLE key. This bypasses Row Level Security.
 *
 * NEVER import this file from a Client Component or expose it to the
 * browser. It is guarded by the `server-only` package, which throws a
 * build error if anything tries to bundle it client-side. Only use this
 * for trusted server-side operations (e.g. the AI Import confirm step)
 * where we deliberately need to write across tables in one transaction.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
