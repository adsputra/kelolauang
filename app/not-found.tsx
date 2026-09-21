import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="text-2xl font-black tracking-tight">404</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tautan yang Anda tuju mungkin salah, telah dipindahkan, atau tidak lagi tersedia.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
