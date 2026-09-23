import { getClientIp, isSameOriginRequest, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { signInWithPassword } from '@/src/server/authService';
import { validateLoginInput } from '@/src/features/auth/authValidation';
import { authLoginRateLimiter } from '@/src/server/rateLimiter';
import { logger } from '@/src/shared/logger';

export async function POST(request: Request): Promise<Response> {
  const clientIp = getClientIp(request);

  if (!isSameOriginRequest(request)) {
    logger.security('CSRF_REJECTED', {
      path: '/api/auth/login',
      ip: clientIp,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const rateCheck = authLoginRateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    logger.security('RATE_LIMIT_EXCEEDED', { path: '/api/auth/login', ip: clientIp });
    const retryHeaders = new Headers({ 'Retry-After': String(rateCheck.resetInSeconds) });
    return apiError(
      'TOO_MANY_REQUESTS',
      `Terlalu banyak percobaan masuk. Tunggu ${rateCheck.resetInSeconds} detik lalu coba kembali.`,
      retryHeaders,
    );
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);

  const validated = validateLoginInput(body.data.email, body.data.password);
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  const result = await signInWithPassword(supabase, validated.data.email, validated.data.password);
  if (result.ok) {
    authLoginRateLimiter.reset(clientIp);
  } else {
    logger.security('LOGIN_FAILED', {
      ip: clientIp,
      code: result.error.code,
    });
  }

  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
