import { isIsoTimestamp, isSameOriginRequest, isUuid, readJsonObject } from '@/src/lib/api/request';
import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { removeTransaction, updateTransaction } from '@/src/server/financeRepository';
import { validateTransactionDraft } from '@/src/features/finance/validation';

export const dynamic = 'force-dynamic';

interface TransactionRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: TransactionRouteContext): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const { id } = await context.params;
  if (!isUuid(id)) {
    return apiError('INVALID_INPUT', 'ID transaksi tidak valid.', responseHeaders);
  }

  const body = await readJsonObject(request);
  if (!body.ok) return apiFailure(body.error, responseHeaders);
  if (!isIsoTimestamp(body.data.expectedUpdatedAt)) {
    return apiError('INVALID_INPUT', 'Versi transaksi tidak valid. Muat ulang halaman lalu coba kembali.', responseHeaders);
  }

  const validated = validateTransactionDraft({
    type: body.data.type,
    amount: body.data.amount,
    date: body.data.date,
    category: body.data.category,
    notes: body.data.notes ?? '',
  } as { type: 'income' | 'expense'; amount: number; date: string; category: string; notes: string });
  if (!validated.ok) return apiFailure(validated.error, responseHeaders);

  const result = await updateTransaction(
    supabase,
    userResult.data.id,
    id,
    body.data.expectedUpdatedAt,
    validated.data,
  );
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}

export async function DELETE(request: Request, context: TransactionRouteContext): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return apiError('CSRF_REJECTED', 'Permintaan ditolak karena berasal dari origin yang tidak dikenal.');
  }

  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const { id } = await context.params;
  if (!isUuid(id)) {
    return apiError('INVALID_INPUT', 'ID transaksi tidak valid.', responseHeaders);
  }

  const expectedUpdatedAt = new URL(request.url).searchParams.get('expectedUpdatedAt');
  if (!isIsoTimestamp(expectedUpdatedAt)) {
    return apiError('INVALID_INPUT', 'Versi transaksi tidak valid. Muat ulang halaman lalu coba kembali.', responseHeaders);
  }

  const result = await removeTransaction(supabase, userResult.data.id, id, expectedUpdatedAt);
  return result.ok ? apiSuccess(null, responseHeaders) : apiFailure(result.error, responseHeaders);
}
