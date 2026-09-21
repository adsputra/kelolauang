import { isSameOriginRequest, isUuid, parsePageParam, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { createTransaction, fetchTransactionsPage } from '@/src/server/financeRepository';
import { validateTransactionDraft } from '@/src/features/finance/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const page = parsePageParam(new URL(request.url).searchParams.get('page'));
  if (page === null) {
    return apiError('INVALID_INPUT', 'Parameter halaman tidak valid.', responseHeaders);
  }

  const result = await fetchTransactionsPage(supabase, userResult.data.id, page);
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey !== null && !isUuid(idempotencyKey)) {
    return apiError('INVALID_INPUT', 'Idempotency-Key harus berupa UUID yang valid.', responseHeaders);
  }

  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);

  const validated = validateTransactionDraft({
    type: body.data.type,
    amount: body.data.amount,
    date: body.data.date,
    category: body.data.category,
    notes: body.data.notes ?? '',
  } as { type: 'income' | 'expense'; amount: number; date: string; category: string; notes: string });
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  const result = await createTransaction(
    supabase,
    userResult.data.id,
    validated.data,
    idempotencyKey ?? undefined,
  );
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
