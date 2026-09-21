import { useCallback, useState } from 'react';
import AppProviders from './app/AppProviders';
import BottomNav from './components/BottomNav';
import DarkModeToggle from './components/DarkModeToggle';
import DashboardSkeleton from './components/DashboardSkeleton';
import LucideIcon from './components/LucideIcon';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import { useAuth } from './features/auth/AuthContext';
import { useFinanceData } from './features/finance/FinanceDataContext';
import { useUi } from './features/ui/UiContext';
import type { ActiveTab, TransactionType } from './types';
import AuthPage from './views/AuthPage';
import Dashboard from './views/Dashboard';
import ExpensePage from './views/ExpensePage';
import IncomePage from './views/IncomePage';
import ReportsPage from './views/ReportsPage';
import SettingsPage from './views/SettingsPage';

const PAGE_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Dasbor keuangan',
  income: 'Manajemen pemasukan',
  expense: 'Manajemen pengeluaran',
  reports: 'Riwayat dan laporan',
  settings: 'Pengaturan aplikasi',
};

function FullPageLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black" aria-busy="true">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-zinc-900 text-emerald-400 shadow-xl dark:bg-zinc-800 dark:text-emerald-300">
          <LucideIcon name="Wallet" size={30} className="animate-pulse" />
          <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-sm animate-pulse" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">KelolaUang</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <LucideIcon name="LoaderCircle" size={15} className="animate-spin text-zinc-600 dark:text-zinc-300" />
          Memuat aplikasi…
        </p>
      </div>
    </main>
  );
}

function DataErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
        <LucideIcon name="AlertCircle" size={22} />
      </div>
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">Data belum dapat dimuat</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 flex min-h-11 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
      >
        <LucideIcon name="RefreshCw" size={16} />
        Coba lagi
      </button>
    </div>
  );
}

function AppContent() {
  const { user, status } = useAuth();
  const { activeTab, setActiveTab, sidebarCollapsed } = useUi();
  const { isLoadingData, hasLoadedInitial, dataError, clearDataError, reload } = useFinanceData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [formDefaultType, setFormDefaultType] = useState<TransactionType>('expense');

  const closeForm = useCallback(() => setIsFormOpen(false), []);
  const handleOpenAddModal = useCallback((type: TransactionType) => {
    setFormDefaultType(type);
    setEditTxId(null);
    setIsFormOpen(true);
  }, []);
  const handleOpenEditModal = useCallback((id: string) => {
    setEditTxId(id);
    setIsFormOpen(true);
  }, []);

  if (status === 'loading') return <FullPageLoading />;
  if (!user) return <AuthPage />;

  const activePage = (() => {
    if (activeTab === 'income') {
      return <IncomePage onOpenAddModal={() => handleOpenAddModal('income')} onEditTransaction={handleOpenEditModal} />;
    }
    if (activeTab === 'expense') {
      return <ExpensePage onOpenAddModal={() => handleOpenAddModal('expense')} onEditTransaction={handleOpenEditModal} />;
    }
    if (activeTab === 'reports') return <ReportsPage onEditTransaction={handleOpenEditModal} />;
    if (activeTab === 'settings') return <SettingsPage />;
    return <Dashboard onOpenAddModal={handleOpenAddModal} onEditTransaction={handleOpenEditModal} />;
  })();

  return (
    <div className="flex min-h-screen bg-zinc-100 font-sans text-zinc-950 dark:bg-black dark:text-zinc-100">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white focus:translate-y-0 dark:bg-white dark:text-zinc-950"
      >
        Lewati ke konten utama
      </a>
      <Sidebar onOpenAddModal={handleOpenAddModal} />

      <div className={`flex min-h-screen flex-1 flex-col pb-24 transition-[padding] duration-300 ease-in-out md:pb-0 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm dark:border-zinc-900 dark:bg-black/95 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-emerald-400 md:hidden dark:bg-zinc-900">
              <LucideIcon name="Wallet" size={15} />
            </div>
            <p className="truncate text-sm font-semibold tracking-tight">
              <span className="md:hidden">KelolaUang</span>
              <span className="hidden md:inline">{PAGE_TITLES[activeTab]}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="Buka pengaturan"
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              className={`flex size-11 items-center justify-center rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                activeTab === 'settings'
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                  : 'border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              <LucideIcon name="Settings" size={18} />
            </button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6" tabIndex={-1}>
          {hasLoadedInitial && dataError && (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              <span className="flex items-start gap-2">
                <LucideIcon name="AlertCircle" size={17} className="mt-0.5 shrink-0" />
                <span>{dataError}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-amber-50 hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
                >
                  <LucideIcon name="RefreshCw" size={14} />
                  Coba lagi
                </button>
                <button
                  type="button"
                  onClick={clearDataError}
                  aria-label="Tutup peringatan"
                  className="inline-flex min-h-9 items-center rounded-lg border border-amber-300 px-3 text-xs font-semibold hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-amber-800 dark:hover:bg-amber-900"
                >
                  Tutup
                </button>
              </span>
            </div>
          )}
          {!hasLoadedInitial && isLoadingData ? (
            <DashboardSkeleton />
          ) : !hasLoadedInitial && dataError ? (
            <DataErrorState message={dataError} onRetry={() => void reload()} />
          ) : (
            <div key={activeTab} className="animate-page-enter">
              {activePage}
            </div>
          )}
        </main>
      </div>

      <BottomNav onOpenAddModal={handleOpenAddModal} />
      <TransactionForm
        isOpen={isFormOpen}
        onClose={closeForm}
        editTxId={editTxId}
        defaultType={formDefaultType}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
