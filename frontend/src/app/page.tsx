import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">AI Code Review</h1>
      <p className="text-gray-600">Analyze your code with AI</p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="border border-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
