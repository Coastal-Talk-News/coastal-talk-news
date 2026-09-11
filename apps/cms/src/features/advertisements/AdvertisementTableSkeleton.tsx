import { Skeleton } from '@coastal-talk-news/ui/skeleton';

export function AdvertisementTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-hairline divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-3.5 w-4" />
          <Skeleton className="h-10 w-16 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
