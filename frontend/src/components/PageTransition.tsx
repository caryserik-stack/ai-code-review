"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

// Псевдо-роуты модалок/оверлеев — переход в них и обратно
// не должен считаться "настоящей" навигацией и ремаунтить фон.
const OVERLAY_PREFIXES = ["/settings"];

function isOverlayPath(pathname: string) {
  return OVERLAY_PREFIXES.some((p) => pathname.startsWith(p));
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastRealPathRef = useRef(pathname);

  if (!isOverlayPath(pathname)) {
    lastRealPathRef.current = pathname;
  }

  const key = isOverlayPath(pathname) ? lastRealPathRef.current : pathname;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        style={{ position: "relative", width: "100%", minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
