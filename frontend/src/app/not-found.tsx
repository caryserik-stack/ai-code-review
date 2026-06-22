import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-surface-dark px-4 text-center">
      <p className="text-6xl font-bold text-gray-200 dark:text-gray-800">404</p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}