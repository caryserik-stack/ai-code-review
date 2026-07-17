"use client";

import { useState } from "react";
import { FileUp, ListChecks } from "lucide-react";
import { InlineSelect } from "./InlineSelect";
import { TeamRulesPanel } from "./TeamRulesPanel";

type CodeToolbarProps = {
  language: string;
  onLanguageChange: (lang: string) => void;
  languageOptions: readonly string[];

  reviewerLevel: string;
  onReviewerLevelChange: (level: string) => void;
  reviewerLevelOptions: readonly string[];

  onChooseFile: () => void;
};

/**
 * Ряд контролов над редактором кода: язык, уровень ревьюера, выбор файла.
 * На десктопе уровень ревьюера — сегментированный контрол,
 * на мобильных — dropdown (как язык), потому что три подписанных кнопки
 * не помещаются на узком экране.
 */
export function CodeToolbar({
  language,
  onLanguageChange,
  languageOptions,
  reviewerLevel,
  onReviewerLevelChange,
  reviewerLevelOptions,
  onChooseFile,
}: CodeToolbarProps) {
  // Только один dropdown может быть открыт одновременно
  const [openPicker, setOpenPicker] = useState<"language" | "level" | null>(
    null,
  );
  const [rulesPanelOpen, setRulesPanelOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <label
        htmlFor="code-input"
        className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
      >
        Your Code
      </label>

      {/* justify-end + все элементы в одном ряду у правого края —
          это важно и для dropdown: InlineSelect позиционируется через right-0,
          что корректно раскрывается влево только когда кнопка сама у правого края */}
      <div className="flex items-center gap-1.5 shrink-0">
        <InlineSelect
          value={language}
          options={languageOptions}
          onChange={onLanguageChange}
          isOpen={openPicker === "language"}
          onOpenChange={(open) => setOpenPicker(open ? "language" : null)}
        />

        {/* Десктоп: сегментированный контрол */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-surface-dark rounded-lg p-0.5">
          {reviewerLevelOptions.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onReviewerLevelChange(level)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                reviewerLevel === level
                  ? "bg-white dark:bg-card-dark text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Мобильный: dropdown вместо трёх кнопок */}
        <InlineSelect
          className="sm:hidden"
          value={reviewerLevel}
          options={reviewerLevelOptions}
          onChange={onReviewerLevelChange}
          isOpen={openPicker === "level"}
          onOpenChange={(open) => setOpenPicker(open ? "level" : null)}
        />

        <button
          type="button"
          onClick={onChooseFile}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-1"
          title="Upload a file"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span className="hidden md:inline">or choose a file</span>
        </button>

        <button
          type="button"
          onClick={() => setRulesPanelOpen(true)}
          className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-surface-dark text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ListChecks size={13} />
          Rules
        </button>
      </div>

      <TeamRulesPanel open={rulesPanelOpen} onClose={() => setRulesPanelOpen(false)} />
    </div>
  );
}
