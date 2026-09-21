import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { readSupabaseEnv } from './src/lib/env';
import { supabaseFetch } from './src/lib/supabase/fetch';

const SESSION_COOKIE_PATTERN = /^sb-.*-auth-token(\.\d+)?$/;

/**
 * Menyegarkan token sesi Supabase di latar belakang dan menulis ulang cookie
 * sebagai httpOnly. Route handler tetap memvalidasi autentikasi sendiri
 * (defense in depth), proxy ini hanya menjaga sesi tetap hidup.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = readSupabaseEnv();
  if (!env) return response;

  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => SESSION_COOKIE_PATTERN.test(cookie.name));
  if (!hasSessionCookie) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Refresh gagal (mis. jaringan) tidak boleh memblokir request;
    // route handler akan mengembalikan 401 bila sesi memang tidak valid.
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
