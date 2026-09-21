import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  validateTransactionDraft,
  validateUserProfileDraft,
} from '../features/finance/validation';
import { MAX_MONEY_AMOUNT } from '../shared/currency';

test('validasi transaksi menerima input bersih dan memangkas catatan', () => {
  const result = validateTransactionDraft({
    type: 'expense',
    amount: 50_000,
    date: '2026-08-24',
    category: 'Makanan & Minuman',
    notes: '  makan siang  ',
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.notes, 'makan siang');
});

test('validasi transaksi menolak nominal pecahan, tanggal palsu, dan kategori silang', () => {
  assert.equal(validateTransactionDraft({ type: 'income', amount: 1.5, date: '2026-08-24', category: 'Gaji', notes: '' }).ok, false);
  assert.equal(validateTransactionDraft({ type: 'income', amount: 1, date: '2026-02-30', category: 'Gaji', notes: '' }).ok, false);
  assert.equal(validateTransactionDraft({ type: 'income', amount: 1, date: '2026-08-24', category: 'Belanja', notes: '' }).ok, false);
});

test('validasi profil merapikan spasi dan menolak batas nol', () => {
  const valid = validateUserProfileDraft({ name: '  Adi   Saputra  ', monthlyLimit: 5_000_000 });
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.data.name, 'Adi Saputra');

  assert.equal(validateUserProfileDraft({ name: 'Adi', monthlyLimit: 0 }).ok, false);
});

test('validasi transaksi menolak nominal di atas batas dan catatan melebihi batas', () => {
  assert.equal(
    validateTransactionDraft({
      type: 'expense',
      amount: MAX_MONEY_AMOUNT + 1,
      date: '2026-08-24',
      category: 'Belanja',
      notes: '',
    }).ok,
    false,
  );
  assert.equal(
    validateTransactionDraft({
      type: 'expense',
      amount: 10_000,
      date: '2026-08-24',
      category: 'Belanja',
      notes: 'a'.repeat(MAX_NOTES_LENGTH + 1),
    }).ok,
    false,
  );
});

test('validasi profil menolak nama terlalu panjang dan batas di atas nominal maksimum', () => {
  assert.equal(
    validateUserProfileDraft({ name: 'A'.repeat(MAX_NAME_LENGTH + 1), monthlyLimit: 1 }).ok,
    false,
  );
  assert.equal(
    validateUserProfileDraft({ name: 'Adi', monthlyLimit: MAX_MONEY_AMOUNT + 1 }).ok,
    false,
  );
});
