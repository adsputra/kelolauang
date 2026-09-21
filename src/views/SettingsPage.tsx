import { useRef, useState, type FormEvent } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import LucideIcon from '../components/LucideIcon';
import { DEFAULT_MONTHLY_LIMIT } from '../features/finance/domain';
import { useFinanceData } from '../features/finance/FinanceDataContext';
import { MAX_NAME_LENGTH } from '../features/finance/validation';
import { formatCurrencyInput, formatRp, parseCurrencyInput } from '../shared/currency';

export default function SettingsPage() {
  const { userProfile, updateUserProfile, resetAllFinanceData } = useFinanceData();
  const [name, setName] = useState(userProfile.name);
  const [monthlyLimit, setMonthlyLimit] = useState(userProfile.monthlyLimit);
  const [displayLimit, setDisplayLimit] = useState(formatCurrencyInput(userProfile.monthlyLimit));
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const saveInFlight = useRef(false);
  const resetInFlight = useRef(false);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setIsSaving(true);
    setSaveStatus(null);

    const result = await updateUserProfile({ name, monthlyLimit });
    saveInFlight.current = false;
    setIsSaving(false);
    if (result.ok) {
      setName(result.data.name);
      setMonthlyLimit(result.data.monthlyLimit);
      setDisplayLimit(formatCurrencyInput(result.data.monthlyLimit));
      setSaveStatus('Pengaturan berhasil disimpan.');
    } else {
      setSaveStatus(result.error.message);
    }
  };

  const handleReset = async () => {
    if (resetInFlight.current) return;
    resetInFlight.current = true;
    setIsResetting(true);
    setResetError(null);
    const result = await resetAllFinanceData();
    resetInFlight.current = false;
    setIsResetting(false);

    if (!result.ok) {
      setResetError(result.error.message);
      return;
    }

    setShowResetDialog(false);
    setMonthlyLimit(DEFAULT_MONTHLY_LIMIT);
    setDisplayLimit(formatCurrencyInput(DEFAULT_MONTHLY_LIMIT));
    setSaveStatus('Semua transaksi dihapus dan batas bulanan dikembalikan ke nilai awal.');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <header className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Pengaturan</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Profil dan anggaran
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Atur nama yang tampil dan batas pengeluaran bulanan Anda.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-100">
          <LucideIcon name="User" size={17} className="text-zinc-500" />
          Profil pengguna
        </h2>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          <div>
            <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nama pengguna
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
            />
          </div>

          <div>
            <label htmlFor="monthly-limit" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Batas pengeluaran bulanan
            </label>
            <input
              id="monthly-limit"
              type="text"
              inputMode="numeric"
              value={displayLimit}
              onChange={(event) => {
                const value = parseCurrencyInput(event.target.value);
                setMonthlyLimit(value);
                setDisplayLimit(formatCurrencyInput(value));
              }}
              placeholder="Rp0"
              required
              aria-describedby="monthly-limit-help"
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
            />
            <p id="monthly-limit-help" className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Dasbor memberi peringatan saat pengeluaran bulan berjalan melewati batas ini.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isSaving && <LucideIcon name="LoaderCircle" size={16} className="animate-spin" />}
              {isSaving ? 'Menyimpan…' : 'Simpan pengaturan'}
            </button>
            {saveStatus && <p role="status" className="text-sm text-zinc-700 dark:text-zinc-200">{saveStatus}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-rose-200 bg-white p-5 sm:p-6 dark:border-rose-900 dark:bg-zinc-950">
        <h2 className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-300">
          <LucideIcon name="AlertTriangle" size={17} />
          Reset data keuangan
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Menghapus seluruh transaksi secara permanen dan mengembalikan batas bulanan ke {formatRp(DEFAULT_MONTHLY_LIMIT)}. Nama serta akun login tetap dipertahankan.
        </p>
        <button
          type="button"
          onClick={() => {
            setResetError(null);
            setShowResetDialog(true);
          }}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900"
        >
          <LucideIcon name="Trash2" size={16} />
          Reset semua data
        </button>
      </section>

      <ConfirmDialog
        isOpen={showResetDialog}
        title="Reset semua data keuangan?"
        description="Semua transaksi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan, tetapi akun dan nama profil Anda tidak ikut dihapus."
        confirmLabel="Ya, reset data"
        onConfirm={() => void handleReset()}
        onCancel={() => setShowResetDialog(false)}
        isBusy={isResetting}
        error={resetError}
        destructive
      />
    </div>
  );
}
