import { apiError, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { isAuthUnavailable, toAuthUser } from '@/src/server/authService';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { supabase, responseHeaders } = await createRequestSupabaseContext();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && isAuthUnavailable(error)) {
      return apiError(
        'AUTH_UNAVAILABLE',
        'Layanan autentikasi sedang bermasalah. Coba lagi sesaat.',
        responseHeaders,
      );
    }
    if (error || !data.user) {
      return apiSuccess(null, responseHeaders);
    }
    return apiSuccess(toAuthUser(data.user), responseHeaders);
  } catch {
    return apiError(
      'AUTH_UNAVAILABLE',
      'Layanan autentikasi tidak dapat dihubungi. Coba lagi sesaat.',
      responseHeaders,
    );
  }
}
