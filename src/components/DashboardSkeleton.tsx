export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat dasbor keuangan" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-4 w-36 rounded-md" />
          <div className="skeleton-shimmer h-8 w-56 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-11 w-32 rounded-lg" />
          <div className="skeleton-shimmer h-11 w-32 rounded-lg" />
        </div>
      </div>

      {/* 4 Summary Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <div className="skeleton-shimmer h-4 w-28 rounded-md" />
              <div className="skeleton-shimmer size-8 rounded-lg" />
            </div>
            <div className="skeleton-shimmer mt-3 h-8 w-36 rounded-md" />
            <div className="skeleton-shimmer mt-3 h-3 w-44 rounded-md" />
          </div>
        ))}
      </div>

      {/* 2 Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
            <div className="space-y-1.5">
              <div className="skeleton-shimmer h-5 w-40 rounded-md" />
              <div className="skeleton-shimmer h-3.5 w-56 rounded-md" />
            </div>
          </div>
          <div className="mt-6 flex h-52 items-end justify-between gap-3 px-2">
            {[40, 75, 55, 90, 65].map((height, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="skeleton-shimmer w-full max-w-[48px] rounded-t-md"
                  style={{ height: `${height}%` }}
                />
                <div className="skeleton-shimmer h-3 w-8 rounded-xs" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
            <div className="space-y-1.5">
              <div className="skeleton-shimmer h-5 w-44 rounded-md" />
              <div className="skeleton-shimmer h-3.5 w-52 rounded-md" />
            </div>
          </div>
          <div className="mt-6 flex h-52 items-center justify-center">
            <div className="skeleton-shimmer size-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Recent transactions list skeleton */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
          <div className="space-y-1.5">
            <div className="skeleton-shimmer h-5 w-48 rounded-md" />
            <div className="skeleton-shimmer h-3.5 w-64 rounded-md" />
          </div>
        </div>
        <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-900">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className="skeleton-shimmer size-10 rounded-lg" />
                <div className="space-y-1.5">
                  <div className="skeleton-shimmer h-4 w-32 rounded-md" />
                  <div className="skeleton-shimmer h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="skeleton-shimmer h-5 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
