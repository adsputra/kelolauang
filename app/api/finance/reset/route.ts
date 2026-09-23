import { getClientIp, isSameOriginRequest } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { resetFinanceData } from '@/src/server/financeRepository';
import { financeResetRateLimiter } from '@/src/server/rateLimiter';
import { logger } from '@/src/shared/logger';

export async function POST(request: Request): Promise<Response> {
  const clientIp = getClientIp(request);

  if (!isSameOriginRequest(request)) {
    logger.security('CSRF_REJECTED', {
      path: '/api/finance/reset',
      ip: clientIp,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const rateCheck = financeResetRateLimiter.check(userResult.data.id);
  if (!rateCheck.allowed) {
    logger.security('RATE_LIMIT_EXCEEDED', {
      path: '/api/finance/reset',
      userId: userResult.data.id,
      ip: clientIp,
    });
    const retryHeaders = new Headers({ 'Retry-After': String(rateCheck.resetInSeconds) });
    return apiError(
      'TOO_MANY_REQUESTS',
      `Operasi reset data dibatasi. Tunggu ${Math.ceil(rateCheck.resetInSeconds / 60)} menit lalu coba kembali.`,
      retryHeaders,
    );
  }

  const result = await resetFinanceData(supabase);
  if (result.ok) {
    logger.security('FINANCE_DATA_RESET', {
      userId: userResult.data.id,
      ip: clientIp,
    });
  }

  return result.ok ? apiSuccess(null, responseHeaders) : apiFailure(result.error, responseHeaders);
}
