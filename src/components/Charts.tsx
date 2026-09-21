import { useState } from 'react';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { formatRp } from '../shared/currency';
import LucideIcon from './LucideIcon';

const CHART_COLORS = [
  '#f97316',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#6366f1',
  '#06b6d4',
  '#64748b',
];

function EmptyChart({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300">
        <LucideIcon name="AlertCircle" size={20} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-300">{description}</p>
    </section>
  );
}

export function ExpenseDonutChart() {
  const { financeOverview } = useFinanceData();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const totalExpense = financeOverview.currentMonthExpense;
  const categoryTotals = financeOverview.expenseByCategory.map((item) => ({
    ...item,
    label: item.category,
    percentage: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
  }));

  if (totalExpense === 0) {
    return (
      <EmptyChart
        title="Belum ada pengeluaran bulan ini"
        description="Catat pengeluaran untuk melihat distribusi kategori pada bulan berjalan."
      />
    );
  }

  const chartSegments = categoryTotals.map((segment, index) => ({
    ...segment,
    offset: -categoryTotals
      .slice(0, index)
      .reduce((total, previousSegment) => total + previousSegment.percentage, 0),
  }));

  return (
    <section className="flex min-h-80 flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950" aria-labelledby="expense-chart-title">
      <h3 id="expense-chart-title" className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
        Distribusi pengeluaran
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Berdasarkan kategori pada bulan berjalan</p>

      <div className="mt-6 grid flex-1 items-center gap-6 sm:grid-cols-2">
        <div className="relative mx-auto size-44" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="40" pathLength="100" fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-900" />
            {chartSegments.map((segment, index) => {
              return (
                <circle
                  key={segment.category}
                  cx="50"
                  cy="50"
                  r="40"
                  pathLength="100"
                  fill="none"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={activeIndex === index ? 15 : 12}
                  strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                  strokeDashoffset={segment.offset}
                  className="transition-[stroke-width]"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="max-w-24 truncate text-xs text-zinc-600 dark:text-zinc-300">
              {activeIndex === null ? 'Total bulan ini' : categoryTotals[activeIndex].label}
            </span>
            <strong className="mt-1 text-sm text-zinc-950 dark:text-zinc-100">
              {formatRp(activeIndex === null ? totalExpense : categoryTotals[activeIndex].amount)}
            </strong>
            {activeIndex !== null && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {Math.round(categoryTotals[activeIndex].percentage)}%
              </span>
            )}
          </div>
        </div>

        <ul className="max-h-52 space-y-1 overflow-y-auto" aria-label="Rincian kategori pengeluaran">
          {categoryTotals.map((item, index) => (
            <li key={item.category}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:hover:bg-zinc-900"
                aria-label={`${item.label}, ${formatRp(item.amount)}, ${Math.round(item.percentage)} persen`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.label}</span>
                </span>
                <span className="shrink-0 text-xs text-zinc-600 dark:text-zinc-300">{Math.round(item.percentage)}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function MonthlyBarChart() {
  const { financeOverview } = useFinanceData();
  const [activeBar, setActiveBar] = useState<{ index: number; type: 'income' | 'expense' } | null>(null);
  const chartData = financeOverview.monthlyCashFlow;
  const maxValue = Math.max(1, ...chartData.flatMap((item) => [item.income, item.expense]));

  return (
    <section className="flex min-h-80 flex-col rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950" aria-labelledby="cashflow-chart-title">
      <h3 id="cashflow-chart-title" className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
        Tren arus kas bulanan
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Pemasukan dan pengeluaran lima bulan terakhir</p>
      <div className="mt-4 flex justify-end gap-4 text-xs text-zinc-600 dark:text-zinc-300" aria-hidden="true">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" />Masuk</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-500" />Keluar</span>
      </div>

      <div className="relative mt-4 flex min-h-48 flex-1 items-end border-b border-zinc-200 dark:border-zinc-800">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <span className="bg-white pr-1 dark:bg-zinc-950">{formatRp(maxValue)}</span>
        </div>
        <div className="flex h-44 w-full items-end justify-around gap-1 px-1 sm:px-4">
          {chartData.map((item, index) => (
            <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <div className="flex h-36 items-end justify-center gap-1 sm:gap-2">
                {(['income', 'expense'] as const).map((type) => {
                  const value = item[type];
                  const isActive = activeBar?.index === index && activeBar.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onMouseEnter={() => setActiveBar({ index, type })}
                      onMouseLeave={() => setActiveBar(null)}
                      onFocus={() => setActiveBar({ index, type })}
                      onBlur={() => setActiveBar(null)}
                      className="relative flex h-full w-6 items-end justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 sm:w-10"
                      aria-label={`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${item.label}: ${formatRp(value)}`}
                    >
                      <span
                        className={`block w-3 rounded-t-sm transition-[height,background-color] sm:w-4 ${
                          type === 'income'
                            ? isActive ? 'bg-emerald-600' : 'bg-emerald-400'
                            : isActive ? 'bg-rose-600' : 'bg-rose-400'
                        }`}
                        style={{ height: `${Math.max(value > 0 ? 3 : 0, (value / maxValue) * 100)}%` }}
                      />
                      {isActive && (
                        <span className="absolute bottom-full z-10 mb-1 whitespace-nowrap rounded bg-zinc-950 px-2 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-950">
                          {formatRp(value)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="mt-2 truncate text-xs font-medium text-zinc-600 dark:text-zinc-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
