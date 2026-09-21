import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMonthlyCashFlow,
  calculateBudgetUsage,
  filterTransactions,
  getBudgetStatus,
  sumTransactions,
} from '../features/finance/domain';
import type { FilterState, Transaction } from '../types';

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 100_000,
    date: '2026-08-24',
    category: 'Belanja',
    notes: '',
    createdAt: '2026-08-24T01:00:00.000Z',
    updatedAt: '2026-08-24T01:00:00.000Z',
    ...overrides,
  };
}

const baseFilters: FilterState = {
  search: '',
  type: 'all',
  category: 'all',
  dateRange: 'all',
};

test('menjumlahkan transaksi sesuai jenis tanpa mengubah data', () => {
  const transactions = [
    transaction({ id: 'income', type: 'income', amount: 500_000, category: 'Gaji' }),
    transaction({ id: 'expense', amount: 125_000 }),
  ];

  assert.equal(sumTransactions(transactions, 'income'), 500_000);
  assert.equal(sumTransactions(transactions, 'expense'), 125_000);
  assert.equal(sumTransactions(transactions), 625_000);
  assert.equal(transactions[0]?.id, 'income');
});

test('rentang tujuh hari bersifat inklusif dan tepat tujuh tanggal kalender', () => {
  const transactions = [
    transaction({ id: 'today', date: '2026-08-24' }),
    transaction({ id: 'six-days', date: '2026-08-18' }),
    transaction({ id: 'seven-days', date: '2026-08-17' }),
  ];

  const filtered = filterTransactions(
    transactions,
    { ...baseFilters, dateRange: '7days' },
    new Date(2026, 7, 24),
  );

  assert.deepEqual(filtered.map((item) => item.id), ['today', 'six-days']);
});

test('filter menggabungkan pencarian, jenis, kategori, dan rentang khusus', () => {
  const transactions = [
    transaction({ id: 'match', type: 'income', category: 'Freelance', notes: 'Proyek situs', date: '2026-08-10' }),
    transaction({ id: 'wrong-type', notes: 'Proyek situs', date: '2026-08-10' }),
    transaction({ id: 'wrong-date', type: 'income', category: 'Freelance', notes: 'Proyek situs', date: '2026-07-10' }),
  ];

  const filtered = filterTransactions(transactions, {
    search: 'SITUS',
    type: 'income',
    category: 'Freelance',
    dateRange: 'custom',
    customStartDate: '2026-08-01',
    customEndDate: '2026-08-31',
  });

  assert.deepEqual(filtered.map((item) => item.id), ['match']);
});

test('arus kas bulanan menangani pergantian tahun', () => {
  const transactions = [
    transaction({ id: 'dec', type: 'income', category: 'Gaji', amount: 2_000, date: '2025-12-31' }),
    transaction({ id: 'jan', amount: 1_000, date: '2026-01-01' }),
  ];
  const flow = buildMonthlyCashFlow(transactions, 2, new Date(2026, 0, 15));

  assert.deepEqual(flow.map(({ income, expense }) => ({ income, expense })), [
    { income: 2_000, expense: 0 },
    { income: 0, expense: 1_000 },
  ]);
});

test('persentase budget selalu berada di antara nol dan seratus', () => {
  assert.equal(calculateBudgetUsage(250, 1_000), 25);
  assert.equal(calculateBudgetUsage(2_000, 1_000), 100);
  assert.equal(calculateBudgetUsage(100, 0), 0);
  assert.equal(calculateBudgetUsage(0, 1_000), 0);
  assert.equal(calculateBudgetUsage(22_000, 5_000_000), 0.4);
  assert.equal(calculateBudgetUsage(1_000, 10_000_000), 0.1);
});

test('status anggaran membedakan kondisi aman, peringatan, dan terlampaui', () => {
  assert.deepEqual(getBudgetStatus(500, 1_000), {
    percent: 50,
    isOverBudget: false,
    tone: 'safe',
  });
  assert.deepEqual(getBudgetStatus(800, 1_000), {
    percent: 80,
    isOverBudget: false,
    tone: 'safe',
  });
  assert.deepEqual(getBudgetStatus(900, 1_000), {
    percent: 90,
    isOverBudget: false,
    tone: 'warning',
  });
  assert.deepEqual(getBudgetStatus(1_000, 1_000), {
    percent: 100,
    isOverBudget: false,
    tone: 'warning',
  });
  assert.deepEqual(getBudgetStatus(1_500, 1_000), {
    percent: 100,
    isOverBudget: true,
    tone: 'danger',
  });
  assert.deepEqual(getBudgetStatus(0, 0), {
    percent: 0,
    isOverBudget: false,
    tone: 'safe',
  });
});
