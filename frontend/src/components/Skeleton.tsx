"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`rounded-md bg-blue-100 dark:bg-blue-950 ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background:
          resolvedTheme === "dark"
            ? "linear-gradient(90deg, #1e2a3a 25%, #2a3f5f 50%, #1e2a3a 75%)"
            : "linear-gradient(90deg, #EFF6FF 25%, #BFDBFE 50%, #EFF6FF 75%)",
        backgroundSize: "800px 100%",
        animation: "skeleton-shimmer 1.8s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
