import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { parseFinanceOverview } from '../features/finance/overview';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Integration test membutuhkan environment variable ${name}.`);
  return value;
}

const supabaseUrl = requireEnvironmentVariable('SUPABASE_TEST_URL');
const supabaseAnonKey = requireEnvironmentVariable('SUPABASE_TEST_ANON_KEY');
const supabaseServiceRoleKey = requireEnvironmentVariable('SUPABASE_TEST_SERVICE_ROLE_KEY');

function createStatelessClient(key: string) {
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const admin = createStatelessClient(supabaseServiceRoleKey);
const createdUserIds: string[] = [];

after(async () => {
  await Promise.all(createdUserIds.map((userId) => admin.auth.admin.deleteUser(userId)));
});

async function createConfirmedUser(label: string) {
  const email = `kelolauang-${Date.now()}-${crypto.randomUUID()}-${label}@example.com`;
  const password = `K3lola!${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: `Integration ${label}` },
  });
  assert.equal(error, null);
  assert.ok(data.user);
  createdUserIds.push(data.user.id);

  const client = createStatelessClient(supabaseAnonKey);
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null);
  assert.equal(login.data.user?.id, data.user.id);
  return { client, userId: data.user.id };
}

test('RLS mengisolasi profil, transaksi, agregasi, dan reset antar-akun', async () => {
  const accountA = await createConfirmedUser('account-a');
  const accountB = await createConfirmedUser('account-b');
  const anonymous = createStatelessClient(supabaseAnonKey);

  const insertA = await accountA.client
    .from('transactions')
    .insert({
      user_id: accountA.userId,
      type: 'income',
      amount: 700_000,
      date: '2026-09-04',
      category: 'Gaji',
      notes: 'Milik akun A',
    })
    .select('id')
    .single();
  assert.equal(insertA.error, null);
  assert.ok(insertA.data?.id);

  const insertB = await accountB.client
    .from('transactions')
    .insert({
      user_id: accountB.userId,
      type: 'expense',
      amount: 125_000,
      date: '2026-09-04',
      category: 'Belanja',
      notes: 'Milik akun B',
    })
    .select('id')
    .single();
  assert.equal(insertB.error, null);
  assert.ok(insertB.data?.id);

  const readAFromB = await accountB.client
    .from('transactions')
    .select('id')
    .eq('id', insertA.data.id);
  assert.equal(readAFromB.error, null);
  assert.deepEqual(readAFromB.data, []);

  const updateAFromB = await accountB.client
    .from('transactions')
    .update({ notes: 'Percobaan perubahan lintas akun' })
    .eq('id', insertA.data.id)
    .select('id');
  assert.equal(updateAFromB.error, null);
  assert.deepEqual(updateAFromB.data, []);

  const deleteAFromB = await accountB.client
    .from('transactions')
    .delete()
    .eq('id', insertA.data.id)
    .select('id');
  assert.equal(deleteAFromB.error, null);
  assert.deepEqual(deleteAFromB.data, []);

  const forgedInsert = await accountB.client.from('transactions').insert({
    user_id: accountA.userId,
    type: 'expense',
    amount: 1,
    date: '2026-09-04',
    category: 'Belanja',
    notes: 'Percobaan user_id palsu',
  });
  assert.ok(forgedInsert.error);

  const profileAFromB = await accountB.client
    .from('users')
    .select('id')
    .eq('id', accountA.userId);
  assert.equal(profileAFromB.error, null);
  assert.deepEqual(profileAFromB.data, []);

  const anonymousTransactions = await anonymous.from('transactions').select('id');
  assert.equal(anonymousTransactions.error, null);
  assert.deepEqual(anonymousTransactions.data, []);

  const overviewAResponse = await accountA.client.rpc('get_finance_overview', {
    p_as_of: '2026-09-04',
  });
  const overviewBResponse = await accountB.client.rpc('get_finance_overview', {
    p_as_of: '2026-09-04',
  });
  assert.equal(overviewAResponse.error, null);
  assert.equal(overviewBResponse.error, null);

  const overviewA = parseFinanceOverview(overviewAResponse.data);
  const overviewB = parseFinanceOverview(overviewBResponse.data);
  assert.equal(overviewA.ok, true);
  assert.equal(overviewB.ok, true);
  if (!overviewA.ok || !overviewB.ok) return;
  assert.equal(overviewA.data.totalIncome, 700_000);
  assert.equal(overviewA.data.totalExpense, 0);
  assert.equal(overviewB.data.totalIncome, 0);
  assert.equal(overviewB.data.totalExpense, 125_000);

  const resetA = await accountA.client.rpc('reset_finance_data');
  assert.equal(resetA.error, null);

  const remainingA = await accountA.client.from('transactions').select('id');
  const remainingB = await accountB.client.from('transactions').select('id');
  assert.deepEqual(remainingA.data, []);
  assert.deepEqual(remainingB.data, [{ id: insertB.data.id }]);
});
