"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, LogOut } from "lucide-react";

interface UserShape {
  name?: string | null;
  email?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  user: UserShape | null | undefined;
  onOpenSettings: () => void;
  onLogout: () => void;
}

// Меню рендерится через портал в document.body, а не внутри сайдбара —
// родительский motion.div в AppLayout имеет overflow-hidden (нужен для
// анимации ширины), и если рендерить меню внутри него, оно будет
// обрезано по границе панели. Портал решает это раз и навсегда.
export function AccountMenu({
  open,
  onClose,
  anchorRef,
  user,
  onOpenSettings,
  onLogout,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; bottom: number } | null>(
    null,
  );

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 8,
    });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && coords && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: coords.left,
            bottom: coords.bottom,
            transformOrigin: "bottom left",
          }}
          className="z-50 w-60 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-lg py-1"
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-border-dark">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name ?? "No name"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
