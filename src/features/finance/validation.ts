import type { TransactionDraft, UserProfileDraft } from '../../types';
import { MAX_MONEY_AMOUNT } from '../../shared/currency';
import { parseDateOnly } from '../../shared/date';
import type { Result } from '../../shared/result';
import { failure, success } from '../../shared/result';
import { getCategoriesForType } from './categories';

export const MAX_NAME_LENGTH = 120;
export const MAX_NOTES_LENGTH = 1_000;

export function validateTransactionDraft(draft: TransactionDraft): Result<TransactionDraft> {
  if (!Number.isSafeInteger(draft.amount) || draft.amount < 1 || draft.amount > MAX_MONEY_AMOUNT) {
    return failure('INVALID_AMOUNT', 'Nominal harus berupa rupiah bulat antara Rp1 dan Rp999 triliun.');
  }

  const date = parseDateOnly(draft.date);
  if (!date || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
    return failure('INVALID_DATE', 'Tanggal transaksi harus berada antara tahun 1900 dan 2100.');
  }

  if (!getCategoriesForType(draft.type).some((category) => category.value === draft.category)) {
    return failure('INVALID_CATEGORY', 'Kategori tidak sesuai dengan jenis transaksi.');
  }

  const notes = draft.notes.trim();
  if (notes.length > MAX_NOTES_LENGTH) {
    return failure('NOTES_TOO_LONG', `Catatan maksimal ${MAX_NOTES_LENGTH} karakter.`);
  }

  return success({ ...draft, notes });
}

export function validateUserProfileDraft(draft: UserProfileDraft): Result<UserProfileDraft> {
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > MAX_NAME_LENGTH) {
    return failure('INVALID_NAME', `Nama harus 1–${MAX_NAME_LENGTH} karakter.`);
  }

  if (
    !Number.isSafeInteger(draft.monthlyLimit) ||
    draft.monthlyLimit < 1 ||
    draft.monthlyLimit > MAX_MONEY_AMOUNT
  ) {
    return failure('INVALID_MONTHLY_LIMIT', 'Batas bulanan harus berupa rupiah bulat yang valid.');
  }

  return success({ name, monthlyLimit: draft.monthlyLimit });
}
