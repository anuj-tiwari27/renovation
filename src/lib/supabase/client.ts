import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Note: typing intentionally loose. Cast query results to row types from
// `./database.types` at the call site (e.g. `data as Project[]`). When the
// user links their Supabase project, run `npm run db:types` and replace
// this with `createBrowserClient<Database>(...)` for full inference.
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
