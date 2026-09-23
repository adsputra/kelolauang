# KelolaUang

Aplikasi web untuk mencatat dan memantau keuangan pribadi: pemasukan, pengeluaran, batas anggaran bulanan, dan laporan.

## Fitur

- Catat pemasukan dan pengeluaran lengkap dengan kategori, tanggal, dan catatan.
- Ringkasan keuangan: total saldo, arus kas 5 bulan terakhir, dan pengeluaran per kategori.
- Batas anggaran bulanan dengan indikator aman, waspada, dan terlampaui.
- Laporan: pencarian, filter jenis/kategori/rentang tanggal, dan ekspor CSV.
- Akun email: daftar, konfirmasi email, masuk/keluar, dan ubah profil.
- Setiap akun hanya bisa melihat dan mengubah datanya sendiri (Row Level Security).

## Teknologi

Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase (Auth + Postgres), dan Playwright untuk pengujian UI.

## Menjalankan di lokal

Prasyarat: Node.js 20+ dan sebuah project Supabase.

1. Salin `.env.example` menjadi `.env.local`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Jalankan `npm install`.
3. Terapkan semua file di `supabase/migrations/` secara berurutan melalui Supabase CLI atau SQL Editor.
4. Jalankan `npm run dev`, lalu buka http://localhost:3000.

Aplikasi ini hanya memakai anon key; akses data dibatasi Row Level Security. Jangan pernah menaruh service-role key di aplikasi atau browser.

## Konfigurasi Supabase

Di dashboard Supabase:

- Aktifkan login email dan konfirmasi email.
- Daftarkan `https://<domain-anda>/api/auth/callback` di **Authentication → URL Configuration → Redirect URLs** agar link konfirmasi kembali ke aplikasi.
- Untuk produksi, gunakan SMTP kustom karena email bawaan Supabase memiliki batas pengiriman.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi |
| `npm run build` / `npm start` | Build dan menjalankan versi produksi |
| `npm run check` | Lint, typecheck, unit test, dan build |
| `npm test` | Unit test |
| `npm run test:integration` | Uji isolasi data antar-akun (butuh Supabase staging) |
| `npm run test:e2e` | Uji alur UI dengan Playwright |

Untuk test integration/e2e, siapkan `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, dan `SUPABASE_TEST_SERVICE_ROLE_KEY` dari project staging — jangan arahkan ke production.

## Deploy

1. Set `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di hosting (mis. Vercel).
2. Terapkan semua migrasi ke project Supabase target.
3. Pastikan `GET /api/health` mengembalikan 200 setelah deploy.

CI di `.github/workflows/ci.yml` menjalankan `npm run check` dan `npm audit` pada setiap push dan pull request.
