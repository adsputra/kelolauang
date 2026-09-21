BEGIN;

-- =========================================================================
-- Indeks performa untuk mempercepat agregasi ringkasan dan filter transaksi
-- =========================================================================

-- Indeks komposit untuk mempercepat perhitungan arus kas bulanan dan kategori pengeluaran:
-- WHERE user_id = ... AND type = ... AND date >= ... AND date < ...
CREATE INDEX IF NOT EXISTS transactions_user_type_date_idx
  ON public.transactions (user_id, type, date DESC);

-- Indeks untuk mempercepat filter transaksi berdasarkan kategori pengguna:
CREATE INDEX IF NOT EXISTS transactions_user_category_idx
  ON public.transactions (user_id, category);

COMMIT;
