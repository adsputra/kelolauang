import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getBudgetStatus } from '../features/finance/domain';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { useUi } from '../features/ui/UiContext';
import { NAV_ITEMS } from '../features/ui/navigation';
import { formatRp } from '../shared/currency';
import type { TransactionType } from '../types';
import LucideIcon from './LucideIcon';

interface SidebarProps {
  onOpenAddModal: (type: TransactionType) => void;
}

export default function Sidebar({ onOpenAddModal }: SidebarProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const { financeOverview, userProfile } = useFinanceData();
  const { activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed } = useUi();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const currentMonthExpenses = financeOverview.currentMonthExpense;
  const budget = getBudgetStatus(currentMonthExpenses, userProfile.monthlyLimit);
  const displayName = userProfile.name || user?.name || 'Pengguna';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setLogoutError(null);
    const result = await logout();
    if (result.ok) setActiveTab('dashboard');
    else setLogoutError(result.error.message);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out md:flex dark:border-zinc-900 dark:bg-black ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Sidebar aplikasi"
    >
      <div className={`flex h-[72px] shrink-0 items-center border-b border-zinc-200 dark:border-zinc-900 ${sidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 dark:bg-zinc-900">
            <LucideIcon name="Wallet" size={17} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 animate-page-enter">
              <p className="truncate text-sm font-bold">KelolaUang</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">Keuangan pribadi</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="flex size-11 items-center justify-center rounded-lg text-zinc-600 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Ciutkan sidebar"
          >
            <LucideIcon name="PanelLeftClose" size={18} />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="mx-auto mt-3 flex size-11 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Perbesar sidebar"
        >
          <LucideIcon name="PanelLeftOpen" size={18} />
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi desktop">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 w-full items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                sidebarCollapsed ? 'justify-center' : 'gap-3 px-3'
              } ${
                isActive
                  ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <LucideIcon name={item.icon} size={18} className={isActive ? 'text-emerald-400 dark:text-emerald-600' : ''} />
              {!sidebarCollapsed && <span className="truncate animate-page-enter">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-900">
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onOpenAddModal('income')}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
            title={sidebarCollapsed ? 'Tambah pemasukan' : undefined}
            aria-label={sidebarCollapsed ? 'Tambah pemasukan' : undefined}
          >
            <LucideIcon name="Plus" size={17} />
            {!sidebarCollapsed && 'Pemasukan'}
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModal('expense')}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50"
            title={sidebarCollapsed ? 'Tambah pengeluaran' : undefined}
            aria-label={sidebarCollapsed ? 'Tambah pengeluaran' : undefined}
          >
            <LucideIcon name="Plus" size={17} />
            {!sidebarCollapsed && 'Pengeluaran'}
          </button>
        </div>
      </div>

      {!sidebarCollapsed && (
        <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Anggaran bulan ini</span>
            <span className={budget.isOverBudget ? 'font-semibold text-rose-600 dark:text-rose-300' : 'text-zinc-600 dark:text-zinc-300'}>
              {budget.percent}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" role="progressbar" aria-label="Penggunaan anggaran" aria-valuenow={budget.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full transition-[width] duration-300 ease-out ${budget.tone === 'danger' ? 'bg-rose-500' : budget.tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${currentMonthExpenses > 0 ? Math.max(budget.percent, 1.5) : 0}%` }} />
          </div>
          <p className="mt-2 truncate text-xs text-zinc-600 dark:text-zinc-300">
            {formatRp(currentMonthExpenses)} dari {formatRp(userProfile.monthlyLimit)}
          </p>
        </div>
      )}

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-900">
        <div className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center gap-3'}`}>
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            title={sidebarCollapsed ? `${displayName} (${user?.email ?? ''})` : undefined}
          >
            {initials || 'KU'}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className={`flex shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950 ${
              sidebarCollapsed ? 'size-10' : 'size-11'
            }`}
            title={sidebarCollapsed ? 'Keluar dari akun' : undefined}
            aria-label={isLoggingOut ? 'Sedang keluar' : 'Keluar dari akun'}
          >
            <LucideIcon name={isLoggingOut ? 'LoaderCircle' : 'LogOut'} size={18} className={isLoggingOut ? 'animate-spin' : ''} />
          </button>
        </div>
        {logoutError && (
          <p role="alert" className={`mt-2 text-xs text-rose-600 dark:text-rose-300 ${sidebarCollapsed ? 'text-center' : ''}`}>
            {sidebarCollapsed ? 'Gagal keluar' : logoutError}
          </p>
        )}
      </div>
    </aside>
  );
}
