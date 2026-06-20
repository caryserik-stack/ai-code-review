"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useReviewsStore } from "@/store/reviewsStore";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading, fetchMe } = useAuthStore();
  const { reviews, fetchReviews } = useReviewsStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading && user) {
      fetchReviews();
    }
  }, [user, loading, fetchReviews]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-surface-dark relative">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-card-dark border-r border-gray-200 dark:border-border-dark flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            AI Code Review
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {user && (
          <div className="p-3">
            <Link
              href="/review/new"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + New Review
            </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2">
          {!loading && !user && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-8 px-4">
              Sign in to see your reviews
            </p>
          )}

          {user &&
            reviews.map((review) => {
              const isActive = pathname === `/review/${review.id}`;
              return (
                <Link
                  key={review.id}
                  href={`/review/${review.id}`}
                  className={`block px-3 py-2 rounded-lg text-sm mb-1 truncate transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark"
                  }`}
                >
                  {review.language} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </Link>
              );
            })}
        </nav>

        {user && (
          <div className="p-3 border-t border-gray-200 dark:border-border-dark">
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-2"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
      )}
      <main className="flex-1 overflow-y-auto pt-16">{children}</main>
    </div>
  );
}
