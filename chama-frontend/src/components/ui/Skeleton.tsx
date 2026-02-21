export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
