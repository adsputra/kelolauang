import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';
import { requireSupabaseEnv } from '../env';
import { supabaseFetch } from './fetch';

export interface RequestSupabaseContext {
  /** Klien Supabase yang membaca/menulis sesi dari cookie server (httpOnly). */
  supabase: SupabaseClient<Database>;
  /** Header cache yang wajib ikut pada response ketika token sesi diperbarui. */
  responseHeaders: Headers;
}

/**
 * Membuat klien Supabase untuk satu request server (Route Handler / Proxy).
 * Cookie sesi selalu ditulis sebagai httpOnly + SameSite=Lax sehingga token
 * tidak pernah dapat dibaca JavaScript di browser.
 */
export async function createRequestSupabaseContext(): Promise<RequestSupabaseContext> {
  const cookieStore = await cookies();
  const env = requireSupabaseEnv();
  const responseHeaders = new Headers();

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        }
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders.set(key, value);
        }
      },
    },
  });

  return { supabase, responseHeaders };
}
