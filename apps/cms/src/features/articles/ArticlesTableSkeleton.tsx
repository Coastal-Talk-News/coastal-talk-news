import { Skeleton } from '@coastal-talk-news/ui/skeleton';

export function ArticlesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-hairline divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="size-14 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
