import type { Result } from '../../shared/result';
import { failure, success } from '../../shared/result';
import { MAX_NAME_LENGTH } from '../finance/validation';

export { MAX_NAME_LENGTH } from '../finance/validation';

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_EMAIL_LENGTH = 254;

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: unknown): Result<string> {
  if (typeof email !== 'string') {
    return failure('INVALID_EMAIL', 'Format alamat email tidak valid.');
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(normalized)) {
    return failure('INVALID_EMAIL', 'Alamat email tidak valid.');
  }

  return success(normalized);
}

export function validatePassword(password: unknown): Result<string> {
  if (typeof password !== 'string' || !password) {
    return failure('INVALID_PASSWORD', 'Kata sandi wajib diisi.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return failure('INVALID_PASSWORD', `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return failure('INVALID_PASSWORD', `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter.`);
  }

  return success(password);
}

export function validateName(name: unknown): Result<string> {
  if (typeof name !== 'string') {
    return failure('INVALID_NAME', 'Nama tidak valid.');
  }

  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length > MAX_NAME_LENGTH) {
    return failure('INVALID_NAME', `Nama harus 1–${MAX_NAME_LENGTH} karakter.`);
  }

  return success(normalized);
}

export function validateLoginInput(
  email: unknown,
  password: unknown,
): Result<{ email: string; password: string }> {
  const emailResult = validateEmail(email);
  if (!emailResult.ok) return emailResult;

  if (typeof password !== 'string' || !password) {
    return failure('INVALID_PASSWORD', 'Kata sandi wajib diisi.');
  }

  return success({ email: emailResult.data, password });
}

export function validateRegisterInput(
  name: unknown,
  email: unknown,
  password: unknown,
): Result<{ name: string; email: string; password: string }> {
  const nameResult = validateName(name);
  if (!nameResult.ok) return nameResult;

  const emailResult = validateEmail(email);
  if (!emailResult.ok) return emailResult;

  const passwordResult = validatePassword(password);
  if (!passwordResult.ok) return passwordResult;

  return success({
    name: nameResult.data,
    email: emailResult.data,
    password: passwordResult.data,
  });
}
