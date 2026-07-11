"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { reviewApi } from "@/lib/apiClient";
import { toast } from "sonner";

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

const DEFAULT_OPEN_TYPES: ReadonlySet<IssueType> = new Set([
  "ERROR",
  "SECURITY",
]);

// Показывает исправление тремя способами в зависимости от того,
// что реально есть в данных:
// 1. Есть originalCode И suggestedCode → полноценный diff (было/стало)
// 2. Есть только suggestedCode → просто "что добавить", без diff
// 3. Оба пусты → компонент не рендерится вообще (вызывающий код это проверяет)
type DiffBlockProps = {
  originalCode: string | null;
  suggestedCode: string;
};

function DiffBlock({ originalCode, suggestedCode }: DiffBlockProps) {
  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-border-dark font-mono text-xs">
      {originalCode && (
        <div className="flex bg-red-50 dark:bg-red-950/40 px-2 py-1.5">
          <span className="select-none text-red-500 dark:text-red-400 mr-2 shrink-0">
            −
          </span>
          <code className="text-red-700 dark:text-red-300 break-words">
            {originalCode}
          </code>
        </div>
      )}
      <div className="flex bg-green-50 dark:bg-green-950/40 px-2 py-1.5">
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
  // Если issue уже resolved (например, при загрузке страницы) — сразу свёрнут,
  // независимо от типа. Иначе — обычное правило по типу.
  const [isOpen, setIsOpen] = useState(
    !item.resolved && DEFAULT_OPEN_TYPES.has(item.type),
  );
  const [isSaving, setIsSaving] = useState(false);
  const style = ITEM_STYLES[item.type];

  const handleResolveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // не даём клику по чекбоксу сворачивать/разворачивать карточку

    const nextResolved = !item.resolved;

    // Оптимистичное обновление — сразу обновляем UI (родитель хранит items),
    // не дожидаясь ответа сервера. Если запрос упадёт — откатываем.
    onResolvedChange(item.id, nextResolved);
    if (nextResolved) setIsOpen(false); // автосворачивание при отметке resolved

    setIsSaving(true);
    try {
      await reviewApi.toggleItemResolved(item.id, nextResolved);
    } catch (err) {
      // откат при ошибке сети/сервера
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
        {/* Чекбокс resolved — отдельная кликабельная зона слева от иконки типа */}
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

        <span className="shrink-0">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}
            >
              {item.type}
            </span>
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
  if (items.length === 0) return null;

  const resolvedCount = items.filter((i) => i.resolved).length;

  // Оптимистично обновляем локальный список items у родителя —
  // родитель (страница) хранит review.items в своём стейте
  const handleResolvedChange = (id: string, resolved: boolean) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, resolved } : item)),
    );
  };

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
      <div className="space-y-3">
        {items.map((item) => (
          <IssueAccordionItem
            key={item.id}
            item={item}
            onLineClick={onLineClick}
            onResolvedChange={handleResolvedChange}
          />
        ))}
      </div>
    </div>
  );
}
