import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { logger } from '../shared/logger';
import type { Result } from '../shared/result';
import { failure, success } from '../shared/result';
import type {
  FinanceOverview,
  Transaction,
  TransactionDraft,
  UserProfile,
  UserProfileDraft,
} from '../types';
import { parseFinanceOverview } from '../features/finance/overview';

type Client = SupabaseClient<Database>;
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

export const TRANSACTION_PAGE_SIZE = 100;
const TRANSACTION_COLUMNS = 'id,type,amount,date,category,notes,created_at,updated_at';
const PROFILE_COLUMNS = 'name,monthly_limit,updated_at';

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfile(row: UserRow): UserProfile {
  return {
    name: row.name,
    monthlyLimit: Number(row.monthly_limit),
    updatedAt: row.updated_at,
  };
}

function dataFailure(code: string | undefined, fallback: string, context?: string) {
  if (code) {
    logger.warn('financeRepository', `${context ?? 'Data operation'}: ${fallback}`, { code });
  }
  if (code === '42501') return failure('FORBIDDEN', 'Sesi Anda tidak memiliki izin untuk operasi ini.');
  if (code === '23514' || code === '22001') {
    return failure('VALIDATION_ERROR', 'Data ditolak oleh aturan keamanan database.');
  }
  return failure(code ?? 'DATA_ERROR', fallback);
}

function unexpectedFailure(context: string, message: string, error: unknown) {
  logger.error('financeRepository', context, error);
  return failure('DATA_ERROR', message);
}

export async function fetchFinanceOverview(
  client: Client,
  asOfDate: string,
): Promise<Result<FinanceOverview>> {
  try {
    const { data, error } = await client.rpc('get_finance_overview', { p_as_of: asOfDate });
    if (error || !data) {
      return dataFailure(error?.code, 'Ringkasan keuangan tidak dapat dimuat.', 'get_finance_overview');
    }
    return parseFinanceOverview(data);
  } catch (error) {
    return unexpectedFailure('Ringkasan keuangan gagal dimuat', 'Ringkasan keuangan tidak dapat dimuat.', error);
  }
}

export async function fetchProfile(
  client: Client,
  userId: string,
): Promise<Result<UserProfile>> {
  try {
    const { data, error } = await client
      .from('users')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .single();
    return error || !data
      ? dataFailure(error?.code, 'Profil tidak dapat dimuat.', 'fetchProfile')
      : success(mapProfile(data as UserRow));
  } catch (error) {
    return unexpectedFailure('Profil gagal dimuat', 'Profil tidak dapat dimuat.', error);
  }
}

export async function fetchTransactionsPage(
  client: Client,
  userId: string,
  page: number,
): Promise<Result<{ transactions: Transaction[]; hasMore: boolean }>> {
  const from = page * TRANSACTION_PAGE_SIZE;
  const to = from + TRANSACTION_PAGE_SIZE;

  try {
    const { data, error } = await client
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error || !data) {
      return dataFailure(error?.code, 'Transaksi tidak dapat dimuat.', 'fetchTransactionsPage');
    }

    return success({
      transactions: (data as TransactionRow[]).slice(0, TRANSACTION_PAGE_SIZE).map(mapTransaction),
      hasMore: data.length > TRANSACTION_PAGE_SIZE,
    });
  } catch (error) {
    return unexpectedFailure('Transaksi gagal dimuat', 'Transaksi tidak dapat dimuat.', error);
  }
}

export async function createTransaction(
  client: Client,
  userId: string,
  draft: TransactionDraft,
  idempotencyKey?: string,
): Promise<Result<Transaction>> {
  try {
    const { data, error } = await client
      .from('transactions')
      .insert({
        user_id: userId,
        type: draft.type,
        amount: draft.amount,
        date: draft.date,
        category: draft.category,
        notes: draft.notes || null,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      })
      .select(TRANSACTION_COLUMNS)
      .single();

    if (error?.code === '23505' && idempotencyKey) {
      return fetchTransactionByIdempotencyKey(client, userId, idempotencyKey);
    }
    if (error?.code === '42703' && idempotencyKey) {
      // Migrasi idempotency belum diterapkan: tetap simpan tanpa deduplikasi.
      logger.warn('financeRepository', 'Kolom idempotency_key belum tersedia; migrasi belum diterapkan');
      return createTransaction(client, userId, draft);
    }

    return error || !data
      ? dataFailure(error?.code, 'Transaksi gagal disimpan.', 'createTransaction')
      : success(mapTransaction(data as TransactionRow));
  } catch (error) {
    return unexpectedFailure('Transaksi gagal disimpan', 'Transaksi gagal disimpan.', error);
  }
}

