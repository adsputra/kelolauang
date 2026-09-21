import { apiError, apiFailure, apiSuccess } from '@/src/lib/api/response';
import { createRequestSupabaseContext } from '@/src/lib/supabase/server';
import { requireUser } from '@/src/server/authService';
import { fetchFinanceOverview } from '@/src/server/financeRepository';
import { parseDateOnly } from '@/src/shared/date';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const { supabase, responseHeaders } = await createRequestSupabaseContext();
  const userResult = await requireUser(supabase);
  if (!userResult.ok) return apiFailure(userResult.error, responseHeaders);

  const asOf = new URL(request.url).searchParams.get('asOf') ?? '';
  const parsedDate = parseDateOnly(asOf);
  if (!parsedDate || parsedDate.getFullYear() < 1900 || parsedDate.getFullYear() > 2100) {
    return apiError('INVALID_DATE', 'Parameter tanggal ringkasan tidak valid.', responseHeaders);
  }

  const result = await fetchFinanceOverview(supabase, asOf);
  return result.ok ? apiSuccess(result.data, responseHeaders) : apiFailure(result.error, responseHeaders);
}
