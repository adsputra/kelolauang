import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyTransactionChangeToOverview,
  buildOverviewFromTransactions,
  createEmptyFinanceOverview,
  parseFinanceOverview,
} from '../features/finance/overview';
import type { Transaction } from '../types';

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 100_000,
    date: '2026-09-04',
    category: 'Belanja',
    notes: '',
    createdAt: '2026-09-04T01:00:00.000Z',
    updatedAt: '2026-09-04T01:00:00.000Z',
    ...overrides,
  };
}

test('parser ringkasan menerima kontrak RPC dan mengubah nominal menjadi angka aman', () => {
  const result = parseFinanceOverview({
    asOfDate: '2026-09-04',
    totalIncome: '500000',
    totalExpense: '100000',
    currentMonthIncome: '500000',
    currentMonthExpense: '100000',
    monthlyCashFlow: [
      { month: '2026-05', income: '0', expense: '0' },
      { month: '2026-06', income: '0', expense: '0' },
      { month: '2026-07', income: '0', expense: '0' },
      { month: '2026-08', income: '0', expense: '0' },
      { month: '2026-09', income: '500000', expense: '100000' },
    ],
    expenseByCategory: [{ category: 'Belanja', amount: '100000' }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.totalIncome, 500_000);
  assert.equal(result.data.monthlyCashFlow[4]?.expense, 100_000);
  assert.deepEqual(result.data.expenseByCategory, [{ category: 'Belanja', amount: 100_000 }]);
});

test('parser ringkasan menolak payload rusak dan nominal di luar safe integer', () => {
  const invalid = parseFinanceOverview({ totalIncome: 'not-money' });
  const unsafe = parseFinanceOverview({
    asOfDate: '2026-09-04',
    totalIncome: '999999999999999999999',
    totalExpense: '0',
    currentMonthIncome: '0',
    currentMonthExpense: '0',
    monthlyCashFlow: [],
    expenseByCategory: [],
  });

  assert.equal(invalid.ok, false);
  assert.equal(unsafe.ok, false);
});

test('perubahan transaksi memperbarui total, bulan, grafik, dan kategori tanpa mutasi', () => {
  const initial = createEmptyFinanceOverview('2026-09-04');
  const income = transaction({ id: 'income', type: 'income', category: 'Gaji', amount: 500_000 });
  const expense = transaction({ id: 'expense', amount: 125_000 });

  const afterIncome = applyTransactionChangeToOverview(initial, null, income);
  const afterExpense = applyTransactionChangeToOverview(afterIncome, null, expense);

  assert.equal(initial.totalIncome, 0);
  assert.equal(afterExpense.totalIncome, 500_000);
  assert.equal(afterExpense.totalExpense, 125_000);
  assert.equal(afterExpense.currentMonthIncome, 500_000);
  assert.equal(afterExpense.currentMonthExpense, 125_000);
  assert.equal(afterExpense.monthlyCashFlow.at(-1)?.income, 500_000);
  assert.deepEqual(afterExpense.expenseByCategory, [{ category: 'Belanja', amount: 125_000 }]);
});

test('edit lintas bulan dan tipe memindahkan agregat ke bucket yang benar', () => {
  const initial = applyTransactionChangeToOverview(
    createEmptyFinanceOverview('2026-09-04'),
    null,
    transaction({ date: '2026-08-31', amount: 200_000 }),
  );
  const previous = transaction({ date: '2026-08-31', amount: 200_000 });
  const next = transaction({ type: 'income', category: 'Gaji', date: '2026-09-01', amount: 350_000 });
  const updated = applyTransactionChangeToOverview(initial, previous, next);

  assert.equal(updated.totalExpense, 0);
  assert.equal(updated.totalIncome, 350_000);
  assert.equal(updated.currentMonthIncome, 350_000);
  assert.equal(updated.monthlyCashFlow.find((item) => item.month === '2026-08')?.expense, 0);
  assert.equal(updated.monthlyCashFlow.find((item) => item.month === '2026-09')?.income, 350_000);
});

test('buildOverviewFromTransactions menghitung ringkasan dengan benar dari data transaksi', () => {
  const txList = [
    transaction({ id: 't1', type: 'income', amount: 5_000_000, date: '2026-09-01', category: 'Gaji' }),
    transaction({ id: 't2', type: 'expense', amount: 150_000, date: '2026-09-02', category: 'Makanan & Minuman' }),
    transaction({ id: 't3', type: 'expense', amount: 300_000, date: '2026-08-15', category: 'Transportasi' }),
  ];

  const overview = buildOverviewFromTransactions(txList, '2026-09-05');
  assert.equal(overview.totalIncome, 5_000_000);
  assert.equal(overview.totalExpense, 450_000);
  assert.equal(overview.currentMonthIncome, 5_000_000);
  assert.equal(overview.currentMonthExpense, 150_000);
  assert.equal(overview.expenseByCategory.length, 1);
  assert.equal(overview.expenseByCategory[0].category, 'Makanan & Minuman');
  assert.equal(overview.expenseByCategory[0].amount, 150_000);
});

