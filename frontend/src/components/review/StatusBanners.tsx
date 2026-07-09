"use client";

import Link from "next/link";

type RateLimitBannerProps = {
  remaining: number;
  limit: number;
};

/**
 * Показывает статус лимита запросов. Возвращает null, если лимит не включён
 * (limit === 0 значит фича лимитов выключена для этого юзера/плана) —
 * так родителю не нужно самому решать, рендерить банннер или нет.
 */
export function RateLimitBanner({ remaining, limit }: RateLimitBannerProps) {
  if (limit <= 0) return null;

  const isExhausted = remaining <= 0;
  const isLow = remaining <= 2 && remaining > 0;

  return (
    <div
      className={`flex items-center justify-between text-xs px-1 ${
        remaining <= 2
          ? "text-red-500 dark:text-red-400"
          : remaining <= 5
            ? "text-yellow-500 dark:text-yellow-400"
            : "text-gray-400 dark:text-gray-500"
      }`}
    >
      <span>
        {isExhausted
          ? "⛔ Review limit reached for this hour"
          : `${remaining} of ${limit} reviews remaining this hour`}
      </span>
      {isLow && <span>⚠️</span>}
    </div>
  );
}

type EmailVerificationBannerProps = {
  show: boolean;
};

export function EmailVerificationBanner({
  show,
}: EmailVerificationBannerProps) {
  if (!show) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-sm flex items-center justify-between">
      <span>Please verify your email to create reviews</span>
      <Link href="/verify-email?from=review" className="underline font-medium">
        Verify now
      </Link>
    </div>
  );
}
