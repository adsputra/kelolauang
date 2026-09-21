import { isSameOriginRequest, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser, updateAccountName } from '@/src/server/authService';
import { validateName } from '@/src/features/auth/authValidation';

export async function PATCH(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);

  const validated = validateName(body.data.name);
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  const result = await updateAccountName(supabase, validated.data);
  return result.ok ? apiSuccess(null, responseHeaders) : apiFailure(result.error, responseHeaders);
}