async function fetchTransactionByIdempotencyKey(
  client: Client,
  userId: string,
  idempotencyKey: string,
): Promise<Result<Transaction>> {
  try {
    const { data, error } = await client
      .from('transactions')
      .select(TRANSACTION_COLUMNS)
      .eq('user_id', userId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    return error || !data
      ? dataFailure(error?.code, 'Transaksi idempotent tidak dapat dimuat.', 'fetchTransactionByIdempotencyKey')
      : success(mapTransaction(data as TransactionRow));
  } catch (error) {
    return unexpectedFailure(
      'Transaksi idempotent gagal dimuat',
      'Transaksi tidak dapat dimuat.',
      error,
    );
  }
}

export async function updateTransaction(
  client: Client,
  userId: string,
  transactionId: string,
  expectedUpdatedAt: string,
  draft: TransactionDraft,
): Promise<Result<Transaction>> {
  try {
    const updatedAt = new Date().toISOString();
    const { data, error } = await client
      .from('transactions')
      .update({ ...draft, notes: draft.notes || null, updated_at: updatedAt })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('updated_at', expectedUpdatedAt)
      .select(TRANSACTION_COLUMNS)
      .maybeSingle();

    if (error) {
      return dataFailure(error.code, 'Perubahan transaksi gagal disimpan.', 'updateTransaction');
    }
    if (!data) {
      return failure('EDIT_CONFLICT', 'Transaksi sudah berubah di perangkat lain. Muat ulang lalu coba kembali.');
    }
    return success(mapTransaction(data as TransactionRow));
  } catch (error) {
    return unexpectedFailure('Transaksi gagal diperbarui', 'Perubahan transaksi gagal disimpan.', error);
  }
}

export async function removeTransaction(
  client: Client,
  userId: string,
  transactionId: string,
  expectedUpdatedAt: string,
): Promise<Result<void>> {
  try {
    const { data, error } = await client
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('updated_at', expectedUpdatedAt)
      .select('id')
      .maybeSingle();

    if (error) return dataFailure(error.code, 'Transaksi gagal dihapus.', 'removeTransaction');
    if (!data) return failure('DELETE_CONFLICT', 'Transaksi sudah berubah atau dihapus di perangkat lain.');
    return success(undefined);
  } catch (error) {
    return unexpectedFailure('Transaksi gagal dihapus', 'Transaksi gagal dihapus.', error);
  }
}

export async function saveProfile(
  client: Client,
  userId: string,
  expectedUpdatedAt: string,
  draft: UserProfileDraft,
): Promise<Result<UserProfile>> {
  try {
    const updatedAt = new Date().toISOString();
    const { data, error } = await client
      .from('users')
      .update({ name: draft.name, monthly_limit: draft.monthlyLimit, updated_at: updatedAt })
      .eq('id', userId)
      .eq('updated_at', expectedUpdatedAt)
      .select(PROFILE_COLUMNS)
      .maybeSingle();

    if (error) return dataFailure(error.code, 'Profil gagal disimpan.', 'saveProfile');
    if (!data) return failure('PROFILE_CONFLICT', 'Profil sudah berubah di perangkat lain. Muat ulang dahulu.');
    return success(mapProfile(data as UserRow));
  } catch (error) {
    return unexpectedFailure('Profil gagal disimpan', 'Profil gagal disimpan.', error);
  }
}

export async function resetFinanceData(client: Client): Promise<Result<void>> {
  try {
    const { error } = await client.rpc('reset_finance_data');
    return error
      ? dataFailure(error.code, 'Data keuangan gagal direset.', 'reset_finance_data')
      : success(undefined);
  } catch (error) {
    return unexpectedFailure('Data keuangan gagal direset', 'Data keuangan gagal direset.', error);
  }
}
