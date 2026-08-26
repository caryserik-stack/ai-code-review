"use client";

import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { reviewApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { OWASP_LABELS, SEVERITY_STYLES } from "@/lib/owasp";

type IssueType = "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";

type ReviewItem = {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  line: number | null;
  originalCode: string | null;
  suggestedCode: string | null;
  resolved: boolean;
  owaspCategory: string | null;
  severity: string | null;
};

type IssueStyle = {
  border: string;
  badge: string;
  Icon: typeof AlertCircle;
  iconColor: string;
};

const ITEM_STYLES: Record<IssueType, IssueStyle> = {
  ERROR: {
    border: "border-l-red-500",
    badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    Icon: AlertCircle,
    iconColor: "text-red-500 dark:text-red-400",
  },
  WARNING: {
    border: "border-l-yellow-500",
    badge:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    Icon: AlertTriangle,
    iconColor: "text-yellow-500 dark:text-yellow-400",
  },
  SECURITY: {
    border: "border-l-purple-500",
    badge:
      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    Icon: ShieldAlert,
    iconColor: "text-purple-500 dark:text-purple-400",
  },
  SUGGESTION: {
    border: "border-l-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    Icon: Lightbulb,
    iconColor: "text-blue-500 dark:text-blue-400",
  },
};

const DEFAULT_OPEN_TYPES: ReadonlySet<IssueType> = new Set([
  "ERROR",
  "SECURITY",
]);

const VIRTUALIZE_THRESHOLD = 15;
const VIRTUAL_LIST_HEIGHT = 640;
const ESTIMATED_ITEM_HEIGHT = 88;

// --------------------------------------------
// DIFFBLOCK
type DiffBlockProps = {
  originalCode: string | null;
  suggestedCode: string;
};

function DiffBlock({ originalCode, suggestedCode }: DiffBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(suggestedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-border-dark font-mono text-xs">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy suggested code"
        className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded px-1.5 py-1 text-[10px] shadow-sm transition-colors"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copied!" : "Copy"}
      </button>

      {originalCode && (
        <div className="flex bg-red-50 dark:bg-red-950/40 px-2 py-1.5 pr-16">
          <span className="select-none text-red-500 dark:text-red-400 mr-2 shrink-0">
            −
          </span>
          <code className="text-red-700 dark:text-red-300 break-words">
            {originalCode}
          </code>
        </div>
      )}
      <div className="flex bg-green-50 dark:bg-green-950/40 px-2 py-1.5 pr-16">
        <span className="select-none text-green-600 dark:text-green-400 mr-2 shrink-0">
          +
        </span>
        <code className="text-green-700 dark:text-green-300 break-words">
          {suggestedCode}
        </code>
      </div>
    </div>
  );
}

//---------------------------------------------------------------
//ISSUEACCORDIONITEM

type IssueAccordionItemProps = {
  item: ReviewItem;
  onLineClick?: (line: number) => void;
  onResolvedChange: (id: string, resolved: boolean) => void;
};

