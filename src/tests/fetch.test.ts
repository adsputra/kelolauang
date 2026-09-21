import assert from 'node:assert/strict';
import test from 'node:test';
import { combineAbortSignals, fetchWithTimeout } from '../shared/fetch';

function hangingFetch(): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
    })) as typeof fetch;
}

test('fetchWithTimeout membatalkan request yang melewati batas waktu', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = hangingFetch();
    await assert.rejects(fetchWithTimeout('http://localhost/slow', undefined, 10));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithTimeout meneruskan abort dari pemanggil tanpa menunggu timeout', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = hangingFetch();
    const controller = new AbortController();
    const pending = fetchWithTimeout('http://localhost/slow', { signal: controller.signal }, 60_000);
    controller.abort(new DOMException('Dibatalkan pemanggil', 'AbortError'));
    await assert.rejects(
      pending,
      (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithTimeout meneruskan response normal dan combineAbortSignals bekerja', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response('ok', { status: 200 })) as typeof fetch;
    const response = await fetchWithTimeout('http://localhost/fast', undefined, 1_000);
    assert.equal(response.status, 200);

    const controller = new AbortController();
    const combined = combineAbortSignals([controller.signal, AbortSignal.timeout(60_000)]);
    assert.equal(combined.aborted, false);
    controller.abort();
    assert.equal(combined.aborted, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
