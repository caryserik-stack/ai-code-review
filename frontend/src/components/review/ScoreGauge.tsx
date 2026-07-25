"use client";

import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

type ScoreGaugeProps = {
  score: number; // 0-100
  size?: number; // px, по умолчанию 96
};

// Пороги согласованы с getScoreColor() на странице ревью —
// один источник истины для "что считается хорошим score" по всему приложению.
const getScoreTier = (score: number) => {
  if (score >= 80) {
    return {
      color: "#22c55e",
      trackColor: "rgba(34, 197, 94, 0.15)",
      label: "Good",
    };
  }
  if (score >= 60) {
    return {
      color: "#eab308",
      trackColor: "rgba(234, 179, 8, 0.15)",
      label: "Fair",
    };
  }
  return {
    color: "#ef4444",
    trackColor: "rgba(239, 68, 68, 0.15)",
    label: "Needs work",
  };
};

export function ScoreGauge({ score, size = 96 }: ScoreGaugeProps) {
  const tier = getScoreTier(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: size, height: size }}>
        <CircularProgressbarWithChildren
          value={score}
          maxValue={100}
          strokeWidth={9}
          styles={buildStyles({
            pathColor: tier.color,
            trailColor: tier.trackColor,
            pathTransitionDuration: 0.6,
          })}
        >
          <span
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{ fontSize: size * 0.26 }}
          >
            {score}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5">
            /100
          </span>
        </CircularProgressbarWithChildren>
      </div>
      <span className="text-xs font-medium" style={{ color: tier.color }}>
        {tier.label}
      </span>
    </div>
  );
}
