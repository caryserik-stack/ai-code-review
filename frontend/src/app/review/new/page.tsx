'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LANGUAGES = [
  'typescript', 'javascript', 'python',
  'java', 'go', 'rust', 'cpp', 'css', 'html'
]

export default function NewReviewPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('typescript')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, language }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Успех → на страницу результата
      router.push(`/review/${data.review.id}`)

    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">AI Code Review</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">New Review</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Выбор языка */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Код */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Paste your code here..."
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {code.length} / 10000 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '🤖 Analyzing...' : '🚀 Analyze Code'}
          </button>

        </form>
      </main>
    </div>
  )
}