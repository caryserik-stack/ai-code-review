import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AI Code Review",
    template: "%s · AI Code Review",
  },
  description:
    "Paste your code, get instant AI feedback on bugs, security issues and style.",
  keywords: ["code review", "AI", "programming", "bugs", "security"],
  authors: [{ name: "AI Code Review" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aicodereview.app",
    siteName: "AI Code Review",
    title: "AI Code Review — Instant AI feedback on your code",
    description:
      "Paste your code, get instant AI feedback on bugs, security issues and style — before your team sees it.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Code Review",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Code Review — Instant AI feedback on your code",
    description:
      "Paste your code, get instant AI feedback on bugs, security issues and style.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
