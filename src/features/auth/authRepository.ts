import { requestApi } from '../../lib/api/client';
import type { AuthUser } from '../../types';
import { success, type Result } from '../../shared/result';
import {
  validateLoginInput,
  validateName,
  validateRegisterInput,
} from './authValidation';

export function fetchSession(): Promise<Result<AuthUser | null>> {
  return requestApi<AuthUser | null>('/api/auth/session');
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  const validated = validateLoginInput(email, password);
  if (!validated.ok) return validated;

  return requestApi<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(validated.data),
  });
}

export async function registerAccount(
  name: string,
  email: string,
  password: string,
): Promise<Result<{ user: AuthUser; hasSession: boolean }>> {
  const validated = validateRegisterInput(name, email, password);
  if (!validated.ok) return validated;

  return requestApi('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(validated.data),
  });
}

export async function signOutAccount(): Promise<Result<void>> {
  const result = await requestApi<null>('/api/auth/logout', { method: 'POST' });
  return result.ok ? success(undefined) : result;
}

export async function updateAccountName(name: string): Promise<Result<void>> {
  const validated = validateName(name);
  if (!validated.ok) return validated;

  const result = await requestApi<null>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name: validated.data }),
  });
  return result.ok ? success(undefined) : result;
}
