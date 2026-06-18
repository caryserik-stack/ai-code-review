import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
        AI Code Review
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Analyze your code with AI
      </p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="border border-gray-300 dark:border-border-dark text-gray-900 dark:text-gray-100 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-card-dark transition-colors"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
