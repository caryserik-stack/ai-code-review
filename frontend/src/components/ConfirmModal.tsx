"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Delete",
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark">
        <DialogHeader>
          <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mb-2">
            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-border-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
