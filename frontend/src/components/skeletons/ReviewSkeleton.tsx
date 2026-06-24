import { Skeleton } from "@/components/Skeleton";

export function ReviewSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Score карточка */}
      <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border-dark space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>

      {/* Issues */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex gap-3"
            style={{ opacity: 1 - (i - 1) * 0.2 }}
          >
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>

      {/* Source code */}
      <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-3"
              style={{ width: `${85 - i * 8}%`, opacity: 1 - (i - 1) * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
