export type TransactionType = 'income' | 'expense';

export interface TransactionDraft {
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  notes: string;
}

export interface Transaction extends TransactionDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  monthlyLimit: number;
  updatedAt: string;
}

export interface UserProfileDraft {
  name: string;
  monthlyLimit: number;
}

export interface MonthlyCashFlowItem {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface ExpenseCategoryTotal {
  category: string;
  amount: number;
}

export interface FinanceOverview {
  asOfDate: string;
  totalIncome: number;
  totalExpense: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  monthlyCashFlow: MonthlyCashFlowItem[];
  expenseByCategory: ExpenseCategoryTotal[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface CategoryOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export type ActiveTab = 'dashboard' | 'income' | 'expense' | 'reports' | 'settings';

export type DateRange = 'all' | 'today' | '7days' | 'month' | 'custom';

export interface FilterState {
  search: string;
  type: 'all' | TransactionType;
  category: string;
  dateRange: DateRange;
  customStartDate?: string;
  customEndDate?: string;
}
