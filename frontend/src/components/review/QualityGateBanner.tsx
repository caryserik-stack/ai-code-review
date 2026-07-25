"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

type IssueType = "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";

type ReviewItem = {
  type: IssueType;
  severity: string | null;
};

type QualityGateBannerProps = {
  items: ReviewItem[];
};

const SEVERITY_CONFIG: {
  type: IssueType;
  label: string;
  Icon: typeof AlertCircle;
  iconColor: string;
  dotColor: string;
}[] = [
  {
    type: "ERROR",
    label: "Errors",
    Icon: AlertCircle,
    iconColor: "text-red-500 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  {
    type: "SECURITY",
    label: "Security",
    Icon: ShieldAlert,
    iconColor: "text-purple-500 dark:text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    type: "WARNING",
    label: "Warnings",
    Icon: AlertTriangle,
    iconColor: "text-yellow-500 dark:text-yellow-400",
    dotColor: "bg-yellow-500",
  },
  {
    type: "SUGGESTION",
    label: "Suggestions",
    Icon: Lightbulb,
    iconColor: "text-blue-500 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
];

const BLOCKING_TYPES: ReadonlySet<IssueType> = new Set(["ERROR", "SECURITY"]);

export function QualityGateBanner({ items }: QualityGateBannerProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark flex items-center gap-3">
        <CheckCircle2
          className="w-7 h-7 text-green-500 dark:text-green-400 shrink-0"
          strokeWidth={2}
        />
        <div>
          <p className="font-semibold text-green-700 dark:text-green-400">
            Quality Gate: Passed
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No issues found
          </p>
        </div>
      </div>
    );
  }

  const counts = SEVERITY_CONFIG.reduce(
    (acc, { type }) => {
      acc[type] = items.filter((item) => item.type === type).length;
      return acc;
    },
    {} as Record<IssueType, number>,
  );

  const hasBlockingIssues = items.some((item) => BLOCKING_TYPES.has(item.type));
  const total = items.length;

  const criticalSecurityCount = items.filter(
    (item) =>
      item.type === "SECURITY" &&
      (item.severity === "CRITICAL" || item.severity === "HIGH"),
  ).length;

  return (
    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
      <div className="flex items-center gap-3 mb-3">
        {hasBlockingIssues ? (
          <XCircle
            className="w-7 h-7 text-red-500 dark:text-red-400 shrink-0"
            strokeWidth={2}
          />
        ) : (
          <CheckCircle2
            className="w-7 h-7 text-green-500 dark:text-green-400 shrink-0"
            strokeWidth={2}
          />
        )}
        <div>
          <p
            className={`font-semibold ${
              hasBlockingIssues
                ? "text-red-700 dark:text-red-400"
                : "text-green-700 dark:text-green-400"
            }`}
          >
            Quality Gate: {hasBlockingIssues ? "Failed" : "Passed"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hasBlockingIssues
              ? "Blocked by critical issues below"
              : "No blocking issues found"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3">
        {SEVERITY_CONFIG.filter(({ type }) => counts[type] > 0).map(
          ({ type, label, Icon, iconColor }) => (
            <span
              key={type}
              className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
            >
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2.25} />
              {counts[type]} {label}
            </span>
          ),
        )}
      </div>

      {criticalSecurityCount > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
          {criticalSecurityCount} high/critical severity security{" "}
          {criticalSecurityCount === 1 ? "issue" : "issues"} require immediate
          attention
        </p>
      )}

      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-surface-dark">
        {SEVERITY_CONFIG.filter(({ type }) => counts[type] > 0).map(
          ({ type, dotColor }) => (
            <div
              key={type}
              className={dotColor}
              style={{ width: `${(counts[type] / total) * 100}%` }}
            />
          ),
        )}
      </div>
    </div>
  );
}
