import LucideIcon from '../../components/LucideIcon';
import { formatRp } from '../../shared/currency';
import { formatTransactionDate } from '../../shared/date';
import type { Transaction } from '../../types';
import { getCategoryDetails } from './categories';
import TransactionActions from './TransactionActions';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  showType?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function LoadMoreControl({
  isLoading,
  onLoadMore,
}: {
  isLoading: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="border-t border-zinc-200 p-4 text-center dark:border-zinc-800">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        {isLoading && <LucideIcon name="LoaderCircle" size={16} className="animate-spin" />}
        {isLoading ? 'Memuat…' : 'Muat transaksi berikutnya'}
      </button>
    </div>
  );
}

function Amount({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'income';
  return (
    <span className={`font-mono text-sm font-bold ${isIncome ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
      {isIncome ? '+' : '-'} {formatRp(transaction.amount)}
    </span>
  );
}

export default function TransactionTable({
  transactions,
  onEdit,
  showType = false,
  emptyTitle = 'Tidak ada transaksi',
  emptyDescription = 'Ubah filter atau catat transaksi baru.',
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-4 py-16 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300">
            <LucideIcon name="AlertCircle" size={20} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{emptyTitle}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-300">{emptyDescription}</p>
        </div>
        {hasMore && onLoadMore && <LoadMoreControl isLoading={isLoadingMore} onLoadMore={onLoadMore} />}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" aria-label="Daftar transaksi">
      <div className="divide-y divide-zinc-200 md:hidden dark:divide-zinc-800">
        {transactions.map((transaction) => {
          const category = getCategoryDetails(transaction.category);
          return (
            <article key={transaction.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${category.color}`}>
                    <LucideIcon name={category.icon} size={16} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{transaction.category}</h3>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">{formatTransactionDate(transaction.date)}</p>
                  </div>
                </div>
                <Amount transaction={transaction} />
              </div>
              {transaction.notes && <p className="mt-3 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300">{transaction.notes}</p>}
              <div className="mt-3 flex justify-end">
                <TransactionActions transaction={transaction} onEdit={onEdit} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <tr>
              {showType && <th scope="col" className="px-5 py-3 font-semibold">Jenis</th>}
              <th scope="col" className="px-5 py-3 font-semibold">Kategori</th>
              <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
              <th scope="col" className="px-5 py-3 font-semibold">Catatan</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Jumlah</th>
              <th scope="col" className="w-32 px-4 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {transactions.map((transaction) => {
              const category = getCategoryDetails(transaction.category);
              return (
                <tr key={transaction.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  {showType && (
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {transaction.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                  )}
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="flex items-center gap-2.5">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${category.color}`}>
                        <LucideIcon name={category.icon} size={14} />
                      </span>
                      <span className="max-w-44 truncate" title={transaction.category}>{transaction.category}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-zinc-600 dark:text-zinc-300">{formatTransactionDate(transaction.date)}</td>
                  <td className="max-w-64 px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                    <span className="block truncate" title={transaction.notes}>{transaction.notes || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right"><Amount transaction={transaction} /></td>
                  <td className="px-4 py-2"><TransactionActions transaction={transaction} onEdit={onEdit} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && onLoadMore && (
        <LoadMoreControl isLoading={isLoadingMore} onLoadMore={onLoadMore} />
      )}
    </section>
  );
}
