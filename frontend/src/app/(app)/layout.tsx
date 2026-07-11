"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useReviewsStore } from "@/store/reviewsStore";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { reviewApi } from "@/lib/apiClient";
import { PageTransition } from "@/components/PageTransition";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";

const RAIL_COLLAPSED_KEY = "sidebar-rail-collapsed";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, fetchMe } = useAuthStore();
  const { fetchReviews, removeReview } = useReviewsStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(RAIL_COLLAPSED_KEY);
    if (saved === "true") setRailCollapsed(true);
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setRailCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem(RAIL_COLLAPSED_KEY, String(next));
        return next;
      });
    }
  };

  useKeyboardShortcuts({
    onToggleSidebar: toggleSidebar,
    onCloseSidebar: () => setMobileOpen(false),
    onCloseModal: () => setConfirmId(null),
  });

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);
  useEffect(() => {
    if (!loading && user) fetchReviews();
  }, [user, loading, fetchReviews]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await reviewApi.delete(confirmId);
      removeReview(confirmId);
      toast.success("Review deleted");
      if (window.location.pathname === `/review/${confirmId}`) {
        router.push("/review/new");
      }
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const showRail = mounted && railCollapsed;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/*
        ВАЖНО: раньше здесь был AnimatePresence, переключающий между
        двумя РАЗНЫМИ компонентами (Sidebar и SidebarRail) — из-за этого
        иконки физически размонтировались и монтировались заново, отсюда
        и "исчезают, потом появляются". Теперь монтируется только ОДИН
        Sidebar, и его collapsed-проп просто переключает внутренние
        CSS-классы (текст гаснет через opacity, иконки остаются на месте
        и просто сдвигаются вместе с изменением реальной ширины обёртки).
        Иконки никогда не покидают DOM — отсюда плавный, непрерывный вид.
      */}
      <motion.div
        animate={{ width: showRail ? 64 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:block h-screen sticky top-0 shrink-0 overflow-hidden bg-white dark:bg-card-dark border-r border-gray-200 dark:border-border-dark"
      >
        <Sidebar
          collapsed={showRail}
          onCollapse={toggleSidebar}
          onExpand={toggleSidebar}
          onDelete={handleDelete}
        />
      </motion.div>

      {/* Мобильный drawer — без изменений */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-card-dark border-r border-gray-200 dark:border-border-dark transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onCollapse={() => setMobileOpen(false)}
          onDelete={handleDelete}
          onNavigate={() => setMobileOpen(false)}
          showCloseButton
        />
      </aside>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-card-dark border-b border-gray-200 dark:border-border-dark px-4 h-[57px] flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            AI Code Review
          </span>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>

      <ConfirmModal
        isOpen={!!confirmId}
        title="Delete review?"
        description="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />
    </div>
  );
}