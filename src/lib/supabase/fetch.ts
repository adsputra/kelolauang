import { fetchWithTimeout } from '../../shared/fetch';

/** Batas waktu seluruh request Supabase dari server (Auth, PostgREST, RPC). */
export const SUPABASE_TIMEOUT_MS = 20_000;

export function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetchWithTimeout(input, init, SUPABASE_TIMEOUT_MS);
}
