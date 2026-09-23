import assert from 'node:assert/strict';
import test from 'node:test';
import { SlidingWindowRateLimiter } from '../server/rateLimiter';

test('SlidingWindowRateLimiter mengizinkan request di bawah batas dan memblokir saat melebihi batas', () => {
  const limiter = new SlidingWindowRateLimiter(3, 5000, false);
  const key = 'test-ip-1';

  // Request 1: allowed
  const res1 = limiter.check(key);
  assert.equal(res1.allowed, true);
  assert.equal(res1.remaining, 2);

  // Request 2: allowed
  const res2 = limiter.check(key);
  assert.equal(res2.allowed, true);
  assert.equal(res2.remaining, 1);

  // Request 3: allowed
  const res3 = limiter.check(key);
  assert.equal(res3.allowed, true);
  assert.equal(res3.remaining, 0);

  // Request 4: blocked
  const res4 = limiter.check(key);
  assert.equal(res4.allowed, false);
  assert.equal(res4.remaining, 0);
  assert.ok(res4.resetInSeconds > 0);

  // Kunci lain tidak terpengaruh
  const otherKeyRes = limiter.check('test-ip-2');
  assert.equal(otherKeyRes.allowed, true);
  assert.equal(otherKeyRes.remaining, 2);

  limiter.destroy();
});

test('SlidingWindowRateLimiter reset menghapus hitung mundur untuk kunci tertentu', () => {
  const limiter = new SlidingWindowRateLimiter(2, 5000, false);
  const key = 'test-ip-reset';

  limiter.check(key);
  limiter.check(key);
  assert.equal(limiter.check(key).allowed, false);

  // Reset kunci
  limiter.reset(key);
  const afterReset = limiter.check(key);
  assert.equal(afterReset.allowed, true);
  assert.equal(afterReset.remaining, 1);

  limiter.destroy();
});
