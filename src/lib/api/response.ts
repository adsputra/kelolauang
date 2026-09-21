import type { AppError } from '../../shared/result';

const STATUS_BY_CODE: Record<string, number> = {
  NOT_AUTHENTICATED: 401,
  FORBIDDEN: 403,
  CSRF_REJECTED: 403,
  NOT_FOUND: 404,
  REQUEST_IN_PROGRESS: 409,
  EDIT_CONFLICT: 409,
  DELETE_CONFLICT: 409,
  PROFILE_CONFLICT: 409,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  INVALID_AMOUNT: 400,
  INVALID_DATE: 400,
  INVALID_CATEGORY: 400,
  INVALID_NAME: 400,
  INVALID_EMAIL: 400,
  INVALID_PASSWORD: 400,
  INVALID_MONTHLY_LIMIT: 400,
  AUTH_UNAVAILABLE: 503,
  NETWORK_ERROR: 502,
  REQUEST_TIMEOUT: 504,
  PAYLOAD_TOO_LARGE: 413,
};

export function statusForErrorCode(code: string): number {
  if (STATUS_BY_CODE[code] !== undefined) return STATUS_BY_CODE[code];
  if (code.startsWith('INVALID_') || code.endsWith('_TOO_LONG')) return 400;
  if (code.endsWith('_CONFLICT')) return 409;
  return 500;
}

function withNoStore(headers?: Headers): Headers {
  const resolved = headers ?? new Headers();
  if (!resolved.has('Cache-Control')) {
    resolved.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  return resolved;
}

export function apiSuccess<T>(data: T, headers?: Headers): Response {
  return Response.json({ data, error: null }, { status: 200, headers: withNoStore(headers) });
}

export function apiError(code: string, message: string, headers?: Headers): Response {
  return Response.json(
    { data: null, error: { code, message } },
    { status: statusForErrorCode(code), headers: withNoStore(headers) },
  );
}

export function apiFailure(error: AppError, headers?: Headers): Response {
  return apiError(error.code, error.message, headers);
}
