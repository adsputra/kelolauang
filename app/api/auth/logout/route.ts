import { isSameOriginRequest } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { signOut } from '@/src/server/authService';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const result = await signOut(supabase);
  return result.ok ? apiSuccess(null, responseHeaders) : apiFailure(result.error, responseHeaders);
}
