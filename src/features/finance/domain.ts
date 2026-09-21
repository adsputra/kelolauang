import type { FilterState, Transaction, TransactionType } from '../../types';
import { getPastCalendarMonths, parseDateOnly, startOfLastSevenDays, startOfToday } from '../../shared/date';

export const DEFAULT_MONTHLY_LIMIT = 5_000_000;

export function sumTransactions(transactions: Transaction[], type?: TransactionType): number {
  return transactions.reduce(
    (total, transaction) => total + (!type || transaction.type === type ? transaction.amount : 0),
    0,
  );
}

export function sortTransactionsNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    const dateComparison = right.date.localeCompare(left.date);
    return dateComparison || right.createdAt.localeCompare(left.createdAt);
  });
}

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterState,
  today = startOfToday(),
): Transaction[] {
  const normalizedSearch = filters.search.trim().toLocaleLowerCase('id-ID');
  const sevenDayStart = startOfLastSevenDays(today);
  const customStart = filters.customStartDate ? parseDateOnly(filters.customStartDate) : null;
  const customEnd = filters.customEndDate ? parseDateOnly(filters.customEndDate) : null;

  return sortTransactionsNewestFirst(transactions).filter((transaction) => {
    const searchMatches =
      !normalizedSearch ||
      transaction.notes.toLocaleLowerCase('id-ID').includes(normalizedSearch) ||
      transaction.category.toLocaleLowerCase('id-ID').includes(normalizedSearch);
    const typeMatches = filters.type === 'all' || transaction.type === filters.type;
    const categoryMatches = filters.category === 'all' || transaction.category === filters.category;
    const transactionDate = parseDateOnly(transaction.date);

    if (!searchMatches || !typeMatches || !categoryMatches || !transactionDate) return false;

    if (filters.dateRange === 'today') {
      return transactionDate.getTime() === today.getTime();
    }
    if (filters.dateRange === '7days') {
      return transactionDate >= sevenDayStart && transactionDate <= today;
    }
    if (filters.dateRange === 'month') {
      return (
        transactionDate.getFullYear() === today.getFullYear() &&
        transactionDate.getMonth() === today.getMonth()
      );
    }
    if (filters.dateRange === 'custom') {
      return (!customStart || transactionDate >= customStart) && (!customEnd || transactionDate <= customEnd);
    }
    return true;
  });
}

export function buildMonthlyCashFlow(transactions: Transaction[], count = 5, now = new Date()) {
  return getPastCalendarMonths(count, now).map((month) => {
    const monthTransactions = transactions.filter((transaction) => {
      const date = parseDateOnly(transaction.date);
      return date?.getFullYear() === month.year && date.getMonth() === month.month;
    });

    return {
      label: month.label,
      income: sumTransactions(monthTransactions, 'income'),
      expense: sumTransactions(monthTransactions, 'expense'),
    };
  });
}

export function calculateBudgetUsage(expenses: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(expenses) || expenses <= 0) return 0;
  const raw = (expenses / limit) * 100;
  if (raw >= 100) return 100;
  return raw < 10 ? Math.max(0.1, Math.round(raw * 10) / 10) : Math.round(raw);
}

export interface BudgetStatus {
  percent: number;
  isOverBudget: boolean;
  tone: 'safe' | 'warning' | 'danger';
}

export function getBudgetStatus(expenses: number, limit: number): BudgetStatus {
  const percent = calculateBudgetUsage(expenses, limit);
  const isOverBudget = Number.isFinite(limit) && limit > 0 && expenses > limit;
  return {
    percent,
    isOverBudget,
    tone: isOverBudget ? 'danger' : percent > 80 ? 'warning' : 'safe',
  };
}
