import { Skeleton } from "@/components/Skeleton";

export function SidebarSkeleton() {
  return (
    <div className="px-2 space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton
          key={i}
          className="h-8 w-full rounded-lg"
          style={{ opacity: 1 - (i - 1) * 0.15 }}
        />
      ))}
    </div>
  );
}