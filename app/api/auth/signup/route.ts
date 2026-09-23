import { getClientIp, isSameOriginRequest, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { registerAccount } from '@/src/server/authService';
import { validateRegisterInput } from '@/src/features/auth/authValidation';
import { authSignupRateLimiter } from '@/src/server/rateLimiter';
import { logger } from '@/src/shared/logger';

export async function POST(request: Request): Promise<Response> {
  const clientIp = getClientIp(request);

  if (!isSameOriginRequest(request)) {
    logger.security('CSRF_REJECTED', {
      path: '/api/auth/signup',
      ip: clientIp,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const rateCheck = authSignupRateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    logger.security('RATE_LIMIT_EXCEEDED', { path: '/api/auth/signup', ip: clientIp });
    const retryHeaders = new Headers({ 'Retry-After': String(rateCheck.resetInSeconds) });
    return apiError(
      'TOO_MANY_REQUESTS',
      `Terlalu banyak permintaan pendaftaran akun. Tunggu ${rateCheck.resetInSeconds} detik lalu coba kembali.`,
      retryHeaders,
    );
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

  if (result.ok) {
    logger.security('ACCOUNT_REGISTERED', { ip: clientIp });
  }

  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
