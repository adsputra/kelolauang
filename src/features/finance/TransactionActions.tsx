import { useState } from 'react';
import type { Transaction } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import LucideIcon from '../../components/LucideIcon';
import { useFinanceData } from './FinanceDataContext';

interface TransactionActionsProps {
  transaction: Transaction;
  onEdit: (id: string) => void;
}

export default function TransactionActions({ transaction, onEdit }: TransactionActionsProps) {
  const { deleteTransaction } = useFinanceData();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);
    const result = await deleteTransaction(transaction);
    setIsDeleting(false);
    if (result.ok) {
      setIsConfirmOpen(false);
    } else {
      setError(result.error.message);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(transaction.id)}
          className="flex size-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={`Edit transaksi ${transaction.category}`}
        >
          <LucideIcon name="Pencil" size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="flex size-11 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:text-rose-300 dark:hover:bg-rose-950"
          aria-label={`Hapus transaksi ${transaction.category}`}
        >
          <LucideIcon name="Trash2" size={14} />
        </button>
      </div>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Hapus transaksi?"
        description={`Transaksi ${transaction.category} sebesar Rp${transaction.amount.toLocaleString('id-ID')} akan dihapus permanen.`}
        confirmLabel="Hapus transaksi"
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setError(null);
            setIsConfirmOpen(false);
          }
        }}
        isBusy={isDeleting}
        error={error}
        destructive
      />
    </>
  );
}
