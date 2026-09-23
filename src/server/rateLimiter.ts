export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly limit: number;
  private readonly windowMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(limit: number, windowMs: number, autoCleanup = true) {
    this.limit = limit;
    this.windowMs = windowMs;

    if (autoCleanup && typeof setInterval !== 'undefined') {
      // Pembersihan otomatis kunci yang sudah kedaluwarsa untuk mencegah kebocoran memori
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpired();
      }, Math.max(30_000, Math.min(windowMs, 300_000)));

      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return {
        allowed: true,
        remaining: Math.max(0, this.limit - 1),
        resetInSeconds: Math.ceil(this.windowMs / 1000),
      };
    }

    if (existing.count < this.limit) {
      existing.count += 1;
      return {
        allowed: true,
        remaining: Math.max(0, this.limit - existing.count),
        resetInSeconds: Math.max(1, Math.ceil((existing.resetTime - now) / 1000)),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((existing.resetTime - now) / 1000)),
    };
  }

  public reset(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/** Rate limiter login: maks 5 percobaan per 60 detik per IP */
export const authLoginRateLimiter = new SlidingWindowRateLimiter(5, 60_000);

/** Rate limiter pendaftaran akun: maks 3 pendaftaran per 10 menit per IP */
export const authSignupRateLimiter = new SlidingWindowRateLimiter(3, 10 * 60_000);

/** Rate limiter operasi reset data: maks 2 kali per 60 menit per user ID */
export const financeResetRateLimiter = new SlidingWindowRateLimiter(2, 60 * 60_000);
