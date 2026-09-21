import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_JSON_BODY_BYTES,
  isIsoTimestamp,
  isSameOriginRequest,
  isUuid,
  parsePageParam,
  readJsonObject,
  safeRedirectPath,
} from '../lib/api/request';
import { apiError, apiSuccess, statusForErrorCode } from '../lib/api/response';
import { requestApi } from '../lib/api/client';

test('statusForErrorCode memetakan kode error ke status HTTP yang tepat', () => {
  assert.equal(statusForErrorCode('NOT_AUTHENTICATED'), 401);
  assert.equal(statusForErrorCode('FORBIDDEN'), 403);
  assert.equal(statusForErrorCode('CSRF_REJECTED'), 403);
  assert.equal(statusForErrorCode('INVALID_CATEGORY'), 400);
  assert.equal(statusForErrorCode('NOTES_TOO_LONG'), 400);
  assert.equal(statusForErrorCode('EDIT_CONFLICT'), 409);
  assert.equal(statusForErrorCode('PROFILE_CONFLICT'), 409);
  assert.equal(statusForErrorCode('AUTH_UNAVAILABLE'), 503);
  assert.equal(statusForErrorCode('NETWORK_ERROR'), 502);
  assert.equal(statusForErrorCode('REQUEST_TIMEOUT'), 504);
  assert.equal(statusForErrorCode('PAYLOAD_TOO_LARGE'), 413);
  assert.equal(statusForErrorCode('UNKNOWN_CODE'), 500);
});

test('apiSuccess dan apiError memakai envelope { data, error } yang konsisten', async () => {
  const success = apiSuccess({ id: 'tx-1' });
  assert.equal(success.status, 200);
  assert.equal(success.headers.get('Cache-Control')?.includes('no-store'), true);
  assert.deepEqual(await success.json(), { data: { id: 'tx-1' }, error: null });

  const failure = apiError('NOT_AUTHENTICATED', 'Sesi berakhir.');
  assert.equal(failure.status, 401);
  assert.deepEqual(await failure.json(), {
    data: null,
    error: { code: 'NOT_AUTHENTICATED', message: 'Sesi berakhir.' },
  });
});

test('isSameOriginRequest menolak origin lintas situs dan menerima same-origin', () => {
  const sameOrigin = new Request('http://localhost:3000/api', {
    headers: { 'sec-fetch-site': 'same-origin' },
  });
  assert.equal(isSameOriginRequest(sameOrigin), true);

  const crossSite = new Request('http://localhost:3000/api', {
    headers: { 'sec-fetch-site': 'cross-site', origin: 'https://evil.example' },
  });
  assert.equal(isSameOriginRequest(crossSite), false);

  const originOnly = new Request('http://localhost:3000/api', {
    headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
  });
  assert.equal(isSameOriginRequest(originOnly), true);

  const mismatchedOrigin = new Request('http://localhost:3000/api', {
    headers: { host: 'localhost:3000', origin: 'https://evil.example' },
  });
  assert.equal(isSameOriginRequest(mismatchedOrigin), false);
});

test('isUuid, isIsoTimestamp, parsePageParam, dan safeRedirectPath memvalidasi input', () => {
  assert.equal(isUuid('6f0c2f5e-1a2b-4c3d-8e4f-5a6b7c8d9e0f'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isIsoTimestamp('2026-09-21T06:00:00.000Z'), true);
  assert.equal(isIsoTimestamp('bukan-tanggal'), false);
  assert.equal(parsePageParam(null), 0);
  assert.equal(parsePageParam('3'), 3);
  assert.equal(parsePageParam('-1'), null);
  assert.equal(parsePageParam('9999999'), null);
  assert.equal(safeRedirectPath('/laporan'), '/laporan');
  assert.equal(safeRedirectPath('//evil.example'), '/');
  assert.equal(safeRedirectPath('https://evil.example'), '/');
});

test('readJsonObject memvalidasi body dan membatasi ukurannya', async () => {
  const valid = new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify({ email: 'a@b.com' }),
  });
  const validResult = await readJsonObject(valid);
  assert.equal(validResult.ok, true);
  if (validResult.ok) assert.deepEqual(validResult.data, { email: 'a@b.com' });

  const arrayBody = new Request('http://localhost/api', { method: 'POST', body: '[]' });
  const arrayResult = await readJsonObject(arrayBody);
  assert.equal(arrayResult.ok, false);
  if (!arrayResult.ok) assert.equal(arrayResult.error.code, 'INVALID_INPUT');

  const invalidBody = new Request('http://localhost/api', { method: 'POST', body: 'bukan-json' });
  const invalidResult = await readJsonObject(invalidBody);
  assert.equal(invalidResult.ok, false);
  if (!invalidResult.ok) assert.equal(invalidResult.error.code, 'INVALID_INPUT');

  const oversizeBody = new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify({ notes: 'a'.repeat(MAX_JSON_BODY_BYTES) }),
  });
  const oversizeResult = await readJsonObject(oversizeBody);
  assert.equal(oversizeResult.ok, false);
  if (!oversizeResult.ok) assert.equal(oversizeResult.error.code, 'PAYLOAD_TOO_LARGE');
});

test('requestApi memetakan envelope sukses dan error', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      Response.json({ data: { ok: true }, error: null })) as typeof fetch;
    const okResult = await requestApi<{ ok: boolean }>('/api/test');
    assert.equal(okResult.ok, true);
    if (okResult.ok) assert.deepEqual(okResult.data, { ok: true });

    globalThis.fetch = (async () =>
      Response.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Tidak boleh.' } },
        { status: 403 },
      )) as typeof fetch;
    const failureResult = await requestApi('/api/test');
    assert.equal(failureResult.ok, false);
    if (!failureResult.ok) {
      assert.equal(failureResult.error.code, 'FORBIDDEN');
      assert.equal(failureResult.error.message, 'Tidak boleh.');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('requestApi menangani 401, response rusak, dan kegagalan jaringan', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      Response.json(
        { data: null, error: { code: 'NOT_AUTHENTICATED', message: 'Sesi berakhir.' } },
        { status: 401 },
      )) as typeof fetch;
    const unauthorized = await requestApi('/api/test');
    assert.equal(unauthorized.ok, false);
    if (!unauthorized.ok) assert.equal(unauthorized.error.code, 'NOT_AUTHENTICATED');

    globalThis.fetch = (async () => new Response('bukan json', { status: 500 })) as typeof fetch;
    const broken = await requestApi('/api/test');
    assert.equal(broken.ok, false);
    if (!broken.ok) assert.equal(broken.error.code, 'REQUEST_FAILED');

    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const offline = await requestApi('/api/test');
    assert.equal(offline.ok, false);
    if (!offline.ok) assert.equal(offline.error.code, 'NETWORK_ERROR');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
