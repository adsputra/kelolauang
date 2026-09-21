import LucideIcon from './LucideIcon';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
  error?: string | null;
  destructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isBusy = false,
  error,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onCancel}
      closeDisabled={isBusy}
      panelClassName="max-w-sm"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{description}</p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="min-h-11 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ${
              destructive
                ? 'bg-rose-700 hover:bg-rose-800 focus-visible:outline-rose-700 dark:bg-rose-800 dark:hover:bg-rose-700'
                : 'bg-zinc-900 hover:bg-zinc-800 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
            }`}
          >
            {isBusy && <LucideIcon name="LoaderCircle" size={16} className="animate-spin" />}
            {isBusy ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
