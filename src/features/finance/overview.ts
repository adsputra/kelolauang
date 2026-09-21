import { getPastCalendarMonths, parseDateOnly } from '../../shared/date';
import { failure, success } from '../../shared/result';
import type { Result } from '../../shared/result';
import type {
  ExpenseCategoryTotal,
  FinanceOverview,
  MonthlyCashFlowItem,
  Transaction,
} from '../../types';

function parseSafeMoney(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

function formatMonthLabel(month: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(
    new Date(year, monthIndex, 1),
  );
}

function parseMonthlyCashFlow(value: unknown): MonthlyCashFlowItem[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;

  const items: MonthlyCashFlowItem[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null;
    const row = candidate as Record<string, unknown>;
    const month = typeof row.month === 'string' ? row.month : '';
    const label = formatMonthLabel(month);
    const income = parseSafeMoney(row.income);
    const expense = parseSafeMoney(row.expense);
    if (!label || income === null || expense === null) return null;
    items.push({ month, label, income, expense });
  }
  return items;
}

function parseExpenseCategories(value: unknown): ExpenseCategoryTotal[] | null {
  if (!Array.isArray(value)) return null;

  const items: ExpenseCategoryTotal[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null;
    const row = candidate as Record<string, unknown>;
    const amount = parseSafeMoney(row.amount);
    if (typeof row.category !== 'string' || !row.category || amount === null) return null;
    items.push({ category: row.category, amount });
  }
  return items;
}

export function parseFinanceOverview(value: unknown): Result<FinanceOverview> {
  if (!value || typeof value !== 'object') {
    return failure('INVALID_OVERVIEW', 'Ringkasan keuangan dari server tidak valid.');
  }

  const payload = value as Record<string, unknown>;
  const totalIncome = parseSafeMoney(payload.totalIncome);
  const totalExpense = parseSafeMoney(payload.totalExpense);
  const currentMonthIncome = parseSafeMoney(payload.currentMonthIncome);
  const currentMonthExpense = parseSafeMoney(payload.currentMonthExpense);
  const monthlyCashFlow = parseMonthlyCashFlow(payload.monthlyCashFlow);
  const expenseByCategory = parseExpenseCategories(payload.expenseByCategory);

  if (
    typeof payload.asOfDate !== 'string' ||
    !parseDateOnly(payload.asOfDate) ||
    totalIncome === null ||
    totalExpense === null ||
    currentMonthIncome === null ||
    currentMonthExpense === null ||
    !monthlyCashFlow ||
    !expenseByCategory
  ) {
    return failure('INVALID_OVERVIEW', 'Ringkasan keuangan dari server tidak valid.');
  }

  return success({
    asOfDate: payload.asOfDate,
    totalIncome,
    totalExpense,
    currentMonthIncome,
    currentMonthExpense,
    monthlyCashFlow,
    expenseByCategory,
  });
}

export function createEmptyFinanceOverview(asOfDate: string): FinanceOverview {
  const parsedDate = parseDateOnly(asOfDate) ?? new Date();
  const monthlyCashFlow = getPastCalendarMonths(5, parsedDate).map(({ year, month, label }) => ({
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    label,
    income: 0,
    expense: 0,
  }));

  return {
    asOfDate,
    totalIncome: 0,
    totalExpense: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    monthlyCashFlow,
    expenseByCategory: [],
  };
}

export function buildOverviewFromTransactions(
  transactions: Transaction[],
  asOfDate: string,
): FinanceOverview {
  const currentMonth = asOfDate.slice(0, 7);
  const empty = createEmptyFinanceOverview(asOfDate);

  let totalIncome = 0;
  let totalExpense = 0;
  let currentMonthIncome = 0;
  let currentMonthExpense = 0;
  const categoryMap = new Map<string, number>();

  for (const tx of transactions) {
    const isCurrent = tx.date.startsWith(currentMonth);
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (isCurrent) currentMonthIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (isCurrent) {
        currentMonthExpense += tx.amount;
        categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + tx.amount);
      }
    }

    const txMonth = tx.date.slice(0, 7);
    const flowItem = empty.monthlyCashFlow.find((m) => m.month === txMonth);
    if (flowItem) {
      flowItem[tx.type] += tx.amount;
    }
  }

  const expenseByCategory: ExpenseCategoryTotal[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category, 'id-ID'));

  return {
    asOfDate,
    totalIncome,
    totalExpense,
    currentMonthIncome,
    currentMonthExpense,
    monthlyCashFlow: empty.monthlyCashFlow,
    expenseByCategory,
  };
}


export function applyTransactionChangeToOverview(
  overview: FinanceOverview,
  previousTransaction: Transaction | null,
  nextTransaction: Transaction | null,
): FinanceOverview {
  const nextOverview: FinanceOverview = {
    ...overview,
    monthlyCashFlow: overview.monthlyCashFlow.map((item) => ({ ...item })),
    expenseByCategory: overview.expenseByCategory.map((item) => ({ ...item })),
  };
  const currentMonth = overview.asOfDate.slice(0, 7);

  const applyDelta = (transaction: Transaction, direction: 1 | -1) => {
    const amountDelta = transaction.amount * direction;
    const isCurrentMonth = transaction.date.startsWith(currentMonth);

    if (transaction.type === 'income') {
      nextOverview.totalIncome += amountDelta;
      if (isCurrentMonth) nextOverview.currentMonthIncome += amountDelta;
    } else {
      nextOverview.totalExpense += amountDelta;
      if (isCurrentMonth) nextOverview.currentMonthExpense += amountDelta;

      if (isCurrentMonth) {
        const category = nextOverview.expenseByCategory.find(
          (item) => item.category === transaction.category,
        );
        if (category) category.amount += amountDelta;
        else nextOverview.expenseByCategory.push({ category: transaction.category, amount: amountDelta });
      }
    }

    const monthlyItem = nextOverview.monthlyCashFlow.find(
      (item) => item.month === transaction.date.slice(0, 7),
    );
    if (monthlyItem) monthlyItem[transaction.type] += amountDelta;
  };

  if (previousTransaction) applyDelta(previousTransaction, -1);
  if (nextTransaction) applyDelta(nextTransaction, 1);

  nextOverview.totalIncome = Math.max(0, nextOverview.totalIncome);
  nextOverview.totalExpense = Math.max(0, nextOverview.totalExpense);
  nextOverview.currentMonthIncome = Math.max(0, nextOverview.currentMonthIncome);
  nextOverview.currentMonthExpense = Math.max(0, nextOverview.currentMonthExpense);
  nextOverview.monthlyCashFlow = nextOverview.monthlyCashFlow.map((item) => ({
    ...item,
    income: Math.max(0, item.income),
    expense: Math.max(0, item.expense),
  }));
  nextOverview.expenseByCategory = nextOverview.expenseByCategory
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount || left.category.localeCompare(right.category, 'id-ID'));

  return nextOverview;
}
