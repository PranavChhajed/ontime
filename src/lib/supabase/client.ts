import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Safe to expose: it only holds the publishable key; every
 *  table is protected by row-level rules that require an approved Admin. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
