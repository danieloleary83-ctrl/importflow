import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. Uses the anon key + the signed-in user's
 * session cookie, so it is still subject to Row Level Security.
 * Safe to use in Server Components, Route Handlers and Server Actions.
 *
 * Not using the generated <Database> generic here: our hand-written schema
 * types don't include the full Relationships metadata postgrest-js expects,
 * which produced false "never" type errors on joined/embedded queries.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component render - middleware refreshes
            // the session instead, so this can be safely ignored.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}
