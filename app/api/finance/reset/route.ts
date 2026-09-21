import { isSameOriginRequest } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { resetFinanceData } from '@/src/server/financeRepository';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const result = await resetFinanceData(supabase);
  return result.ok ? apiSuccess(null, responseHeaders) : apiFailure(result.error, responseHeaders);
}
