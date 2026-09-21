import assert from 'node:assert/strict';
import test from 'node:test';
import { createIdempotencyKey } from '../shared/idempotency';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('createIdempotencyKey menghasilkan UUID v4 yang unik', () => {
  const keys = new Set(Array.from({ length: 100 }, () => createIdempotencyKey()));
  assert.equal(keys.size, 100);
  for (const key of keys) {
    assert.match(key, UUID_V4_PATTERN);
  }
});
