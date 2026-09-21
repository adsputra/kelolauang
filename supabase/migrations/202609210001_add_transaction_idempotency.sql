BEGIN;

-- Idempotency key opsional untuk pembuatan transaksi: retry setelah timeout
-- tidak lagi menghasilkan transaksi ganda. Unik per pengguna.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_idempotency_key_idx
  ON public.transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
