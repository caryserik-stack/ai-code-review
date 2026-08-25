// frontend/src/components/review/ReviewStatsGrid.tsx
"use client";

import { FileCode2, Clock, ShieldAlert, Gauge, Sparkles } from "lucide-react";

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string; // tailwind color class, напр. "text-blue-500"
  glow: string; // напр. "shadow-blue-500/10"
};

function StatCard({ icon: Icon, label, value, accent, glow }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark p-4 shadow-sm hover:shadow-md ${glow} transition-shadow`}
    >
      {/* декоративное свечение в углу */}
      <div
        className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 ${accent.replace(
          "text-",
          "bg-",
        )}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {label}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
        </div>
        <div
          className={`p-2 rounded-lg bg-gray-50 dark:bg-surface-dark ${accent}`}
        >
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

type Props = {
  linesAnalyzed: number;
  durationSeconds: number;
  qualityScore: number; // 0-100
  criticalCount: number;
  maintainabilityIndex: number; // 0-100
};

export function ReviewStatsGrid({
  linesAnalyzed,
  durationSeconds,
  qualityScore,
  criticalCount,
  maintainabilityIndex,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        icon={FileCode2}
        label="Lines analyzed"
        value={linesAnalyzed.toLocaleString()}
        accent="text-blue-500"
        glow="hover:shadow-blue-500/10"
      />
      <StatCard
        icon={Clock}
        label="Scan time"
        value={`${durationSeconds.toFixed(1)}s`}
        accent="text-cyan-500"
        glow="hover:shadow-cyan-500/10"
      />
      <StatCard
        icon={Gauge}
        label="Code quality"
        value={`${qualityScore}/100`}
        accent={
          qualityScore >= 80
            ? "text-green-500"
            : qualityScore >= 60
              ? "text-yellow-500"
              : "text-red-500"
        }
        glow="hover:shadow-green-500/10"
      />
      <StatCard
        icon={ShieldAlert}
        label="Critical issues"
        value={criticalCount}
        accent={criticalCount > 0 ? "text-red-500" : "text-green-500"}
        glow="hover:shadow-red-500/10"
      />
      <StatCard
        icon={Sparkles}
        label="Maintainability"
        value={`${maintainabilityIndex}/100`}
        accent="text-purple-500"
        glow="hover:shadow-purple-500/10"
      />
    </div>
  );
}
