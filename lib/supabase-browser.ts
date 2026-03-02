import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Cria um cliente Supabase para uso no browser.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}