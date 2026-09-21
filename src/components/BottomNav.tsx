import { useUi } from '../features/ui/UiContext';
import { NAV_ITEMS } from '../features/ui/navigation';
import type { TransactionType } from '../types';
import LucideIcon from './LucideIcon';

interface BottomNavProps {
  onOpenAddModal: (type: TransactionType) => void;
}

export default function BottomNav({ onOpenAddModal }: BottomNavProps) {
  const { activeTab, setActiveTab } = useUi();
  const visibleItems = NAV_ITEMS.filter((item) => item.id !== 'settings');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Navigasi utama"
    >
      <div className="relative grid h-16 grid-cols-5 items-center px-2">
        {visibleItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className="flex min-h-12 flex-col items-center justify-center rounded-lg text-center transition-transform duration-100 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
          >
            <LucideIcon
              name={item.icon}
              className={activeTab === item.id ? 'text-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}
              size={19}
            />
            <span className={`mt-1 text-xs ${activeTab === item.id ? 'font-semibold text-zinc-950 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
              {item.shortLabel}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onOpenAddModal(activeTab === 'income' ? 'income' : 'expense')}
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-950 text-white shadow-md transition-all duration-150 hover:scale-105 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 dark:bg-zinc-100 dark:text-zinc-950"
          aria-label={activeTab === 'income' ? 'Tambah pemasukan' : 'Tambah pengeluaran'}
        >
          <LucideIcon name="Plus" size={24} />
        </button>

        {visibleItems.slice(2).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className="flex min-h-12 flex-col items-center justify-center rounded-lg text-center transition-transform duration-100 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
          >
            <LucideIcon
              name={item.icon}
              className={activeTab === item.id ? 'text-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}
              size={19}
            />
            <span className={`mt-1 text-xs ${activeTab === item.id ? 'font-semibold text-zinc-950 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
              {item.shortLabel}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
