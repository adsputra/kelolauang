import type { CategoryOption, FilterState } from '../../types';
import { parseDateOnly } from '../../shared/date';
import LucideIcon from '../../components/LucideIcon';

interface TransactionFiltersProps {
  filters: FilterState;
  categories: CategoryOption[];
  onChange: (filters: FilterState) => void;
  showType?: boolean;
  showCustomRange?: boolean;
}

export default function TransactionFilters({
  filters,
  categories,
  onChange,
  showType = false,
  showCustomRange = false,
}: TransactionFiltersProps) {
  const update = <Key extends keyof FilterState>(key: Key, value: FilterState[Key]) => {
    onChange({ ...filters, [key]: value });
  };
  const start = filters.customStartDate ? parseDateOnly(filters.customStartDate) : null;
  const end = filters.customEndDate ? parseDateOnly(filters.customEndDate) : null;
  const rangeError = start && end && start > end ? 'Tanggal mulai harus sebelum tanggal akhir.' : null;

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Filter transaksi"
    >
      <div
        className={`grid items-end gap-3 ${
          showType
            ? 'sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1.4fr)_repeat(3,minmax(10rem,0.7fr))]'
            : 'sm:grid-cols-2 lg:grid-cols-[minmax(18rem,1fr)_minmax(11rem,14rem)_minmax(10rem,12rem)]'
        }`}
      >
        <div className={showType ? 'sm:col-span-2 xl:col-span-1' : 'sm:col-span-2 lg:col-span-1'}>
          <label htmlFor="transaction-search" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Cari transaksi
          </label>
          <div className="relative">
            <LucideIcon
              name="Search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              id="transaction-search"
              type="search"
              value={filters.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Kategori atau catatan"
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
            />
          </div>
        </div>

        {showType && (
          <div>
            <label htmlFor="transaction-type-filter" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Jenis
            </label>
            <select
              id="transaction-type-filter"
              value={filters.type}
              onChange={(event) => update('type', event.target.value as FilterState['type'])}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Semua arus kas</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="transaction-category-filter" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Kategori
          </label>
          <select
            id="transaction-category-filter"
            value={filters.category}
            onChange={(event) => update('category', event.target.value)}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="all">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transaction-date-filter" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Periode
          </label>
          <select
            id="transaction-date-filter"
            value={filters.dateRange}
            onChange={(event) => update('dateRange', event.target.value as FilterState['dateRange'])}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="all">Semua waktu</option>
            <option value="today">Hari ini</option>
            <option value="7days">7 hari terakhir</option>
            <option value="month">Bulan ini</option>
            {showCustomRange && <option value="custom">Rentang khusus</option>}
          </select>
        </div>
      </div>

      {showCustomRange && filters.dateRange === 'custom' && (
        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 dark:border-zinc-800">
          <div>
            <label htmlFor="custom-start-date" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tanggal mulai</label>
            <input
              id="custom-start-date"
              type="date"
              value={filters.customStartDate ?? ''}
              max={filters.customEndDate || undefined}
              onChange={(event) => update('customStartDate', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="custom-end-date" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tanggal akhir</label>
            <input
              id="custom-end-date"
              type="date"
              value={filters.customEndDate ?? ''}
              min={filters.customStartDate || undefined}
              onChange={(event) => update('customEndDate', event.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          {rangeError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300 sm:col-span-2">{rangeError}</p>}
        </div>
      )}
    </section>
  );
}
