import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  validateEmail,
  validateLoginInput,
  validateName,
  validatePassword,
  validateRegisterInput,
} from '../features/auth/authValidation';
import { MAX_NAME_LENGTH } from '../features/finance/validation';

test('validasi email menerima alamat valid dan melakukan normalisasi huruf kecil serta trim', () => {
  const result = validateEmail('  User.Test+Fin@Example.COM  ');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data, 'user.test+fin@example.com');
  }
});

test('validasi email menolak format yang salah, kosong, atau bukan string', () => {
  assert.equal(validateEmail('').ok, false);
  assert.equal(validateEmail('user@').ok, false);
  assert.equal(validateEmail('@domain.com').ok, false);
  assert.equal(validateEmail('user@domain').ok, false);
  assert.equal(validateEmail(null).ok, false);
  assert.equal(validateEmail(123).ok, false);
});

test('validasi password menolak kata sandi di bawah 6 karakter atau kosong', () => {
  assert.equal(validatePassword('').ok, false);
  assert.equal(validatePassword('12345').ok, false);
  assert.equal(validatePassword(null).ok, false);

  const valid = validatePassword('rahasia123');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data, 'rahasia123');
  }
});

test('validasi nama merapikan spasi ganda dan menolak string kosong atau terlalu panjang', () => {
  const valid = validateName('  Budi   Santoso  ');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data, 'Budi Santoso');
  }

  assert.equal(validateName('   ').ok, false);
  assert.equal(validateName('A'.repeat(121)).ok, false);
});

test('validateLoginInput memvalidasi email dan password sekaligus', () => {
  const valid = validateLoginInput('User@Domain.Com', 'password123');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.email, 'user@domain.com');
    assert.equal(valid.data.password, 'password123');
  }

  assert.equal(validateLoginInput('invalid-email', 'password123').ok, false);
  assert.equal(validateLoginInput('user@domain.com', '').ok, false);
});

test('validateRegisterInput memvalidasi nama, email, dan password', () => {
  const valid = validateRegisterInput('  Ani  ', 'Ani@Test.id', 'secret123');
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.name, 'Ani');
    assert.equal(valid.data.email, 'ani@test.id');
    assert.equal(valid.data.password, 'secret123');
  }

  assert.equal(validateRegisterInput('', 'ani@test.id', 'secret123').ok, false);
  assert.equal(validateRegisterInput('Ani', 'notanemail', 'secret123').ok, false);
  assert.equal(validateRegisterInput('Ani', 'ani@test.id', '123').ok, false);
});

test('validasi menolak nilai yang melewati batas panjang maksimum', () => {
  assert.equal(validatePassword('a'.repeat(MAX_PASSWORD_LENGTH + 1)).ok, false);
  assert.equal(validateEmail(`${'a'.repeat(MAX_EMAIL_LENGTH)}@example.com`).ok, false);
  assert.equal(validateName('A'.repeat(MAX_NAME_LENGTH + 1)).ok, false);
});
