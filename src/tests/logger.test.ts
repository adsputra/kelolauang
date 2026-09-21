import assert from 'node:assert/strict';
import test from 'node:test';
import { redactSensitiveData } from '../shared/logger';

test('redactSensitiveData menyamarkan atribut password, token, key, dan secret', () => {
  const sensitivePayload = {
    email: 'user@example.com',
    password: 'supersecretpassword',
    authToken: 'jwt.token.here',
    apiKey: 'secret-api-key',
    authorization: 'Bearer token-xyz',
    cookie: 'session=12345',
    metadata: {
      clientSecret: 'secret99',
      role: 'admin',
    },
    list: [
      { secretValue: 'hidden', visible: 'ok' },
    ],
  };

  const sanitized = redactSensitiveData(sensitivePayload);

  assert.equal(sanitized.email, 'user@example.com');
  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.authToken, '[REDACTED]');
  assert.equal(sanitized.apiKey, '[REDACTED]');
  assert.equal(sanitized.authorization, '[REDACTED]');
  assert.equal(sanitized.cookie, '[REDACTED]');
  assert.equal(sanitized.metadata.clientSecret, '[REDACTED]');
  assert.equal(sanitized.metadata.role, 'admin');
  assert.equal(sanitized.list[0]?.secretValue, '[REDACTED]');
  assert.equal(sanitized.list[0]?.visible, 'ok');
});

test('redactSensitiveData menangani nilai primitif, null, dan array dengan aman', () => {
  assert.equal(redactSensitiveData(null), null);
  assert.equal(redactSensitiveData('regular text'), 'regular text');
  assert.equal(redactSensitiveData(42), 42);
  assert.deepEqual(redactSensitiveData([1, 2, 'three']), [1, 2, 'three']);
});
