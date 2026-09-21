import type { Result } from '../../shared/result';
import { failure, success } from '../../shared/result';
import { fetchWithTimeout, isTimeoutError } from '../../shared/fetch';

const API_REQUEST_TIMEOUT_MS = 25_000;

interface ApiEnvelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

/**
 * Pemanggil API internal dari browser. Selalu mengirim cookie sesi
 * (`credentials: same-origin`) dan menormalkan bentuk response `{ data, error }`.
 */
export async function requestApi<T>(input: string, init?: RequestInit): Promise<Result<T>> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  try {
    const response = await fetchWithTimeout(
      input,
      { ...init, headers, credentials: 'same-origin' },
      API_REQUEST_TIMEOUT_MS,
    );

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !payload || payload.error) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kelolauang:unauthorized'));
        }
        return failure(
          'NOT_AUTHENTICATED',
          payload?.error?.message ?? 'Sesi Anda telah berakhir. Silakan masuk kembali.',
        );
      }
      return failure(
        payload?.error?.code ?? 'REQUEST_FAILED',
        payload?.error?.message ?? 'Permintaan gagal diproses. Coba lagi sesaat.',
      );
    }

    return success(payload.data as T);
  } catch (error) {
    if (isTimeoutError(error)) {
      return failure('REQUEST_TIMEOUT', 'Permintaan melebihi batas waktu. Periksa koneksi lalu coba kembali.');
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return failure('ABORTED', 'Permintaan dibatalkan.');
    }
    return failure('NETWORK_ERROR', 'Koneksi terputus. Periksa koneksi Anda lalu coba kembali.');
  }
}
