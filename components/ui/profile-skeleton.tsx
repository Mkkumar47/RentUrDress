import { DressGridSkeleton } from "@/components/ui/dress-grid-skeleton";
import { LoadingScene } from "@/components/ui/loading-scene";

function StatCardSkeleton() {
  return (
    <div className="glass-surface rounded-2xl border border-white/15 p-6">
      <div className="skeleton-shimmer h-3 w-28 rounded bg-slate-700/70" />
      <div className="skeleton-shimmer mt-4 h-8 w-20 rounded bg-slate-700/60" />
    </div>
  );
}

function OrderListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`order-skeleton-${index}`}
          className="glass-surface rounded-2xl border border-white/15 p-6"
        >
          <div className="skeleton-shimmer h-4 w-2/3 rounded bg-slate-700/70" />
          <div className="skeleton-shimmer mt-3 h-3 w-1/2 rounded bg-slate-700/60" />
          <div className="skeleton-shimmer mt-2 h-3 w-4/5 rounded bg-slate-700/55" />
          <div className="skeleton-shimmer mt-2 h-3 w-2/5 rounded bg-slate-700/55" />
        </div>
      ))}
    </div>
  );
}

function TransactionTableSkeleton() {
  return (
    <div className="glass-surface rounded-2xl border border-white/15 p-6">
      <div className="skeleton-shimmer h-4 w-60 rounded bg-slate-700/75" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`transaction-skeleton-${index}`}
            className="grid grid-cols-4 gap-3"
          >
            <div className="skeleton-shimmer h-3 rounded bg-slate-700/60" />
            <div className="skeleton-shimmer h-3 rounded bg-slate-700/60" />
            <div className="skeleton-shimmer h-3 rounded bg-slate-700/60" />
            <div className="skeleton-shimmer h-3 rounded bg-slate-700/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <LoadingScene
        compact
        title="Loading profile"
        message="Syncing dresses, orders, and transactions..."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="glass-surface h-80 rounded-2xl border border-white/15 p-6">
        <div className="skeleton-shimmer h-full w-full rounded-xl bg-slate-800/70" />
      </div>

      <DressGridSkeleton />
      <OrderListSkeleton />
      <TransactionTableSkeleton />
    </div>
  );
}
