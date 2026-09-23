import { failure, success, type Result } from '../../shared/result';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Batas ukuran body JSON untuk seluruh endpoint mutasi (catatan transaksi maks 1000 karakter). */
export const MAX_JSON_BODY_BYTES = 64 * 1024;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

export async function readJsonObject(request: Request): Promise<Result<Record<string, unknown>>> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (Number.isFinite(length) && length > MAX_JSON_BODY_BYTES) {
      return failure('PAYLOAD_TOO_LARGE', 'Ukuran permintaan melebihi batas yang diizinkan.');
    }
  }

  let raw: string;
  try {
    raw = await readBoundedBody(request, MAX_JSON_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return failure('PAYLOAD_TOO_LARGE', 'Ukuran permintaan melebihi batas yang diizinkan.');
    }
    return failure('INVALID_INPUT', 'Format permintaan tidak valid.');
  }

  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return failure('INVALID_INPUT', 'Format permintaan tidak valid.');
    }
    return success(body as Record<string, unknown>);
  } catch {
    return failure('INVALID_INPUT', 'Format permintaan tidak valid.');
  }
}

class BodyTooLargeError extends Error {}

async function readBoundedBody(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new BodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  return text + decoder.decode();
}

export function parsePageParam(value: string | null, maxPage = 10_000): number | null {
  if (value === null) return 0;
  if (!/^\d{1,6}$/.test(value)) return null;
  const page = Number(value);
  return page <= maxPage ? page : null;
}

/** Hanya izinkan path internal agar redirect tidak bisa dipakai sebagai open redirect. */
export function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

/**
 * Pertahanan CSRF untuk request mutasi: wajib berasal dari origin yang sama.
 * Browser modern mengirim `Sec-Fetch-Site`; fallback membandingkan Origin atau Referer dengan Host.
 * Menolak secara default (fail-secure) jika origin maupun referer tidak dapat ditentukan.
 */
export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';

  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // Fail-secure: jika sec-fetch-site, origin, dan referer semua tidak ada, tolak request mutasi
  return false;
}

/**
 * Mengekstrak alamat IP klien dari header request (mendukung proxy / load balancer).
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return '127.0.0.1';
}
