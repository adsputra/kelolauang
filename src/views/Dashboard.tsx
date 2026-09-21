import { ExpenseDonutChart, MonthlyBarChart } from '../components/Charts';
import LucideIcon from '../components/LucideIcon';
import SummaryCards from '../components/SummaryCards';
import TransactionTable from '../features/finance/TransactionTable';
import { sortTransactionsNewestFirst } from '../features/finance/domain';
import { useFinanceData } from '../features/finance/FinanceDataContext';

interface DashboardProps {
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onEditTransaction: (id: string) => void;
}

function getGreeting(hour = new Date().getHours()): string {
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function Dashboard({ onOpenAddModal, onEditTransaction }: DashboardProps) {
  const { transactions, userProfile } = useFinanceData();
  const recentTransactions = sortTransactionsNewestFirst(transactions).slice(0, 5);
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium capitalize text-zinc-500 dark:text-zinc-400">{formattedToday}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {getGreeting()}, {userProfile.name}
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Ringkasan kondisi keuangan pribadi Anda pada bulan berjalan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => onOpenAddModal('income')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <LucideIcon name="TrendingUp" size={16} />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModal('expense')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
          >
            <LucideIcon name="TrendingDown" size={16} />
            Pengeluaran
          </button>
        </div>
      </header>

      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyBarChart />
        <ExpenseDonutChart />
      </div>

      <section className="space-y-3" aria-labelledby="recent-transactions-title">
        <div>
          <h2 id="recent-transactions-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
            Transaksi terakhir
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Lima pemasukan atau pengeluaran terbaru.
          </p>
        </div>
        <TransactionTable
          transactions={recentTransactions}
          onEdit={onEditTransaction}
          showType
          emptyTitle="Belum ada transaksi"
          emptyDescription="Catat pemasukan atau pengeluaran pertama Anda melalui tombol di atas."
        />
      </section>
    </div>
  );
}
