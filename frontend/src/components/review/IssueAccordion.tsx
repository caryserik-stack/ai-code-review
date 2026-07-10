"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type IssueType = "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";

type ReviewItem = {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  line: number | null;
  suggestion: string | null;
};

type IssueStyle = {
  border: string;
  badge: string;
  icon: string;
};

const ITEM_STYLES: Record<IssueType, IssueStyle> = {
  ERROR: {
    border: "border-l-red-500",
    badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    icon: "🔴",
  },
  WARNING: {
    border: "border-l-yellow-500",
    badge:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    icon: "🟡",
  },
  SECURITY: {
    border: "border-l-purple-500",
    badge:
      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    icon: "🔒",
  },
  SUGGESTION: {
    border: "border-l-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    icon: "💡",
  },
};

// ERROR и SECURITY — сразу видимые проблемы, открываем по умолчанию.
// WARNING/SUGGESTION — второстепенное, юзер разворачивает по желанию.
const DEFAULT_OPEN_TYPES: ReadonlySet<IssueType> = new Set([
  "ERROR",
  "SECURITY",
]);

type IssueAccordionItemProps = {
  item: ReviewItem;
  onLineClick?: (line: number) => void;
};

function IssueAccordionItem({ item, onLineClick }: IssueAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(DEFAULT_OPEN_TYPES.has(item.type));
  const style = ITEM_STYLES[item.type];

  return (
    <div
      className={`rounded-xl border border-l-4 ${style.border} bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-surface-dark/50 transition-colors"
      >
        <span className="shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}
            >
              {item.type}
            </span>
            {item.line && (
              // stopPropagation — иначе клик по номеру строки также
              // триггернул бы onClick родительской кнопки (сворачивание карточки)
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
          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
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
      </button>

      {/* AnimatePresence + height: auto — framer сам меряет реальную высоту
          контента перед анимацией, никаких magic numbers как в CSS-хаках */}
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
              {item.suggestion && (
                <div className="mt-2 bg-gray-50 dark:bg-surface-dark rounded-lg p-2 border border-gray-200 dark:border-border-dark">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Suggestion:
                  </p>
                  <code className="text-xs text-gray-800 dark:text-gray-200 font-mono break-words">
                    {item.suggestion}
                  </code>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type IssueAccordionProps = {
  items: ReviewItem[];
  onLineClick?: (line: number) => void;
};

export function IssueAccordion({ items, onLineClick }: IssueAccordionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
        Issues ({items.length})
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <IssueAccordionItem
            key={item.id}
            item={item}
            onLineClick={onLineClick}
          />
        ))}
      </div>
    </div>
  );
}
