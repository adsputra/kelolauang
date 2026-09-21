import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirectPath } from '@/src/lib/api/request';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { logger } from '@/src/shared/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/?auth_error=missing_code', origin));
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logger.warn('authCallback', 'Gagal menukar kode konfirmasi email', { code: error.code, status: error.status });
    return NextResponse.redirect(new URL('/?auth_error=confirmation_failed', origin));
  }

  const response = NextResponse.redirect(new URL(next, origin));
  for (const [key, value] of responseHeaders.entries()) {
    response.headers.set(key, value);
  }
  return response;
}
