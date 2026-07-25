"use client";

import { useEffect, useState } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import { teamProfileApi } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TeamRulesPanel({ open, onClose }: Props) {
  const [rules, setRules] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    teamProfileApi
      .get()
      .then((data) => setRules(data.profile.rules))
      .catch(() => toast.error("Failed to load review rules"))
      .finally(() => setLoaded(true));
  }, [open]);

  const saveRules = async (next: string[]) => {
    setSaving(true);
    try {
      await teamProfileApi.update({ rules: next });
      setRules(next);
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newRule.trim();
    if (!trimmed || rules.length >= 20) return;
    saveRules([...rules, trimmed]);
    setNewRule("");
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-96 bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark flex flex-col p-0"
      >
        <SheetHeader className="h-14 shrink-0 flex-row items-center px-4 border-b border-gray-100 dark:border-border-dark space-y-0">
          <ListChecks
            size={16}
            className="text-blue-600 dark:text-blue-400 mr-2"
          />
          <SheetTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Team review rules
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Describe team-specific conventions the AI should check for. These
            apply to every review you create.
          </p>

          {!loaded ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Loading...
            </p>
          ) : rules.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No rules yet — add one below.
            </p>
          ) : (
            <ol className="space-y-2">
              {rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 bg-gray-50 dark:bg-surface-dark rounded-lg px-3 py-2.5"
                >
                  <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                    {rule}
                  </span>
                  <button
                    onClick={() =>
                      saveRules(rules.filter((_, idx) => idx !== i))
                    }
                    disabled={saving}
                    className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-0.5"
                    aria-label="Remove rule"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        {rules.length < 20 && (
          <div className="shrink-0 p-4 border-t border-gray-100 dark:border-border-dark">
            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAdd())
                }
                placeholder="e.g. no any in TypeScript"
                maxLength={200}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleAdd}
                disabled={saving || !newRule.trim()}
                className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                aria-label="Add rule"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              {rules.length}/20 rules used
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
