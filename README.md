# KelolaUang

KelolaUang adalah aplikasi pencatatan keuangan pribadi berbasis Next.js dan Supabase. Fitur utamanya meliputi autentikasi email, pemasukan dan pengeluaran, batas anggaran bulanan, filter laporan, serta ekspor CSV.

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru dan sebuah project Supabase.

1. Salin `.env.example` menjadi `.env.local`, lalu isi URL project dan anon key Supabase.
2. Jalankan `npm install`.
3. Terapkan file migrasi database berikut secara berurutan melalui Supabase CLI atau SQL Editor:
   - `supabase/migrations/202608240001_harden_finance_schema.sql` (tabel, RLS, constraint, trigger)
   - `supabase/migrations/202609040001_add_finance_overview.sql` (fungsi RPC get_finance_overview)
   - `supabase/migrations/202609090001_add_finance_performance_indexes.sql` (indeks performa query & agregasi)
   - `supabase/migrations/202609210001_add_transaction_idempotency.sql` (idempotency key transaksi)
4. Jalankan `npm run dev`.

Jangan gunakan service-role key di browser. Aplikasi ini hanya membutuhkan anon key; akses data dibatasi oleh Row Level Security.

## Arsitektur autentikasi dan data

Sesi autentikasi disimpan sebagai **cookie `httpOnly`, `Secure`, dan `SameSite=Lax`** yang dikelola server melalui `@supabase/ssr`. Token tidak pernah dapat dibaca JavaScript di browser (`localStorage` tidak lagi digunakan).

- `proxy.ts` menyegarkan token kedaluwarsa di latar belakang pada setiap request.
- Semua mutasi auth ditangani server: `POST /api/auth/{login,signup,logout}`, `PATCH /api/auth/profile`, dan callback konfirmasi email di `GET /api/auth/callback`.
- Seluruh akses data keuangan melewati route handler internal (`/api/finance/*`) yang memvalidasi sesi dan input di server, lalu memanggil Supabase dengan cookie sesi; browser tidak lagi memanggil PostgREST secara langsung.
- Setiap route memakai envelope response konsisten `{ data, error }`, memvalidasi payload, dan menolak request mutasi lintas origin (CSRF).

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Atau jalankan seluruh pemeriksaan dengan `npm run check`.

## Kesiapan produksi

Kontrol yang sudah diterapkan di kode:

- **Sesi aman**: cookie `httpOnly` + `Secure` + `SameSite=Lax`, token tidak tersimpan di `localStorage`, CSRF guard pada semua endpoint mutasi, dan proxy penyegar sesi.
- **Keamanan data**: Row Level Security + `FORCE RLS` dengan policy kepemilikan `auth.uid()` pada semua tabel; setiap endpoint memverifikasi sesi dan kepemilikan resource di server; integration test membuktikan isolasi profil, transaksi, RPC, dan reset antar-akun.
- **Validasi berlapis**: validasi di klien, ulang di route handler (`src/features/*/validation.ts`), dan constraint database (tipe, nominal, tanggal, kategori, panjang catatan) sebagai pertahanan ganda. Body JSON dibatasi 64 KB (`PAYLOAD_TOO_LARGE`, HTTP 413).
- **Integritas data**: kunci optimistik `updated_at` pada update/hapus transaksi dan profil untuk mencegah lost update; idempotency key (`Idempotency-Key`, unik per pengguna) mencegah transaksi ganda saat pengiriman ulang setelah timeout; semua agregasi dihitung di database melalui RPC.
- **Skalabilitas**: pagination 100 transaksi per halaman, indeks komposit untuk filter dan agregasi, ekspor CSV memuat seluruh halaman tanpa menimpa state yang sedang berubah.
- **Reliabilitas**: timeout 20 detik untuk seluruh request Supabase di server (`src/lib/supabase/fetch.ts`) dan timeout 25 detik untuk request browser (`src/lib/api/client.ts`), error boundary, banner kegagalan non-fatal dengan opsi coba lagi, fallback ringkasan bila RPC belum terpasang, dan logging terstruktur dengan redaksi field sensitif.
- **Header keamanan**: CSP ketat (`connect-src 'self'`), HSTS, X-Frame-Options, nosniff, COOP/CORP, dan Permissions-Policy diatur di `next.config.ts`.
- **Observabilitas**: `GET /api/health` memverifikasi koneksi Supabase (200 sehat, 503 degraded) dengan `Cache-Control: no-store`.