function IssueAccordionItem({
  item,
  onLineClick,
  onResolvedChange,
}: IssueAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(
    !item.resolved && DEFAULT_OPEN_TYPES.has(item.type),
  );
  const [isSaving, setIsSaving] = useState(false);
  const style = ITEM_STYLES[item.type];

  const handleResolveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const nextResolved = !item.resolved;
    onResolvedChange(item.id, nextResolved);
    if (nextResolved) setIsOpen(false);

    setIsSaving(true);
    try {
      await reviewApi.toggleItemResolved(item.id, nextResolved);
    } catch {
      onResolvedChange(item.id, !nextResolved);
      toast.error("Failed to update issue status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-l-4 ${style.border} bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark overflow-hidden transition-opacity ${
        item.resolved ? "opacity-50" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((v) => !v);
          }
        }}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-surface-dark/50 transition-colors cursor-pointer"
      >
        <button
          type="button"
          onClick={handleResolveToggle}
          disabled={isSaving}
          aria-label={item.resolved ? "Mark as unresolved" : "Mark as resolved"}
          className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            item.resolved
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-green-500"
          } ${isSaving ? "opacity-50" : ""}`}
        >
          {item.resolved && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </button>

        <style.Icon
          className={`shrink-0 w-4 h-4 mt-0.5 ${style.iconColor}`}
          strokeWidth={2.25}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}
            >
              {item.type}
            </span>

            {item.owaspCategory && OWASP_LABELS[item.owaspCategory] && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300"
                title={OWASP_LABELS[item.owaspCategory].label}
              >
                OWASP {OWASP_LABELS[item.owaspCategory].code}
              </span>
            )}

            {item.severity && SEVERITY_STYLES[item.severity] && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[item.severity].badge}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLES[item.severity].dot}`}
                />
                {SEVERITY_STYLES[item.severity].label}
              </span>
            )}

            {item.line && (
              <span
                role={onLineClick ? "button" : undefined}
                onClick={(e) => {
                  if (!item.line || !onLineClick) return;
                  e.stopPropagation();
                  onLineClick(item.line);
                }}
                className={`text-xs text-gray-400 dark:text-gray-500 ${
                  onLineClick
                    ? "hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    : ""
                }`}
              >
                Line {item.line}
              </span>
            )}
          </div>
          <p
            className={`font-medium text-sm truncate ${
              item.resolved
                ? "text-gray-400 dark:text-gray-500 line-through"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {item.title}
          </p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[2.75rem]">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {item.description}
              </p>

              {item.owaspCategory && OWASP_LABELS[item.owaspCategory] && (
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1.5">
                  {OWASP_LABELS[item.owaspCategory].label} — OWASP Top 10:2021
                </p>
              )}

              {item.suggestedCode && (
                <DiffBlock
                  originalCode={item.originalCode}
                  suggestedCode={item.suggestedCode}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//-----------------------------------------------------------------------------
//VIRTUALIZEDISSUE

// Виртуализированный список — включается только при большом количестве
// issues. Каждый item измеряется динамически (measureElement), т.к.
// раскрытые карточки с diff-блоком заметно выше свёрнутых — статичная
// estimateSize тут была бы неточной без re-measure.
type VirtualizedIssueListProps = {
  items: ReviewItem[];
  onLineClick?: (line: number) => void;
  onResolvedChange: (id: string, resolved: boolean) => void;
};

function VirtualizedIssueList({
  items,
  onLineClick,
  onResolvedChange,
}: VirtualizedIssueListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5,
    gap: 12, // соответствует space-y-3 (0.75rem = 12px) в обычном режиме
  });

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto pr-1 -mr-1"
      style={{ height: VIRTUAL_LIST_HEIGHT }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <IssueAccordionItem
                item={item}
                onLineClick={onLineClick}
                onResolvedChange={onResolvedChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

//---------------------------------------------------------------------------------------------
//ISSUEACCORDION

type IssueAccordionProps = {
  items: ReviewItem[];
  onLineClick?: (line: number) => void;
  onItemsChange: (items: ReviewItem[]) => void;
};

export function IssueAccordion({
  items,
  onLineClick,
  onItemsChange,
}: IssueAccordionProps) {
  const resolvedCount = items.filter((i) => i.resolved).length;

  const handleResolvedChange = (id: string, resolved: boolean) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, resolved } : item)),
    );
  };

  const shouldVirtualize = items.length > VIRTUALIZE_THRESHOLD;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Issues ({items.length})
        </h2>
        {resolvedCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {resolvedCount} of {items.length} resolved
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark"
        >
          No issues match this filter
        </motion.div>
      ) : shouldVirtualize ? (
        <VirtualizedIssueList
          items={items}
          onLineClick={onLineClick}
          onResolvedChange={handleResolvedChange}
        />
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <IssueAccordionItem
                  item={item}
                  onLineClick={onLineClick}
                  onResolvedChange={handleResolvedChange}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

//-----------------------------------------------------------------------------
