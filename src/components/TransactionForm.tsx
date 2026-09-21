import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { getCategoriesForType } from '../features/finance/categories';
import { MAX_NOTES_LENGTH, validateTransactionDraft } from '../features/finance/validation';
import { formatCurrencyInput, parseCurrencyInput } from '../shared/currency';
import { toLocalDateInput } from '../shared/date';
import { createIdempotencyKey } from '../shared/idempotency';
import type { Transaction, TransactionDraft, TransactionType } from '../types';
import LucideIcon from './LucideIcon';
import Modal from './Modal';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTxId?: string | null;
  defaultType?: TransactionType;
}

export default function TransactionForm({
  isOpen,
  onClose,
  editTxId,
  defaultType = 'expense',
}: TransactionFormProps) {
  const { transactions } = useFinanceData();
  if (!isOpen) return null;

  const editingTransaction = transactions.find((transaction) => transaction.id === editTxId) ?? null;
  return (
    <TransactionFormContent
      key={editTxId ?? `new-${defaultType}`}
      onClose={onClose}
      editTxId={editTxId}
      defaultType={defaultType}
      editingTransaction={editingTransaction}
    />
  );
}

interface TransactionFormContentProps {
  onClose: () => void;
  editTxId?: string | null;
  defaultType: TransactionType;
  editingTransaction: Transaction | null;
}

function TransactionFormContent({
  onClose,
  editTxId,
  defaultType,
  editingTransaction,
}: TransactionFormContentProps) {
  const { addTransaction, editTransaction } = useFinanceData();
  const initialType = editingTransaction?.type ?? defaultType;
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(editingTransaction?.amount ?? 0);
  const [displayAmount, setDisplayAmount] = useState(
    editingTransaction ? formatCurrencyInput(editingTransaction.amount) : '',
  );
  const [date, setDate] = useState(editingTransaction?.date ?? toLocalDateInput());
  const [category, setCategory] = useState(
    editingTransaction?.category ?? getCategoriesForType(initialType)[0]?.value ?? '',
  );
  const [notes, setNotes] = useState(editingTransaction?.notes ?? '');
  const [error, setError] = useState<string | null>(
    editTxId && !editingTransaction ? 'Transaksi tidak ditemukan atau sudah dihapus.' : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeCategories = getCategoriesForType(type);
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);

  // Kunci stabil selama draft tidak berubah, sehingga pengiriman ulang setelah
  // timeout tidak membuat transaksi ganda.
  const getIdempotencyKey = (draft: TransactionDraft): string => {
    const signature = [draft.type, draft.amount, draft.date, draft.category, draft.notes].join('\u0000');
    if (!idempotencyRef.current || idempotencyRef.current.signature !== signature) {
      idempotencyRef.current = { signature, key: createIdempotencyKey() };
    }
    return idempotencyRef.current.key;
  };

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(getCategoriesForType(nextType)[0]?.value ?? '');
    setError(null);
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsedAmount = parseCurrencyInput(event.target.value);
    setAmount(parsedAmount);
    setDisplayAmount(formatCurrencyInput(parsedAmount));
    if (error) setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const draft = { type, amount, date, category, notes };
    const validated = validateTransactionDraft(draft);
    if (!validated.ok) {
      setError(validated.error.message);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = editingTransaction
      ? await editTransaction(editingTransaction, validated.data)
      : await addTransaction(validated.data, getIdempotencyKey(validated.data));
    setIsSubmitting(false);

    if (result.ok) onClose();
    else setError(result.error.message);
  };

  const modalTitle = editingTransaction
    ? 'Edit transaksi'
    : `Tambah ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`;

  return (
    <Modal
      isOpen
      title={modalTitle}
      description="Isi nominal, tanggal, kategori, dan catatan transaksi."
      onClose={onClose}
      closeDisabled={isSubmitting}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{modalTitle}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex size-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Tutup formulir transaksi"
        >
          <LucideIcon name="X" size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!editingTransaction && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Jenis transaksi</legend>
              <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                {(['expense', 'income'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => changeType(option)}
                    aria-pressed={type === option}
                    className={`min-h-10 flex-1 rounded-md px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                      type === option
                        ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
                    }`}
                  >
                    {option === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="transaction-amount" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Jumlah nominal
            </label>
            <input
              id="transaction-amount"
              name="amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Rp0"
              value={displayAmount}
              onChange={handleAmountChange}
              aria-invalid={Boolean(error && amount < 1)}
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-xl font-bold text-zinc-950 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="transaction-date" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tanggal transaksi
            </label>
            <input
              id="transaction-date"
              name="date"
              type="date"
              value={date}
              min="1900-01-01"
              max="2100-12-31"
              onChange={(event) => setDate(event.target.value)}
              className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategori</legend>
            <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {activeCategories.map((option) => {
                const isSelected = category === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    aria-pressed={isSelected}
                    className={`min-h-13 rounded-lg border p-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                      isSelected
                        ? 'border-zinc-800 bg-zinc-100 font-semibold text-zinc-950 dark:border-zinc-500 dark:bg-zinc-800 dark:text-white'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <LucideIcon name={option.icon} size={15} className="mx-auto mb-1" />
                    <span className="block leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="transaction-notes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Catatan <span className="font-normal text-zinc-500">(opsional)</span>
              </label>
              <span className="text-xs text-zinc-500">{notes.length}/{MAX_NOTES_LENGTH}</span>
            </div>
            <textarea
              id="transaction-notes"
              name="notes"
              rows={2}
              placeholder="Contoh: makan siang bersama tim"
              value={notes}
              maxLength={MAX_NOTES_LENGTH}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-20 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <LucideIcon name="AlertCircle" size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !editingTransaction && Boolean(editTxId)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isSubmitting && <LucideIcon name="LoaderCircle" size={16} className="animate-spin" />}
            {isSubmitting ? 'Menyimpan…' : editingTransaction ? 'Simpan perubahan' : 'Catat transaksi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
