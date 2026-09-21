const TIMEOUT_ERROR_NAME = 'TimeoutError';

/** Gabungkan beberapa signal tanpa bergantung pada AbortSignal.any. */
export function combineAbortSignals(
  signals: Array<AbortSignal | null | undefined>,
): AbortSignal {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  if (active.length === 0) return new AbortController().signal;
  if (active.length === 1) return active[0];
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(active);

  const controller = new AbortController();
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

/**
 * Fetch dengan batas waktu; timer selalu dibersihkan setelah request selesai.
 * Timeout dibatalkan dengan `DOMException` bernama `TimeoutError` sehingga
 * pemanggil dapat membedakannya dari pembatalan oleh pengguna (`AbortError`).
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    controller.abort(new DOMException('Request timeout', TIMEOUT_ERROR_NAME));
  }, timeoutMs);
  const unref = (timer as unknown as { unref?: () => void }).unref;
  if (typeof unref === 'function') unref.call(timer);

  const signal = combineAbortSignals([init?.signal, controller.signal]);
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timer));
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === TIMEOUT_ERROR_NAME;
}
