import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`E2E test membutuhkan environment variable ${name}.`);
  return value;
}

const supabaseUrl = requireEnvironmentVariable('SUPABASE_TEST_URL');
const serviceRoleKey = requireEnvironmentVariable('SUPABASE_TEST_SERVICE_ROLE_KEY');
const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const createdUserIds: string[] = [];

async function createConfirmedUser(label: string) {
  const email = `kelolauang-e2e-${Date.now()}-${crypto.randomUUID()}-${label}@example.com`;
  const password = `K3lola!${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: `E2E ${label}` },
  });
  if (error || !data.user) throw error ?? new Error('Akun E2E gagal dibuat.');
  createdUserIds.push(data.user.id);
  return { email, password };
}

test.afterAll(async () => {
  await Promise.all(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
});

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/');
  await page.getByLabel('Alamat email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk sekarang' }).click();
  await expect(page.getByRole('heading', { name: /Selamat (pagi|siang|sore|malam)/ })).toBeVisible();
}

async function addExpense(page: import('@playwright/test').Page, amount: string, notes: string) {
  await page.getByRole('main').getByRole('button', { name: 'Pengeluaran', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Jumlah nominal').fill(amount);
  await dialog.getByRole('button', { name: 'Belanja', exact: true }).click();
  await dialog.getByLabel(/Catatan/).fill(notes);
  await dialog.getByRole('button', { name: 'Catat transaksi' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(notes, { exact: true }).first()).toBeVisible();
}

test('autentikasi, CRUD transaksi, dan tampilan antar-akun tetap terisolasi', async ({ page }) => {
  const accountA = await createConfirmedUser('account-a');
  const accountB = await createConfirmedUser('account-b');
  const originalNotes = `Belanja E2E ${crypto.randomUUID()}`;
  const editedNotes = `${originalNotes} diperbarui`;
  const isolationMarker = `Hanya akun A ${crypto.randomUUID()}`;

  await login(page, accountA.email, accountA.password);
  await addExpense(page, '125000', originalNotes);

  await page.getByRole('button', { name: 'Edit transaksi Belanja' }).first().click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('Jumlah nominal').fill('150000');
  await editDialog.getByLabel(/Catatan/).fill(editedNotes);
  await editDialog.getByRole('button', { name: 'Simpan perubahan' }).click();
  await expect(editDialog).toBeHidden();
  await expect(page.getByText(editedNotes, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Hapus transaksi Belanja' }).first().click();
  const deleteDialog = page.getByRole('dialog');
  await deleteDialog.getByRole('button', { name: 'Hapus transaksi' }).click();
  await expect(deleteDialog).toBeHidden();
  await expect(page.getByText(editedNotes, { exact: true })).toHaveCount(0);

  await addExpense(page, '1000', isolationMarker);
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await expect(page.getByRole('button', { name: 'Masuk sekarang' })).toBeVisible();

  await login(page, accountB.email, accountB.password);
  await expect(page.getByText(isolationMarker, { exact: true })).toHaveCount(0);
});
