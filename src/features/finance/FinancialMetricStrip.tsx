import { formatRp } from '../../shared/currency';

type MetricTone = 'neutral' | 'income' | 'expense';

interface ProgressDefinition {
  value: number;
  label: string;
  tone: 'safe' | 'warning' | 'danger';
}

export interface FinancialMetric {
  label: string;
  amount: number;
  tone?: MetricTone;
  supportingText?: string;
  progress?: ProgressDefinition;
}

interface FinancialMetricStripProps {
  metrics: [FinancialMetric, FinancialMetric, FinancialMetric];
  label: string;
}

const VALUE_TONES: Record<MetricTone, string> = {
  neutral: 'text-zinc-950 dark:text-zinc-50',
  income: 'text-emerald-700 dark:text-emerald-300',
  expense: 'text-rose-700 dark:text-rose-300',
};

const PROGRESS_TONES: Record<ProgressDefinition['tone'], string> = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export default function FinancialMetricStrip({ metrics, label }: FinancialMetricStripProps) {
  const hasProgress = metrics.some((metric) => metric.progress);
  const desktopColumns = hasProgress
    ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1.3fr)_minmax(0,0.85fr)]'
    : 'lg:grid-cols-3';

  return (
    <section
      aria-label={label}
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white lg:grid lg:divide-x lg:divide-y-0 dark:border-zinc-800 dark:bg-zinc-950 dark:divide-zinc-800 ${desktopColumns}`}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex min-h-28 flex-col justify-between gap-4 border-b border-zinc-200 p-5 last:border-b-0 lg:min-h-32 lg:border-b-0 lg:p-6 dark:border-zinc-800"
        >
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{metric.label}</p>
            <p className={`mt-2 break-words font-mono text-2xl font-bold tracking-tight ${VALUE_TONES[metric.tone ?? 'neutral']}`}>
              {formatRp(metric.amount)}
            </p>
          </div>

          {metric.progress ? (
            <div>
              <div
                className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-label={metric.progress.label}
                aria-valuenow={metric.progress.value}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${PROGRESS_TONES[metric.progress.tone]}`}
                  style={{ width: `${metric.progress.value > 0 ? Math.max(metric.progress.value, 1.5) : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{metric.supportingText}</p>
            </div>
          ) : (
            metric.supportingText && (
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {metric.supportingText}
              </p>
            )
          )}
        </div>
      ))}
    </section>
  );
}
