import { isSameOriginRequest, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { registerAccount } from '@/src/server/authService';
import { validateRegisterInput } from '@/src/features/auth/authValidation';

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);

  const validated = validateRegisterInput(body.data.name, body.data.email, body.data.password);
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  const emailRedirectTo = new URL('/api/auth/callback', request.url).toString();
  const result = await registerAccount(
    supabase,
    validated.data.name,
    validated.data.email,
    validated.data.password,
    emailRedirectTo,
  );
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
