import { useMemo, useState } from 'react';
import LucideIcon from '../components/LucideIcon';
import { INCOME_CATEGORIES } from '../features/finance/categories';
import { filterTransactions } from '../features/finance/domain';
import { createInitialFilters } from '../features/finance/filters';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import TransactionFilters from '../features/finance/TransactionFilters';
import TransactionTable from '../features/finance/TransactionTable';
import FinancialMetricStrip from '../features/finance/FinancialMetricStrip';
import type { FilterState } from '../types';

interface IncomePageProps {
  onOpenAddModal: () => void;
  onEditTransaction: (id: string) => void;
}

export default function IncomePage({ onOpenAddModal, onEditTransaction }: IncomePageProps) {
  const {
    transactions,
    financeOverview,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreTransactions,
  } = useFinanceData();
  const [filters, setFilters] = useState<FilterState>(() => createInitialFilters('income'));
  const incomes = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'income'),
    [transactions],
  );
  const filteredIncomes = useMemo(() => filterTransactions(incomes, filters), [incomes, filters]);
  const { totalIncome, totalExpense, currentMonthIncome } = financeOverview;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">Pemasukan</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Pantau seluruh sumber pendapatan dan saldo bersih Anda.</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <LucideIcon name="Plus" size={17} />
          Catat pemasukan
        </button>
      </header>

      <div className="space-y-4">
        <FinancialMetricStrip
          label="Ringkasan pemasukan"
          metrics={[
            {
              label: 'Pemasukan bulan ini',
              amount: currentMonthIncome,
              tone: 'income',
              supportingText: 'Transaksi pada bulan berjalan',
            },
            {
              label: 'Total pemasukan tercatat',
              amount: totalIncome,
              supportingText: 'Akumulasi seluruh transaksi',
            },
            {
              label: 'Saldo bersih',
              amount: totalIncome - totalExpense,
              tone: totalIncome - totalExpense < 0 ? 'expense' : 'neutral',
              supportingText: 'Pemasukan dikurangi pengeluaran',
            },
          ]}
        />

        {hasMoreTransactions && (
          <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Daftar menampilkan riwayat terbaru. Muat transaksi berikutnya untuk melihat periode yang lebih lama.
          </p>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="income-list-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="income-list-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Daftar pemasukan
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Cari dan tinjau transaksi yang sudah tercatat.
            </p>
          </div>
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            {filteredIncomes.length.toLocaleString('id-ID')} ditampilkan
          </p>
        </div>

        <TransactionFilters filters={filters} categories={INCOME_CATEGORIES} onChange={setFilters} />
        <TransactionTable
          transactions={filteredIncomes}
          onEdit={onEditTransaction}
          emptyTitle="Pemasukan tidak ditemukan"
          emptyDescription="Ubah filter pencarian atau catat pemasukan baru."
          hasMore={hasMoreTransactions}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void loadMoreTransactions()}
        />
      </section>
    </div>
  );
}
