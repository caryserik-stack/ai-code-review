// Типы для результата анализа
export interface ReviewResult {
  summary: string
  score: number
  items: {
    type: 'ERROR' | 'WARNING' | 'SUGGESTION' | 'SECURITY'
    title: string
    description: string
    line?: number
    suggestion?: string
  }[]
}

// Mock версия — имитирует ответ Claude
// Когда получишь API ключ — заменим на реальный вызов
export const analyzeCode = async (
  code: string,
  language: string
): Promise<ReviewResult> => {

  // Имитируем задержку AI (1 секунда)
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    summary: `Mock analysis of ${language} code. ${code.length} characters analyzed.`,
    score: 72,
    items: [
      {
        type: 'SUGGESTION',
        title: 'Add explicit type annotation',
        description: 'Variable declarations should have explicit types in TypeScript',
        line: 1,
        suggestion: 'const x: number = 1'
      },
      {
        type: 'WARNING',
        title: 'Unused variable',
        description: 'Variable x is declared but never used',
        line: 1,
        suggestion: 'Remove unused variable or use it in your code'
      },
      {
        type: 'SECURITY',
        title: 'No input validation',
        description: 'Consider validating inputs before processing',
        line: 1,
        suggestion: 'Add input validation at the beginning of the function'
      }
    ]
  }
}