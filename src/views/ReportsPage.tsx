import { useMemo, useState } from 'react';
import LucideIcon from '../components/LucideIcon';
import TransactionFilters from '../features/finance/TransactionFilters';
import TransactionTable from '../features/finance/TransactionTable';
import { ALL_CATEGORIES } from '../features/finance/categories';
import { filterTransactions, sumTransactions } from '../features/finance/domain';
import { createInitialFilters } from '../features/finance/filters';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { downloadTransactionsCsv } from '../features/reports/csv';
import { formatRp } from '../shared/currency';
import type { FilterState } from '../types';

interface ReportsPageProps {
  onEditTransaction: (id: string) => void;
}

export default function ReportsPage({ onEditTransaction }: ReportsPageProps) {
  const {
    transactions,
    hasMoreTransactions,
    isLoadingMore,
    loadMoreTransactions,
    loadAllTransactions,
  } = useFinanceData();
  const [filters, setFilters] = useState<FilterState>(() => createInitialFilters());
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );
  const income = sumTransactions(filteredTransactions, 'income');
  const expense = sumTransactions(filteredTransactions, 'expense');

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportMessage(null);

    let source = transactions;
    if (hasMoreTransactions) {
      const result = await loadAllTransactions();
      if (!result.ok) {
        setExportMessage(result.error.message);
        setIsExporting(false);
        return;
      }
      source = result.data;
    }

    const exportRows = filterTransactions(source, filters);
    if (exportRows.length === 0) {
      setExportMessage('Tidak ada transaksi yang cocok dengan filter untuk diekspor.');
      setIsExporting(false);
      return;
    }

    downloadTransactionsCsv(exportRows);
    setExportMessage(`${exportRows.length} transaksi berhasil disiapkan dalam CSV.`);
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Laporan keuangan</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Riwayat dan analisis
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Tinjau transaksi dengan filter yang jelas, lalu ekspor hasil yang sama ke CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || (transactions.length === 0 && !hasMoreTransactions)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <LucideIcon name={isExporting ? 'LoaderCircle' : 'Download'} size={16} className={isExporting ? 'animate-spin' : ''} />
          {isExporting ? 'Menyiapkan semua data…' : 'Ekspor CSV'}
        </button>
      </header>

      <TransactionFilters
        filters={filters}
        categories={ALL_CATEGORIES}
        onChange={setFilters}
        showType
        showCustomRange
      />

      {hasMoreTransactions && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Ringkasan di layar baru menghitung data yang sudah dimuat. Ekspor CSV akan memuat seluruh transaksi terlebih dahulu.
        </p>
      )}

      {exportMessage && (
        <p role="status" className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {exportMessage}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan hasil filter">
        <Metric label="Pemasukan" amount={income} tone="income" icon="TrendingUp" />
        <Metric label="Pengeluaran" amount={expense} tone="expense" icon="TrendingDown" />
        <Metric label="Selisih" amount={income - expense} tone="neutral" icon="Wallet" />
      </section>

      <TransactionTable
        transactions={filteredTransactions}
        onEdit={onEditTransaction}
        showType
        emptyTitle="Laporan tidak memiliki hasil"
        emptyDescription="Ubah kata pencarian, kategori, jenis, atau periode yang dipilih."
        hasMore={hasMoreTransactions}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => void loadMoreTransactions()}
      />
    </div>
  );
}

interface MetricProps {
  label: string;
  amount: number;
  tone: 'income' | 'expense' | 'neutral';
  icon: string;
}

function Metric({ label, amount, tone, icon }: MetricProps) {
  const tones = {
    income: 'text-emerald-700 dark:text-emerald-300',
    expense: 'text-rose-700 dark:text-rose-300',
    neutral: 'text-zinc-950 dark:text-zinc-100',
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{label}</p>
        <LucideIcon name={icon} size={16} className="text-zinc-500 dark:text-zinc-400" />
      </div>
      <p className={`mt-2 break-words font-mono text-lg font-bold ${tones[tone]}`}>{formatRp(amount)}</p>
    </article>
  );
}
