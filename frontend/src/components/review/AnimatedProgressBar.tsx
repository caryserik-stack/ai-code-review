// frontend/src/components/review/AnimatedProgressBar.tsx
"use client";

type Props = {
  value: number; // 0-100
  label?: string;
  colorFrom?: string; // напр. "from-blue-500"
  colorTo?: string; // напр. "to-cyan-400"
  height?: number; // px
  showShimmer?: boolean; // включить shimmer, например пока идёт анализ
};

export function AnimatedProgressBar({
  value,
  label,
  colorFrom = "from-blue-500",
  colorTo = "to-cyan-400",
  height = 10,
  showShimmer = false,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {label}
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {clamped}%
          </span>
        </div>
      )}

      <div
        className="relative w-full rounded-full bg-gray-100 dark:bg-surface-dark overflow-hidden"
        style={{ height }}
      >
        <div
          className={`relative h-full rounded-full bg-gradient-to-r ${colorFrom} ${colorTo} transition-[width] duration-700 ease-out overflow-hidden`}
          style={{
            width: `${clamped}%`,
            animation: "progress-grow 0.8s ease-out",
          }}
        >
          {showShimmer && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{
                animation: "progress-shimmer 1.6s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
