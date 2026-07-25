"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InlineSelectProps = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
};


export function InlineSelect({
  value,
  options,
  onChange,
  className = "",
}: InlineSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-surface-dark text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 capitalize outline-none ${className}`}
        >
          {value}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[120px] bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={`text-xs font-mono capitalize cursor-pointer ${
              option === value
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
