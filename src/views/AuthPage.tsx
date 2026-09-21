import { useState, type FormEvent } from 'react';
import LucideIcon from '../components/LucideIcon';
import { useAuth } from '../features/auth/AuthContext';
import {
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateLoginInput,
  validateRegisterInput,
} from '../features/auth/authValidation';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (isLogin) {
      const validated = validateLoginInput(email, password);
      if (!validated.ok) {
        setError(validated.error.message);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const result = await login(validated.data.email, validated.data.password);
      setIsLoading(false);
      if (!result.ok) setError(result.error.message);
      return;
    }

    const validated = validateRegisterInput(name, email, password);
    if (!validated.ok) {
      setError(validated.error.message);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const result = await signup(validated.data.name, validated.data.email, validated.data.password);
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSuccess(result.data);
    setPassword('');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-emerald-400 dark:bg-zinc-900">
            <LucideIcon name="Wallet" size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">KelolaUang</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Catat pemasukan, kendalikan pengeluaran, dan pahami arus kas pribadi Anda.
          </p>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8" aria-label="Autentikasi">
          <div className="mb-6 grid grid-cols-2 border-b border-zinc-200 dark:border-zinc-800" role="group" aria-label="Pilih mode autentikasi">
            <button
              type="button"
              onClick={() => selectMode(true)}
              aria-pressed={isLogin}
              className={`min-h-11 border-b-2 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                isLogin
                  ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-100'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => selectMode(false)}
              aria-pressed={!isLogin}
              className={`min-h-11 border-b-2 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${
                !isLogin
                  ? 'border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-zinc-100'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white'
              }`}
            >
              Daftar baru
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <LucideIcon name="AlertCircle" size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <LucideIcon name="CheckCircle2" size={17} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nama lengkap
                </label>
                <div className="relative">
                  <LucideIcon name="User" size={17} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    maxLength={MAX_NAME_LENGTH}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Budi Santoso"
                    className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Alamat email
              </label>
              <div className="relative">
                <LucideIcon name="Mail" size={17} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Kata sandi
              </label>
              <div className="relative">
                <LucideIcon name="Lock" size={17} className="pointer-events-none absolute left-3 top-3.5 text-zinc-500" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
                  maxLength={isLogin ? undefined : MAX_PASSWORD_LENGTH}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isLogin ? 'Masukkan kata sandi' : `Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                  className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-12 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:text-zinc-300 dark:hover:text-white"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                >
                  <LucideIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              {isLoading && <LucideIcon name="LoaderCircle" size={17} className="animate-spin" />}
              {isLoading ? 'Memproses…' : isLogin ? 'Masuk sekarang' : 'Buat akun'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
