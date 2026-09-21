import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Result } from '../../shared/result';
import { failure, success } from '../../shared/result';
import { toLocalDateInput } from '../../shared/date';
import type { FinanceOverview, Transaction, TransactionDraft, UserProfile, UserProfileDraft } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { DEFAULT_MONTHLY_LIMIT } from './domain';
import {
  createTransaction,
  fetchFinanceOverview,
  fetchProfile,
  fetchTransactionsPage,
  removeTransaction,
  resetFinanceData,
  saveProfile,
  updateTransaction,
} from './financeRepository';
import {
  applyTransactionChangeToOverview,
  buildOverviewFromTransactions,
  createEmptyFinanceOverview,
} from './overview';
import { validateTransactionDraft, validateUserProfileDraft } from './validation';

interface FinanceDataContextValue {
  transactions: Transaction[];
  financeOverview: FinanceOverview;
  userProfile: UserProfile;
  isLoadingData: boolean;
  hasLoadedInitial: boolean;
  dataError: string | null;
  clearDataError: () => void;
  hasMoreTransactions: boolean;
  isLoadingMore: boolean;
  reload: () => Promise<void>;
  loadMoreTransactions: () => Promise<Result<void>>;
  loadAllTransactions: () => Promise<Result<Transaction[]>>;
  addTransaction: (draft: TransactionDraft, idempotencyKey?: string) => Promise<Result<Transaction>>;
  editTransaction: (transaction: Transaction, draft: TransactionDraft) => Promise<Result<Transaction>>;
  deleteTransaction: (transaction: Transaction) => Promise<Result<void>>;
  updateUserProfile: (draft: UserProfileDraft) => Promise<Result<UserProfile>>;
  resetAllFinanceData: () => Promise<Result<void>>;
}

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null);

function defaultProfile(name: string): UserProfile {
  return { name, monthlyLimit: DEFAULT_MONTHLY_LIMIT, updatedAt: '' };
}

