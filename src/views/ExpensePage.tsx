import { useMemo, useState } from 'react';
import LucideIcon from '../components/LucideIcon';
import { EXPENSE_CATEGORIES } from '../features/finance/categories';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { getBudgetStatus, filterTransactions } from '../features/finance/domain';
import { createInitialFilters } from '../features/finance/filters';
import TransactionFilters from '../features/finance/TransactionFilters';
import TransactionTable from '../features/finance/TransactionTable';
import FinancialMetricStrip from '../features/finance/FinancialMetricStrip';
import { formatRp } from '../shared/currency';
import type { FilterState } from '../types';

interface ExpensePageProps {
  onOpenAddModal: () => void;
  onEditTransaction: (id: string) => void;
}

export default function ExpensePage({ onOpenAddModal, onEditTransaction }: ExpensePageProps) {
  const {
    transactions,
    financeOverview,
    userProfile,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreTransactions,
  } = useFinanceData();
  const [filters, setFilters] = useState<FilterState>(() => createInitialFilters('expense'));
  const expenses = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'expense'),
    [transactions],
  );
  const filteredExpenses = useMemo(() => filterTransactions(expenses, filters), [expenses, filters]);
  const monthExpense = financeOverview.currentMonthExpense;
  const totalExpense = financeOverview.totalExpense;
  const budget = getBudgetStatus(monthExpense, userProfile.monthlyLimit);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">Pengeluaran</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Pantau arus kas keluar dan penggunaan anggaran bulanan.</p>
        </div>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 dark:bg-rose-800 dark:hover:bg-rose-700"
        >
          <LucideIcon name="Plus" size={17} />
          Catat pengeluaran
        </button>
      </header>

      <div className="space-y-4">
        <FinancialMetricStrip
          label="Ringkasan pengeluaran"
          metrics={[
            {
              label: 'Pengeluaran bulan ini',
              amount: monthExpense,
              tone: 'expense',
              supportingText: 'Transaksi pada bulan berjalan',
            },
            {
              label: `Anggaran terpakai · ${budget.percent}%`,
              amount: monthExpense,
              supportingText: `Batas bulanan ${formatRp(userProfile.monthlyLimit)}`,
              progress: {
                value: budget.percent,
                label: 'Penggunaan anggaran bulanan',
                tone: budget.tone,
              },
            },
            {
              label: 'Total pengeluaran tercatat',
              amount: totalExpense,
              supportingText: 'Akumulasi seluruh transaksi',
            },
          ]}
        />

        {budget.isOverBudget && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <LucideIcon name="AlertTriangle" size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Anggaran bulanan terlampaui</p>
              <p className="mt-1 text-sm leading-6">Pengeluaran bulan ini melewati batas {formatRp(userProfile.monthlyLimit)}.</p>
            </div>
          </div>
        )}

        {hasMoreTransactions && (
          <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Daftar menampilkan riwayat terbaru. Muat transaksi berikutnya untuk melihat periode yang lebih lama.
          </p>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="expense-list-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="expense-list-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Daftar pengeluaran
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Cari dan tinjau transaksi yang sudah tercatat.
            </p>
          </div>
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            {filteredExpenses.length.toLocaleString('id-ID')} ditampilkan
          </p>
        </div>

        <TransactionFilters filters={filters} categories={EXPENSE_CATEGORIES} onChange={setFilters} />
        <TransactionTable
          transactions={filteredExpenses}
          onEdit={onEditTransaction}
          emptyTitle="Pengeluaran tidak ditemukan"
          emptyDescription="Ubah filter pencarian atau catat pengeluaran baru."
          hasMore={hasMoreTransactions}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => void loadMoreTransactions()}
        />
      </section>
    </div>
  );
}
