import type { Transaction } from '../../types';
import { toLocalDateInput } from '../../shared/date';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeSpreadsheetCell(value: unknown): string {
  const text = String(value ?? '');
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

function escapeCsvCell(value: unknown): string {
  return `"${sanitizeSpreadsheetCell(value).replace(/"/g, '""')}"`;
}

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const headers = ['ID Transaksi', 'Jenis', 'Nominal (IDR)', 'Tanggal', 'Kategori', 'Catatan'];
  const rows = transactions.map((transaction) => [
    transaction.id,
    transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    transaction.amount,
    transaction.date,
    transaction.category,
    transaction.notes,
  ]);

  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')}`;
}

export function getTransactionsCsvFilename(dateString = toLocalDateInput()): string {
  return `Laporan_Keuangan_KelolaUang_${dateString}.csv`;
}

export function downloadTransactionsCsv(transactions: Transaction[]): void {
  const blob = new Blob([buildTransactionsCsv(transactions)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = getTransactionsCsvFilename();
  link.click();
  URL.revokeObjectURL(url);
}