function staleSessionFailure() {
  return failure('STALE_SESSION', 'Sesi berubah saat permintaan berjalan. Silakan coba kembali.');
}

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { user, syncAccountName } = useAuth();
  const userId = user?.id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeOverview, setFinanceOverview] = useState<FinanceOverview>(() =>
    createEmptyFinanceOverview(toLocalDateInput()),
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() => defaultProfile(''));
  const [isLoadingData, setIsLoadingData] = useState(false);
  const hasLoadedInitialRef = useRef(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageRef = useRef(0);
  const requestVersion = useRef(0);
  const paginationRequestInFlight = useRef(false);
  const overviewFromFallbackRef = useRef(false);
  const transactionsRef = useRef<Transaction[]>([]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const loadInitialData = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setTransactions([]);
        setFinanceOverview(createEmptyFinanceOverview(toLocalDateInput()));
        setUserProfile(defaultProfile(''));
        setDataError(null);
        setIsLoadingData(false);
        hasLoadedInitialRef.current = false;
        setHasLoadedInitial(false);
        pageRef.current = 0;
        setHasMoreTransactions(false);
        setIsLoadingMore(false);
        paginationRequestInFlight.current = false;
        overviewFromFallbackRef.current = false;
        return;
      }

      const version = ++requestVersion.current;
      if (!hasLoadedInitialRef.current) {
        setIsLoadingData(true);
      }
      setDataError(null);
      pageRef.current = 0;

      const [profileResult, transactionsResult, overviewResult] = await Promise.all([
        fetchProfile(signal),
        fetchTransactionsPage(0, signal),
        fetchFinanceOverview(toLocalDateInput()),
      ]);

      if (version !== requestVersion.current || signal?.aborted) return;

      if (!profileResult.ok) {
        setDataError(profileResult.error.message);
        setIsLoadingData(false);
        return;
      }
      if (!transactionsResult.ok) {
        setDataError(transactionsResult.error.message);
        setIsLoadingData(false);
        return;
      }
      setUserProfile(profileResult.data);
      setTransactions(transactionsResult.data.transactions);
      setHasMoreTransactions(transactionsResult.data.hasMore);

      if (overviewResult.ok) {
        setFinanceOverview(overviewResult.data);
        overviewFromFallbackRef.current = false;
      } else {
        // Fallback anggun: bila RPC database belum terpasang, hitung ringkasan dari transaksi yang dimuat
        setFinanceOverview(
          buildOverviewFromTransactions(transactionsResult.data.transactions, toLocalDateInput()),
        );
        overviewFromFallbackRef.current = true;
      }
      setIsLoadingData(false);
      hasLoadedInitialRef.current = true;
      setHasLoadedInitial(true);
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadInitialData(controller.signal));
    return () => {
      requestVersion.current += 1;
      controller.abort();
    };
  }, [loadInitialData]);

  const reload = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const loadMoreTransactions = useCallback(async (): Promise<Result<void>> => {
    if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
    if (paginationRequestInFlight.current || !hasMoreTransactions) return success(undefined);

    paginationRequestInFlight.current = true;
    setIsLoadingMore(true);
    const version = requestVersion.current;
    const nextPage = pageRef.current + 1;
    const result = await fetchTransactionsPage(nextPage);
    paginationRequestInFlight.current = false;
    setIsLoadingMore(false);

    if (version !== requestVersion.current) return staleSessionFailure();
    if (!result.ok) {
      setDataError(result.error.message);
      return result;
    }

    pageRef.current = nextPage;
    setTransactions((current) => {
      const knownIds = new Set(current.map((transaction) => transaction.id));
      return [...current, ...result.data.transactions.filter((transaction) => !knownIds.has(transaction.id))];
    });
    setHasMoreTransactions(result.data.hasMore);
    setDataError(null);
    return success(undefined);
  }, [user, hasMoreTransactions]);

  const loadAllTransactions = useCallback(async (): Promise<Result<Transaction[]>> => {
    if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
    if (paginationRequestInFlight.current) {
      return failure('REQUEST_IN_PROGRESS', 'Data transaksi sedang dimuat. Coba lagi sesaat.');
    }

    paginationRequestInFlight.current = true;
    setIsLoadingMore(true);
    const version = requestVersion.current;
    let nextPage = pageRef.current + 1;
    let shouldContinue = hasMoreTransactions;
    let allTransactions = [...transactions];

    try {
      // Sengaja tidak menyentuh state utama atau pageRef: ekspor CSV bersifat read-only,
      // sehingga transaksi yang diubah pengguna saat proses berjalan tidak tertimpa.
      while (shouldContinue) {
        const result = await fetchTransactionsPage(nextPage);
        if (version !== requestVersion.current) return staleSessionFailure();
        if (!result.ok) return result;

        const knownIds = new Set(allTransactions.map((transaction) => transaction.id));
        allTransactions = [
          ...allTransactions,
          ...result.data.transactions.filter((transaction) => !knownIds.has(transaction.id)),
        ];
        shouldContinue = result.data.hasMore;
        nextPage += 1;
      }

      if (version === requestVersion.current && overviewFromFallbackRef.current) {
        setFinanceOverview(buildOverviewFromTransactions(allTransactions, toLocalDateInput()));
      }

      return success(allTransactions);
    } finally {
      paginationRequestInFlight.current = false;
      setIsLoadingMore(false);
    }
  }, [user, hasMoreTransactions, transactions]);

  const addTransaction = useCallback(
    async (draft: TransactionDraft, idempotencyKey?: string): Promise<Result<Transaction>> => {
      if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
      const validated = validateTransactionDraft(draft);
      if (!validated.ok) return validated;

      const version = requestVersion.current;
      const result = await createTransaction(validated.data, idempotencyKey);
      if (version !== requestVersion.current) return staleSessionFailure();
      if (result.ok) {
        // Bila server memutar ulang transaksi yang sama (retry setelah timeout),
        // jangan tambahkan dua kali ke daftar maupun agregat.
        const alreadyPresent = transactionsRef.current.some((item) => item.id === result.data.id);
        setTransactions((current) => (alreadyPresent ? current : [result.data, ...current]));
        if (!alreadyPresent) {
          setFinanceOverview((current) => applyTransactionChangeToOverview(current, null, result.data));
        }
      }
      return result;
    },
    [user],
  );

  const editTransaction = useCallback(
    async (transaction: Transaction, draft: TransactionDraft): Promise<Result<Transaction>> => {
      if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
      const validated = validateTransactionDraft(draft);
      if (!validated.ok) return validated;

      const version = requestVersion.current;
      const result = await updateTransaction(transaction, validated.data);
      if (version !== requestVersion.current) return staleSessionFailure();
      if (result.ok) {
        setTransactions((current) =>
          current.map((item) => (item.id === result.data.id ? result.data : item)),
        );
        setFinanceOverview((current) =>
          applyTransactionChangeToOverview(current, transaction, result.data),
        );
      }
      return result;
    },
    [user],
  );

  const deleteTransaction = useCallback(
    async (transaction: Transaction): Promise<Result<void>> => {
      if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
      const version = requestVersion.current;
      const result = await removeTransaction(transaction);
      if (version !== requestVersion.current) return staleSessionFailure();
      if (result.ok) {
        setTransactions((current) => current.filter((item) => item.id !== transaction.id));
        setFinanceOverview((current) =>
          applyTransactionChangeToOverview(current, transaction, null),
        );
      }
      return result;
    },
    [user],
  );

  const updateUserProfile = useCallback(
    async (draft: UserProfileDraft): Promise<Result<UserProfile>> => {
      if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
      const validated = validateUserProfileDraft(draft);
      if (!validated.ok) return validated;

      const version = requestVersion.current;
      const result = await saveProfile(userProfile, validated.data);
      if (version !== requestVersion.current) return staleSessionFailure();
      if (result.ok) {
        setUserProfile(result.data);
        const syncResult = await syncAccountName(result.data.name);
        if (!syncResult.ok) return syncResult;
      }
      return result;
    },
    [user, userProfile, syncAccountName],
  );

  const clearDataError = useCallback(() => setDataError(null), []);

  const resetAllFinanceData = useCallback(async (): Promise<Result<void>> => {
    if (!user) return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir.');
    const version = requestVersion.current;
    const result = await resetFinanceData();
    if (version !== requestVersion.current) return staleSessionFailure();
    if (result.ok) await loadInitialData();
    return result;
  }, [user, loadInitialData]);

  const value = useMemo(
    () => ({
      transactions,
      financeOverview,
      userProfile,
      isLoadingData,
      hasLoadedInitial,
      dataError,
      clearDataError,
      hasMoreTransactions,
      isLoadingMore,
      reload,
      loadMoreTransactions,
      loadAllTransactions,
      addTransaction,
      editTransaction,
      deleteTransaction,
      updateUserProfile,
      resetAllFinanceData,
    }),
    [
      transactions,
      financeOverview,
      userProfile,
      isLoadingData,
      hasLoadedInitial,
      dataError,
      clearDataError,
      hasMoreTransactions,
      isLoadingMore,
      reload,
      loadMoreTransactions,
      loadAllTransactions,
      addTransaction,
      editTransaction,
      deleteTransaction,
      updateUserProfile,
      resetAllFinanceData,
    ],
  );

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>;
}

export function useFinanceData(): FinanceDataContextValue {
  const context = useContext(FinanceDataContext);
  if (!context) throw new Error('useFinanceData harus digunakan di dalam FinanceDataProvider.');
  return context;
}
