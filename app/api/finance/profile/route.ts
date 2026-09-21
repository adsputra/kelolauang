import { isIsoTimestamp, isSameOriginRequest, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { fetchProfile, saveProfile } from '@/src/server/financeRepository';
import { validateUserProfileDraft } from '@/src/features/finance/validation';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const result = await fetchProfile(supabase, userResult.data.id);
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}

export async function PATCH(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);

  const validated = validateUserProfileDraft({
    name: body.data.name,
    monthlyLimit: body.data.monthlyLimit,
  } as { name: string; monthlyLimit: number });
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  if (!isIsoTimestamp(body.data.expectedUpdatedAt)) {
    return apiError('INVALID_INPUT', 'Versi profil tidak valid. Muat ulang halaman lalu coba kembali.', responseHeaders);
  }

  const result = await saveProfile(supabase, userResult.data.id, body.data.expectedUpdatedAt, validated.data);
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
