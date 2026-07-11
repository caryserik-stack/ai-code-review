"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Trash2, LogOut, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useReviewsStore } from "@/store/reviewsStore";
import { useState } from "react";
import { SidebarSkeleton } from "@/components/skeletons/SidebarSkeleton";

const DATE_GROUP_LABELS = [
  "Today",
  "Yesterday",
  "Previous 7 Days",
  "Previous 30 Days",
  "Older",
] as const;

function getDateGroupLabel(
  dateStr: string,
): (typeof DATE_GROUP_LABELS)[number] {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysDiff = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (daysDiff <= 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff <= 7) return "Previous 7 Days";
  if (daysDiff <= 30) return "Previous 30 Days";
  return "Older";
}

function groupReviewsByDate<
  T extends { id: string; language: string; createdAt: string },
>(
  reviews: T[],
  sortOrder: "newest" | "oldest",
): { label: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();
  for (const review of reviews) {
    const label = getDateGroupLabel(review.createdAt);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(review);
  }
  const orderedLabels =
    sortOrder === "newest"
      ? DATE_GROUP_LABELS
      : [...DATE_GROUP_LABELS].reverse();
  return orderedLabels
    .filter((label) => buckets.has(label))
    .map((label) => ({ label, items: buckets.get(label)! }));
}

interface Props {
  // true = узкий "рельс" с иконками (десктоп), false = полная панель
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNavigate?: () => void;
  showCloseButton?: boolean;
}

export function Sidebar({
  collapsed,
  onCollapse,
  onExpand,
  onDelete,
  onNavigate,
  showCloseButton,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuthStore();
  const { reviews, loadMore, loadingMore, hasMore, totalCount } =
    useReviewsStore();

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const filteredReviews = reviews
    .filter((r) => r.language.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });

  // Текст скрываем через opacity + delay, а не условным рендером —
  // так при схлопывании/раскрытии панели текст плавно растворяется/проявляется,
  // а не исчезает мгновенно. w-64 фиксирует ширину внутреннего контента,
  // родительский overflow-hidden в AppLayout обрезает лишнее при анимации.
  // Раньше здесь стоял delay-200: панель (motion.div, 200мс) успевала
  // полностью открыться, а текст ещё 200мс просто ждал и только потом
  // фейдился 150мс — визуально это читалось как "завис, потом дёрнулся".
  // delay-75 запускает fade почти сразу вместе с ростом ширины, так что
  // текст проявляется ПОКА панель ещё растёт, и оба заканчиваются почти
  // одновременно — одна плавная анимация, а не две последовательные.
  const textCls = `whitespace-nowrap transition-opacity duration-150 ${
    collapsed ? "opacity-0 pointer-events-none" : "opacity-100 delay-75"
  }`;

  // Фиксированный слот под иконку — 36x36, всегда в одном и том же месте
  // независимо от collapsed. Раньше строка переключала justify-center
  // (collapsed) на gap-3 justify-start (expanded), из-за чего иконка
  // физически прыгала по горизонтали. Теперь иконка всегда стоит в этом
  // слоте слева, а текст справа от неё просто гаснет/проявляется.
  const iconSlot = "flex items-center justify-center w-9 h-9 shrink-0";

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="h-[57px] px-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between shrink-0">
        <h1
          className={`min-w-0 ${textCls} flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 overflow-hidden`}
        >
          AI Code Review
        </h1>
        <div className="flex items-center gap-1 shrink-0">
          {!collapsed && <ThemeToggle />}
          <button
            onClick={
              collapsed ? onExpand : showCloseButton ? onNavigate : onCollapse
            }
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Close sidebar"}
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      </div>

      {/* New Review */}
      {user && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <Link
            href="/review/new"
            onClick={onNavigate}
            title={collapsed ? "New Review" : undefined}
            className="flex items-center w-full py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
          >
            <span className={iconSlot}>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-card-dark shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-border-dark">
                <Plus size={16} />
              </span>
            </span>
            <span className={textCls}>New Review</span>
          </Link>
          {totalCount > 0 && (
            <p
              className={`text-xs text-center text-gray-400 dark:text-gray-500 mt-1 ${textCls}`}
            >
              {totalCount} {totalCount === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>
      )}

      {/* Nav — в collapsed-режиме список не показываем совсем (не только текст) */}
      {!collapsed && (
        <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto px-2 py-1">
          {loading && <SidebarSkeleton />}

          {!loading && user && reviews.length > 0 && (
            <div className="mb-2 px-1 space-y-1.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reviews..."
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-1">
                {(["newest", "oldest"] as const).map((order) => (
                  <button
                    key={order}
                    onClick={() => setSortOrder(order)}
                    className={`flex-1 text-xs py-1 rounded-lg transition-colors capitalize ${
                      sortOrder === order
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark"
                    }`}
                  >
                    {order}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !user && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-8 px-4">
              Sign in to see your reviews
            </p>
          )}

          {!loading && user && reviews.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-8 px-4">
              No reviews yet
            </p>
          )}

          {!loading &&
            user &&
            reviews.length > 0 &&
            filteredReviews.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-8 px-4">
                No reviews found for &quot;{search}&quot;
              </p>
            )}

          {!loading &&
            user &&
            groupReviewsByDate(filteredReviews, sortOrder).map((group) => (
              <div key={group.label} className="mb-2">
                <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {group.label}
                </p>
                {group.items.map((review) => {
                  const isActive = pathname === `/review/${review.id}`;
                  return (
                    <Link
                      key={review.id}
                      href={`/review/${review.id}`}
                      onClick={onNavigate}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                        isActive
                          ? "bg-gray-100 dark:bg-surface-dark text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark"
                      }`}
                    >
                      <span className="truncate">{review.language}</span>
                      <button
                        onClick={(e) => onDelete(e, review.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity flex-shrink-0 ml-2"
                        aria-label="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Link>
                  );
                })}
              </div>
            ))}

          {!loading && user && hasMore && !search && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 py-2 transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </nav>
      )}
      {collapsed && <div className="flex-1" />}

      {/* Footer */}
      {user && (
        <div className="shrink-0 p-3 border-t border-gray-200 dark:border-border-dark space-y-1">
          <Link
            href="/profile"
            onClick={onNavigate}
            title={
              collapsed ? (user?.name ?? user?.email ?? "Profile") : undefined
            }
            className={`flex items-center py-2 rounded-lg transition-colors ${
              pathname === "/profile"
                ? "bg-gray-100 dark:bg-surface-dark text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-dark"
            }`}
          >
            <span className={iconSlot}>
              <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ??
                  user?.email?.[0]?.toUpperCase() ??
                  "?"}
              </div>
            </span>
            <div className={`flex-1 min-w-0 ${textCls}`}>
              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {user?.name ?? "No name"}
              </p>
              <p className="text-xs truncate text-gray-400 dark:text-gray-500">
                {user?.email}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center text-left text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <span className={iconSlot}>
              <LogOut size={16} />
            </span>
            <span className={textCls}>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
