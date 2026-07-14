"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, User as UserIcon, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { z } from "zod";
import type { SettingsTab } from "@/hooks/useSettingsRoute";

interface Props {
  open: boolean;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
}

const TABS = [
  { id: "account" as const, label: "Profile", icon: UserIcon },
  { id: "general" as const, label: "Appearance", icon: Palette },
];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Настройки открываются модалкой поверх сайдбара (как у Клода), но с
// настоящими URL /settings/account и /settings/general — open/tab
// приходят снаружи из useSettingsRoute (единственный источник правды —
// pathname, не внутренний useState).
export function SettingsModal({ open, tab, onTabChange, onClose }: Props) {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setProfileError("");
      setPasswordError("");
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    const result = profileSchema.safeParse({ name, email });
    if (!result.success) {
      setProfileError(result.error.issues[0].message);
      return;
    }

    setProfileLoading(true);
    try {
      const data = await authApi.updateProfile({ name, email });
      setUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const result = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-2xl h-[80vh] max-h-[640px] bg-white dark:bg-card-dark rounded-2xl shadow-xl flex overflow-hidden"
          >
            {/* левая колонка с табами */}
            <div className="w-48 shrink-0 border-r border-gray-100 dark:border-border-dark p-3 bg-gray-50/60 dark:bg-surface-dark/60">
              <p className="px-2 pb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Settings
              </p>
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTabChange(t.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                      isActive
                        ? "bg-gray-200/70 dark:bg-white/10 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* контент */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-14 shrink-0 flex items-center justify-end px-4 border-b border-gray-100 dark:border-border-dark">
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close settings"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {tab === "account" && (
                  <>
                    {/* Account info */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-lg font-bold shrink-0">
                        {user?.name?.[0]?.toUpperCase() ??
                          user?.email?.[0]?.toUpperCase() ??
                          "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user?.name ?? "No name"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
                          {user?.role?.toLowerCase() ?? "user"}
                        </p>
                      </div>
                    </div>

                    {/* Edit profile */}
                    <div className="border-t border-gray-100 dark:border-border-dark pt-5 space-y-3 max-w-md">
                      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Edit profile
                      </h2>

                      {profileError && (
                        <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-sm">
                          {profileError}
                        </div>
                      )}

                      <form
                        onSubmit={handleProfileSubmit}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={profileLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {profileLoading ? "Saving..." : "Save changes"}
                        </button>
                      </form>
                    </div>

                    {/* Change password */}
                    <div className="border-t border-gray-100 dark:border-border-dark pt-5 space-y-3 max-w-md">
                      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Change password
                      </h2>

                      {passwordError && (
                        <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-sm">
                          {passwordError}
                        </div>
                      )}

                      <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Current password
                          </label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              New password
                            </label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="••••••••"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Confirm password
                            </label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {passwordLoading ? "Changing..." : "Change password"}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {tab === "general" && (
                  <div className="max-w-sm">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Theme
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Light or dark interface theme
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
