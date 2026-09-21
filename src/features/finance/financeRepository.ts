import { requestApi } from '../../lib/api/client';
import { success, type Result } from '../../shared/result';
import type {
  FinanceOverview,
  Transaction,
  TransactionDraft,
  UserProfile,
  UserProfileDraft,
} from '../../types';

export const TRANSACTION_PAGE_SIZE = 100;

export function fetchFinanceOverview(asOfDate: string): Promise<Result<FinanceOverview>> {
  return requestApi<FinanceOverview>(
    `/api/finance/overview?asOf=${encodeURIComponent(asOfDate)}`,
  );
}

export function fetchProfile(signal?: AbortSignal): Promise<Result<UserProfile>> {
  return requestApi<UserProfile>('/api/finance/profile', { signal });
}

export function fetchTransactionsPage(
  page: number,
  signal?: AbortSignal,
): Promise<Result<{ transactions: Transaction[]; hasMore: boolean }>> {
  return requestApi(`/api/finance/transactions?page=${page}`, { signal });
}

export function createTransaction(
  draft: TransactionDraft,
  idempotencyKey?: string,
): Promise<Result<Transaction>> {
  return requestApi<Transaction>('/api/finance/transactions', {
    method: 'POST',
    body: JSON.stringify(draft),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function updateTransaction(
  transaction: Transaction,
  draft: TransactionDraft,
): Promise<Result<Transaction>> {
  return requestApi<Transaction>(`/api/finance/transactions/${transaction.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...draft, expectedUpdatedAt: transaction.updatedAt }),
  });
}

export async function removeTransaction(transaction: Transaction): Promise<Result<void>> {
  const result = await requestApi<null>(
    `/api/finance/transactions/${transaction.id}?expectedUpdatedAt=${encodeURIComponent(transaction.updatedAt)}`,
    { method: 'DELETE' },
  );
  return result.ok ? success(undefined) : result;
}

export function saveProfile(
  currentProfile: UserProfile,
  draft: UserProfileDraft,
): Promise<Result<UserProfile>> {
  return requestApi<UserProfile>('/api/finance/profile', {
    method: 'PATCH',
    body: JSON.stringify({ ...draft, expectedUpdatedAt: currentProfile.updatedAt }),
  });
}

export async function resetFinanceData(): Promise<Result<void>> {
  const result = await requestApi<null>('/api/finance/reset', { method: 'POST' });
  return result.ok ? success(undefined) : result;
}
