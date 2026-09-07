"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LEVEL_STYLES: Record<string, string> = {
  MIDDLE: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  SENIOR:
    "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
  JUNIOR: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
};

const getLevelStyle = (level: string) =>
  LEVEL_STYLES[level.toUpperCase()] ?? LEVEL_STYLES.JUNIOR;

type Props = {
  language: string;
  reviewerLevel: string;
  createdAt: string;
  reviewId: string;
  exportOpen: boolean;
  onExportOpenChange: (open: boolean) => void;
  onDownloadMarkdown: () => void;
  downloading: boolean;
  onAskAI: () => void;
};

export function ReviewPageHeader({
  language,
  reviewerLevel,
  createdAt,
  reviewId,
  exportOpen,
  onExportOpenChange,
  onDownloadMarkdown,
  downloading,
  onAskAI,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href="/review/new"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 transition-colors"
          aria-label="Back to new review"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {language} review
        </h1>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${getLevelStyle(reviewerLevel)}`}
        >
          {reviewerLevel.toLowerCase()}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAskAI}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
        >
          <MessageSquare size={14} />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        <DropdownMenu open={exportOpen} onOpenChange={onExportOpenChange}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[180px] bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark"
          >
            <DropdownMenuItem
              onClick={onDownloadMarkdown}
              disabled={downloading}
              className="gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <FileText size={14} />
              {downloading ? "Downloading..." : "Markdown (.md)"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                href={`/review/${reviewId}/report`}
                onClick={() => onExportOpenChange(false)}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <Download size={14} />
                PDF (Print)
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
