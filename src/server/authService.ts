import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import type { Result } from '../shared/result';
import { failure, success } from '../shared/result';
import { logger } from '../shared/logger';
import type { AuthUser } from '../types';

export function toAuthUser(user: User): AuthUser {
  const metadataName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '';
  return {
    id: user.id,
    email: user.email ?? '',
    name: metadataName.trim() || 'Pengguna',
  };
}

export function safeAuthError(status?: number, code?: string): string {
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba kembali.';
  if (status !== undefined && status >= 500) {
    return 'Layanan autentikasi sedang bermasalah. Coba beberapa saat lagi.';
  }
  if (code === 'email_not_confirmed') return 'Konfirmasi email Anda sebelum masuk.';
  if (code === 'user_already_exists') return 'Akun dengan email tersebut sudah terdaftar.';
  if (code === 'weak_password') return 'Kata sandi belum memenuhi persyaratan keamanan.';
  return 'Email atau kata sandi tidak valid.';
}

export function isAuthUnavailable(
  error: { name?: string; status?: number } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.name === 'AuthRetryableFetchError') return true;
  return typeof error.status === 'number' && error.status >= 500;
}

export async function requireUser(
  supabase: SupabaseClient<Database>,
): Promise<Result<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      if (error && error.status !== undefined && error.status >= 500) {
        return failure('AUTH_UNAVAILABLE', 'Layanan autentikasi sedang bermasalah. Coba lagi sesaat.');
      }
      return failure('NOT_AUTHENTICATED', 'Sesi Anda telah berakhir. Silakan masuk kembali.');
    }
    return success(toAuthUser(data.user));
  } catch (error) {
    logger.error('authService', 'Pengecualian saat memvalidasi sesi pengguna', error);
    return failure('AUTH_UNAVAILABLE', 'Layanan autentikasi tidak dapat dihubungi. Coba lagi sesaat.');
  }
}

export async function signInWithPassword(
  supabase: SupabaseClient<Database>,
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      logger.warn('authService', 'Gagal login pengguna', { code: error?.code, status: error?.status });
      if (error && isAuthUnavailable(error)) {
        return failure('NETWORK_ERROR', 'Tidak dapat menghubungi layanan autentikasi. Periksa koneksi Anda.');
      }
      return failure(error?.code ?? 'AUTH_FAILED', safeAuthError(error?.status, error?.code));
    }
    return success(toAuthUser(data.user));
  } catch (error) {
    logger.error('authService', 'Pengecualian jaringan saat login', error);
    return failure('NETWORK_ERROR', 'Tidak dapat menghubungi layanan autentikasi. Periksa koneksi Anda.');
  }
}

export async function registerAccount(
  supabase: SupabaseClient<Database>,
  name: string,
  email: string,
  password: string,
  emailRedirectTo: string,
): Promise<Result<{ user: AuthUser; hasSession: boolean }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo },
    });
    if (error || !data.user) {
      logger.warn('authService', 'Gagal mendaftar pengguna baru', { code: error?.code, status: error?.status });
      if (error && isAuthUnavailable(error)) {
        return failure('NETWORK_ERROR', 'Tidak dapat menghubungi layanan autentikasi. Periksa koneksi Anda.');
      }
      return failure(error?.code ?? 'SIGNUP_FAILED', safeAuthError(error?.status, error?.code));
    }
    return success({ user: toAuthUser(data.user), hasSession: Boolean(data.session) });
  } catch (error) {
    logger.error('authService', 'Pengecualian jaringan saat pendaftaran akun', error);
    return failure('NETWORK_ERROR', 'Tidak dapat membuat akun saat ini. Periksa koneksi Anda.');
  }
}

export async function signOut(supabase: SupabaseClient<Database>): Promise<Result<void>> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('authService', 'Gagal sign out akun', error);
      return failure('LOGOUT_FAILED', 'Gagal keluar dengan aman. Silakan coba kembali.');
    }
    return success(undefined);
  } catch (error) {
    logger.error('authService', 'Pengecualian jaringan saat logout', error);
    return failure('NETWORK_ERROR', 'Koneksi terputus saat keluar. Silakan coba kembali.');
  }
}

export async function updateAccountName(
  supabase: SupabaseClient<Database>,
  name: string,
): Promise<Result<void>> {
  try {
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (error) {
      logger.error('authService', 'Gagal memperbarui nama akun auth', error);
      return failure('AUTH_PROFILE_FAILED', 'Nama tersimpan, tetapi profil autentikasi belum tersinkron.');
    }
    return success(undefined);
  } catch (error) {
    logger.error('authService', 'Pengecualian jaringan saat sinkronisasi nama akun', error);
    return failure('NETWORK_ERROR', 'Nama tersimpan, tetapi sinkronisasi profil terputus.');
  }
}
