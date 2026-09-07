"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // console.error достаточно, чтобы не терять сигнал в dev/проде.
    console.error("[ReviewPage] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark px-4 text-center">
      <AlertTriangle className="w-8 h-8 text-red-500" />
      <div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">
          Something went wrong loading this review
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
          This has been logged. You can try again or go back to start a new
          review.
        </p>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <RotateCcw size={14} />
          Try again
        </button>
        <Link
          href="/review/new"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
        >
          <ArrowLeft size={14} />
          Start a new review
        </Link>
      </div>
    </div>
  );
}
