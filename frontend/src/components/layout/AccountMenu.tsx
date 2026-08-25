"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";

interface UserShape {
  name?: string | null;
  email?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserShape | null | undefined;
  onOpenSettings: () => void;
  onLogout: () => void;
  trigger: React.ReactNode;
}

export function AccountMenu({
  open,
  onOpenChange,
  user,
  onOpenSettings,
  onLogout,
  trigger,
}: Props) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-60 bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user?.name ?? "No name"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-normal">
            {user?.email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-border-dark" />

        <DropdownMenuItem
          onClick={onOpenSettings}
          className="gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
        >
          <Settings size={16} />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onLogout}
          className="gap-2.5 px-3 py-2 text-sm text-red-500 focus:text-red-500 cursor-pointer"
        >
          <LogOut size={16} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
