import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTransactionsCsv,
  getTransactionsCsvFilename,
  sanitizeSpreadsheetCell,
} from '../features/reports/csv';
import type { Transaction } from '../types';

test('sel formula spreadsheet dinetralisasi', () => {
  assert.equal(sanitizeSpreadsheetCell('=HYPERLINK("https://example.com")'), "'=HYPERLINK(\"https://example.com\")");
  assert.equal(sanitizeSpreadsheetCell('+100'), "'+100");
  assert.equal(sanitizeSpreadsheetCell('catatan biasa'), 'catatan biasa');
});

test('CSV memakai BOM, CRLF, dan escape tanda kutip', () => {
  const transaction: Transaction = {
    id: 'tx-1',
    type: 'income',
    amount: 100_000,
    date: '2026-08-24',
    category: 'Freelance',
    notes: '=SUM(1,2) "uji"',
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
  };
  const csv = buildTransactionsCsv([transaction]);

  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.equal(csv.includes('\r\n'), true);
  assert.equal(csv.includes("'=SUM(1,2) \"\"uji\"\""), true);
});

test('nama file CSV menyertakan tanggal lokal berformat YYYY-MM-DD', () => {
  const filename = getTransactionsCsvFilename('2026-09-05');
  assert.equal(filename, 'Laporan_Keuangan_KelolaUang_2026-09-05.csv');
  const defaultFilename = getTransactionsCsvFilename();
  assert.match(defaultFilename, /^Laporan_Keuangan_KelolaUang_\d{4}-\d{2}-\d{2}\.csv$/);
});

