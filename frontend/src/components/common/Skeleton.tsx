interface SkeletonProps {
  className?: string;
}

/** Shimmering placeholder block. Compose with width/height utility classes via className. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

/** Preset matching HeroBalance's dimensions, so the loading state doesn't jump the layout. */
export function HeroBalanceSkeleton() {
  return (
    <div className="card">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-11 w-56" />
      <Skeleton className="mt-3 h-4 w-32" />
      <Skeleton className="mt-6 h-40 w-full rounded-xl" />
    </div>
  );
}

/** Preset matching ActivityFeed rows. */
export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Small preset for compact metric rows / cards. */
export function MetricSkeleton() {
  return (
    <div className="card flex items-center gap-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
