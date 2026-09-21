/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useFinanceData } from '../features/finance/FinanceDataContext';
import { formatRp } from '../shared/currency';
import LucideIcon from './LucideIcon';

export default function SummaryCards() {
  const { financeOverview, userProfile } = useFinanceData();
  const { totalIncome, totalExpense, currentMonthIncome, currentMonthExpense } = financeOverview;
  const totalBalance = totalIncome - totalExpense;
  const monthNet = currentMonthIncome - currentMonthExpense;
  const savingsRate = currentMonthIncome > 0
    ? Math.max(0, Math.round((monthNet / currentMonthIncome) * 100))
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Balance Card (Premium Dark Aesthetic) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-300">Total saldo</p>
            <h3 className="mt-1.5 font-mono text-3xl font-bold tracking-tight text-white">
              {formatRp(totalBalance)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400 border border-zinc-700">
            <LucideIcon name="Wallet" size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
          <span>Akumulasi bersih seluruh transaksi</span>
        </div>
      </div>

      {/* Monthly Income Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Pemasukan bulan ini</p>
            <h3 className="mt-1.5 font-mono text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatRp(currentMonthIncome)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
            <LucideIcon name="ArrowUpRight" size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <span>Semua Pemasukan</span>
          <span className="font-mono text-zinc-400 dark:text-zinc-500">All-time: {formatRp(totalIncome)}</span>
        </div>
      </div>

      {/* Monthly Expenses Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Pengeluaran bulan ini</p>
            <h3 className="mt-1.5 font-mono text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatRp(currentMonthExpense)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50">
            <LucideIcon name="ArrowDownRight" size={16} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <span className="truncate" title={`Limit: ${formatRp(userProfile.monthlyLimit)}`}>
            Limit: {formatRp(userProfile.monthlyLimit)}
          </span>
          <span className="font-mono text-zinc-400 dark:text-zinc-500 shrink-0">All-time: {formatRp(totalExpense)}</span>
        </div>
      </div>

      {/* Monthly Savings / Difference Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Selisih dan tabungan</p>
            <h3 className={`mt-1.5 font-mono text-3xl font-bold tracking-tight ${monthNet >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatRp(monthNet)}
            </h3>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-900">
            <LucideIcon name="Sparkle" size={16} className="text-amber-500" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <span>Rasio Menabung</span>
          <span className={`font-semibold ${savingsRate > 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {savingsRate}% dari pemasukan
          </span>
        </div>
      </div>
    </div>
  );
}
