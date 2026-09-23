export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded';
  timestamp: string;
  checks: {
    supabaseConfigured: boolean;
    supabaseReachable?: boolean;
  };
}

export async function GET(): Promise<Response> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasConfig = Boolean(supabaseUrl && supabaseAnonKey);

  let supabaseReachable = false;

  if (hasConfig && supabaseUrl) {
    try {
      const pingUrl = new URL('/auth/v1/health', supabaseUrl).toString();
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey ?? '',
        },
        signal: AbortSignal.timeout(3000),
      });
      supabaseReachable = response.ok || response.status === 200;
    } catch {
      supabaseReachable = false;
    }
  }

  const isHealthy = hasConfig && supabaseReachable;
  const result: HealthCheckResult = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured: hasConfig,
      supabaseReachable,
    },
  };

  return Response.json(result, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
