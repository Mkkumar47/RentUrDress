export function DressGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2" role="status" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`dress-skeleton-${index}`}
          className="glass-surface overflow-hidden rounded-2xl border border-white/15"
        >
          <div className="skeleton-shimmer h-64 bg-slate-800/80" />
          <div className="space-y-3 p-6">
            <div className="skeleton-shimmer h-4 w-2/3 rounded bg-slate-700/80" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded bg-slate-700/70" />
            <div className="skeleton-shimmer h-3 w-full rounded bg-slate-700/60" />
            <div className="skeleton-shimmer h-3 w-5/6 rounded bg-slate-700/60" />
            <div className="skeleton-shimmer mt-2 h-9 w-40 rounded-xl bg-slate-700/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
