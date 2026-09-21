export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

const SENSITIVE_KEY_PATTERN = /password|token|secret|key|authorization|cookie|bearer|credential/i;

export function redactSensitiveData<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted as T;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  if (process.env.NODE_ENV === 'production' && level === 'debug') return false;
  return true;
}

function serializeError(err: unknown): { name?: string; message?: string; stack?: string } | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    };
  }
  return { message: String(err) };
}

function writeLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const payload = {
    ...entry,
    data: entry.data ? redactSensitiveData(entry.data) : undefined,
  };

  const output = JSON.stringify(payload);
  switch (entry.level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.info(output);
      break;
  }
}

export const logger = {
  debug(context: string, message: string, data?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'debug',
      context,
      message,
      data,
    });
  },

  info(context: string, message: string, data?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      context,
      message,
      data,
    });
  },

  warn(context: string, message: string, data?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      context,
      message,
      data,
    });
  },

  error(context: string, message: string, error?: unknown, data?: Record<string, unknown>): void {
    writeLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message,
      error: serializeError(error),
      data,
    });
  },
};