Checklist sebelum deploy:

1. Set `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada environment hosting (jangan gunakan service-role key di aplikasi).
2. Terapkan seluruh migrasi `supabase/migrations/*.sql` secara berurutan ke project Supabase target.
3. Di dashboard Supabase: aktifkan konfirmasi email, atur panjang minimum kata sandi, aktifkan rate limit endpoint auth, dan daftarkan `https://<domain-anda>/api/auth/callback` pada Redirect URLs.
4. Jalankan `npm run test:integration` dan `npm run test:e2e` terhadap project staging (lihat bagian berikut). Jangan menjalankan test destruktif terhadap production.
5. Setelah deploy, pastikan `GET /api/health` mengembalikan 200 dan pasang monitoring uptime pada endpoint tersebut.
6. Jalankan `npm audit` secara berkala dan perbarui dependency yang memiliki kerentanan.

## CI

`.github/workflows/ci.yml` menjalankan `npm ci`, `npm run check` (lint, typecheck, unit test, build produksi), dan `npm audit --omit=dev` pada setiap push ke `main` dan pull request. Job ini tidak membutuhkan kredensial Supabase.

## Sisa pekerjaan opsional

- **Rate limiting tambahan di sisi aplikasi.** Saat ini mengandalkan rate limit bawaan Supabase GoTrue; reverse proxy/CDN dapat menambah pembatasan per-IP.

## Integration test Supabase staging

Gunakan project Supabase staging khusus test, lalu sediakan tiga environment variable server-only:

```bash
SUPABASE_TEST_URL=...
SUPABASE_TEST_ANON_KEY=...
SUPABASE_TEST_SERVICE_ROLE_KEY=...
npm run test:integration
```

Jangan memberi prefix `NEXT_PUBLIC_` pada service-role key dan jangan menjalankan test ini terhadap production. Test membuat dua akun sementara, membuktikan isolasi profil/transaksi/RPC/reset, kemudian menghapus akun tersebut melalui Admin API.

Setelah build produksi tersedia dan browser Chromium Playwright sudah terpasang, jalankan alur UI lengkap:

```bash
npm run build
npm run test:e2e
```

Secara default test menyalakan `next start` pada port 3002. Untuk menguji deployment staging yang sudah berjalan, isi `E2E_BASE_URL` dengan URL staging. Project Supabase yang digunakan aplikasi harus sama dengan `SUPABASE_TEST_URL`.

## Struktur utama

- `proxy.ts`: penyegaran sesi Supabase di latar belakang (cookie httpOnly).
- `app/api/auth`: route handler login, signup, logout, sesi, profil, dan callback konfirmasi email.
- `app/api/finance`: route handler data keuangan (profil, ringkasan, transaksi, reset).
- `src/server`: service autentikasi dan repository data sisi server (dipakai route handler).
- `src/lib/api`: envelope response, guard CSRF/validasi request, dan pemanggil API dari browser.
- `src/lib/supabase/server.ts`: pembuat klien Supabase per request dengan cookie httpOnly.
- `src/lib/supabase/fetch.ts`: pembungkus fetch dengan timeout 20 detik untuk seluruh request Supabase di server.
- `src/shared/fetch.ts`: helper timeout dan penggabungan AbortSignal (dipakai server dan browser).
- `src/features/auth`: state sesi dan pemanggil endpoint autentikasi.
- `src/features/finance`: domain, validasi, kategori, repository, dan state data keuangan.
- `src/features/reports`: transformasi dan ekspor CSV.
- `src/features/ui`: state presentasi dan navigasi.
- `src/components`: komponen UI yang dipakai lintas fitur.
- `supabase/migrations`: constraint, RLS, trigger, dan RPC database.
