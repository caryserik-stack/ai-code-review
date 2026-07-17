"use client";

type IssueType = "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";

type ReviewItem = {
  type: IssueType;
  severity: string | null;
};

type QualityGateBannerProps = {
  items: ReviewItem[];
};

// Порядок в UI: сначала блокирующие типы, потом второстепенные —
// глаз сразу видит самое важное первым
const SEVERITY_CONFIG: {
  type: IssueType;
  label: string;
  icon: string;
  dotColor: string;
}[] = [
  { type: "ERROR", label: "Errors", icon: "🔴", dotColor: "bg-red-500" },
  {
    type: "SECURITY",
    label: "Security",
    icon: "🔒",
    dotColor: "bg-purple-500",
  },
  { type: "WARNING", label: "Warnings", icon: "🟡", dotColor: "bg-yellow-500" },
  {
    type: "SUGGESTION",
    label: "Suggestions",
    icon: "💡",
    dotColor: "bg-blue-500",
  },
];

// Типы, наличие которых блокирует Quality Gate.
// Тот же принцип, что и в аккордеоне (ERROR/SECURITY = требует внимания сразу) —
// вердикт согласован с остальным UI, а не придумывает свою логику.
const BLOCKING_TYPES: ReadonlySet<IssueType> = new Set(["ERROR", "SECURITY"]);

export function QualityGateBanner({ items }: QualityGateBannerProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark flex items-center gap-3">
        <span className="text-2xl">✅</span>
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

  // Считаем количество issues на каждый тип —
  // чистая функция от уже существующих данных, без обращения к AI заново
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
      {/* Вердикт */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{hasBlockingIssues ? "❌" : "✅"}</span>
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

      {/* Breakdown по типам */}
      <div className="flex flex-wrap gap-3 mb-3">
        {SEVERITY_CONFIG.filter(({ type }) => counts[type] > 0).map(
          ({ type, label, icon }) => (
            <span
              key={type}
              className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1"
            >
              {icon} {counts[type]} {label}
            </span>
          ),
        )}
      </div>

      {criticalSecurityCount > 0 && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-3">
          ⚠ {criticalSecurityCount} high/critical severity security{" "}
          {criticalSecurityCount === 1 ? "issue" : "issues"} require immediate
          attention
        </p>
      )}

      {/* Пропорциональная полоска — визуально показывает состав issues одним взглядом */}
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
