"use client";

import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Palette,
  ListChecks,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { teamProfileApi } from "@/lib/apiClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { z } from "zod";
import type { SettingsTab } from "@/hooks/useSettingsRoute";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
}

const TABS = [
  { id: "account" as const, label: "Profile", icon: UserIcon },
  { id: "general" as const, label: "Appearance", icon: Palette },
  { id: "rules" as const, label: "Review Rules", icon: ListChecks },
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
//
// Технически: Dialog из shadcn/ui (Radix) уже даёт портал, overlay,
// focus-trap, закрытие по Escape и клику вне модалки "из коробки" —
// ручной createPortal/keydown-listener/document.body.style.overflow
// из исходной версии больше не нужны.
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
  const [showPasswords, setShowPasswords] = useState(false);

  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);

  useEffect(() => {
    if (open && tab === "rules") {
      setRulesLoading(true);
      teamProfileApi
        .get()
        .then((data) => setRules(data.profile.rules))
        .catch(() => toast.error("Failed to load review rules"))
        .finally(() => setRulesLoading(false));
    }
  }, [open, tab]);

  const saveRules = async (nextRules: string[]) => {
    setRulesSaving(true);
    try {
      await teamProfileApi.update({ rules: nextRules });
      setRules(nextRules);
    } catch {
      toast.error("Failed to save rule");
    } finally {
      setRulesSaving(false);
    }
  };

  const handleAddRule = () => {
    const trimmed = newRule.trim();
    if (!trimmed || rules.length >= 20) return;
    saveRules([...rules, trimmed]);
    setNewRule("");
  };

  const handleRemoveRule = (index: number) => {
    saveRules(rules.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (open && user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setProfileError("");
      setPasswordError("");
    }
  }, [open, user]);

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

  const passwordType = showPasswords ? "text" : "password";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="flex gap-0 overflow-hidden p-0"
        // Заданы инлайн-стилем, а не только классами: в некоторых
        // настройках shadcn/tailwind-merge дефолтные классы DialogContent
        // (max-w-lg, p-6, grid...) могут выигрывать у переопределений через
        // className в зависимости от порядка в скомпилированном CSS.
        // Инлайн-style всегда побеждает, поэтому ширина/высота гарантированы.
        style={{
          width: "100%",
          maxWidth: "min(42rem, calc(100vw - 2rem))",
          height: "80vh",
          maxHeight: "640px",
        }}
      >
        {/* screen-reader only title — Radix requires a DialogTitle */}
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <Tabs
          value={tab}
          onValueChange={(v) => onTabChange(v as SettingsTab)}
          orientation="vertical"
          className="flex h-full min-h-0 w-full min-w-0 flex-row"
        >
          {/* левая колонка с табами */}
          <div className="w-48 shrink-0 border-r bg-muted/40 p-3">
            <p className="px-2 pb-3 text-sm font-semibold text-foreground">
              Settings
            </p>
            <TabsList className="flex h-auto w-full flex-col items-stretch gap-0.5 bg-transparent p-0">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={cn(
                      "w-full justify-start gap-2.5 rounded-lg px-2.5 py-2 text-sm font-normal",
                      "text-muted-foreground shadow-none",
                      "data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=active]:shadow-none",
                      "hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon size={16} />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* контент */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="h-14 shrink-0 border-b" />

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-6 p-6">
                <TabsContent value="account" className="mt-0 space-y-6">
                  {/* Account info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {user?.name?.[0]?.toUpperCase() ??
                          user?.email?.[0]?.toUpperCase() ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user?.name ?? "No name"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <Badge
                          variant="secondary"
                          className="mt-1 h-5 px-1.5 text-[10px] font-normal capitalize"
                        >
                          {user.role.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Edit profile */}
                  <div className="max-w-md space-y-3 border-t pt-5">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Edit profile
                    </h2>

                    {profileError && (
                      <Alert variant="destructive" className="py-2.5">
                        <AlertDescription>{profileError}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor="name"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="email"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={profileLoading} size="sm">
                        {profileLoading && <Loader2 className="animate-spin" />}
                        {profileLoading ? "Saving..." : "Save changes"}
                      </Button>
                    </form>
                  </div>

                  {/* Change password */}
                  <div className="max-w-md space-y-3 border-t pt-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Change password
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowPasswords((s) => !s)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                        {showPasswords ? "Hide" : "Show"}
                      </button>
                    </div>

                    {passwordError && (
                      <Alert variant="destructive" className="py-2.5">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor="currentPassword"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Current password
                        </Label>
                        <Input
                          id="currentPassword"
                          type={passwordType}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 space-y-1">
                          <Label
                            htmlFor="newPassword"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            New password
                          </Label>
                          <Input
                            id="newPassword"
                            type={passwordType}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="min-w-0"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Confirm password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type={passwordType}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className="min-w-0"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={passwordLoading}
                        size="sm"
                      >
                        {passwordLoading && (
                          <Loader2 className="animate-spin" />
                        )}
                        {passwordLoading ? "Changing..." : "Change password"}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="general" className="mt-0">
                  <div className="max-w-sm">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Theme
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Light or dark interface theme
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="mt-0 max-w-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Custom review rules
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Describe team-specific conventions the AI should check
                        for (e.g. &quot;no any in TypeScript&quot;, &quot;all
                        API inputs must use Zod&quot;).
                      </p>
                    </div>
                    <span className="shrink-0 pl-3 text-xs tabular-nums text-muted-foreground">
                      {rules.length}/20
                    </span>
                  </div>

                  {rulesLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-9 animate-pulse rounded-lg bg-muted"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {rules.map((rule, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2"
                          >
                            <span className="text-sm text-foreground">
                              {rule}
                            </span>
                            <button
                              onClick={() => handleRemoveRule(index)}
                              disabled={rulesSaving}
                              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                              aria-label="Remove rule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {rules.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No custom rules yet
                          </p>
                        )}
                      </div>

                      {rules.length < 20 && (
                        <div className="flex gap-2">
                          <Input
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddRule())
                            }
                            placeholder="e.g. All exported functions must have JSDoc"
                            maxLength={200}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleAddRule}
                            disabled={rulesSaving || !newRule.trim()}
                            size="icon"
                            aria-label="Add rule"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
