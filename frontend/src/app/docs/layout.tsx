"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Code2, BarChart3, HelpCircle, ArrowLeft } from "lucide-react";

const SECTIONS = [
  { href: "/docs", label: "Getting started", icon: Rocket },
  { href: "/docs/languages", label: "Supported languages", icon: Code2 },
  { href: "/docs/results", label: "Understanding results", icon: BarChart3 },
  { href: "/docs/faq", label: "FAQ", icon: HelpCircle },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <header className="border-b border-gray-200 dark:border-border-dark">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 dark:text-blue-400"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
        <nav className="w-52 flex-shrink-0 space-y-1">
          {SECTIONS.map((section) => {
            const isActive = pathname === section.href;
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-card-dark"
                }`}
              >
                <Icon size={16} />
                {section.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
