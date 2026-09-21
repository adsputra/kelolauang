import type { CategoryOption, TransactionType } from '../../types';

export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: 'Gaji', label: 'Gaji', icon: 'Briefcase', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { value: 'Freelance', label: 'Freelance', icon: 'Laptop', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' },
  { value: 'Investasi', label: 'Investasi', icon: 'TrendingUp', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  { value: 'Penjualan', label: 'Penjualan', icon: 'ShoppingBag', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  { value: 'Lainnya', label: 'Lainnya', icon: 'PlusCircle', color: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700' },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'Makanan & Minuman', label: 'Makanan & Minuman', icon: 'Utensils', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  { value: 'Transportasi', label: 'Transportasi', icon: 'Car', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  { value: 'Belanja', label: 'Belanja', icon: 'ShoppingBag', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800' },
  { value: 'Tagihan & Utilitas', label: 'Tagihan & Utilitas', icon: 'Receipt', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { value: 'Hiburan & Rekreasi', label: 'Hiburan & Rekreasi', icon: 'Gamepad2', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  { value: 'Kesehatan', label: 'Kesehatan', icon: 'HeartPulse', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
  { value: 'Pendidikan', label: 'Pendidikan', icon: 'GraduationCap', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' },
  { value: 'Investasi', label: 'Investasi', icon: 'TrendingUp', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  { value: 'Lainnya', label: 'Lainnya', icon: 'PlusCircle', color: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].filter(
  (category, index, categories) =>
    categories.findIndex((candidate) => candidate.value === category.value) === index,
);

export function getCategoriesForType(type: TransactionType): CategoryOption[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function getCategoryDetails(value: string): CategoryOption {
  return ALL_CATEGORIES.find((category) => category.value === value) ?? {
    value,
    label: value,
    icon: 'PlusCircle',
    color: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700',
  };
}
