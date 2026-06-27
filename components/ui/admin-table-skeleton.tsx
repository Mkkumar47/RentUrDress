type AdminTableSkeletonProps = {
  rows?: number;
};

export function AdminTableSkeleton({ rows = 6 }: AdminTableSkeletonProps) {
  return (
    <table className="w-full min-w-[840px] text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 text-slate-300">
          {["Name", "Role", "City", "Listed", "Active", "Transactions"].map((col) => (
            <th key={col} className="px-2 py-2 font-medium">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={`admin-skeleton-row-${index}`} className="border-b border-white/8">
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-3 w-36 rounded bg-slate-700/70" />
              <div className="skeleton-shimmer mt-2 h-2.5 w-48 rounded bg-slate-700/55" />
            </td>
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-6 w-16 rounded-full bg-slate-700/60" />
            </td>
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-3 w-20 rounded bg-slate-700/65" />
            </td>
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-3 w-10 rounded bg-slate-700/65" />
            </td>
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-3 w-10 rounded bg-slate-700/65" />
            </td>
            <td className="px-2 py-3">
              <div className="skeleton-shimmer h-3 w-24 rounded bg-slate-700/65" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
