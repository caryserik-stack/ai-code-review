import { prisma } from '../lib/prisma'
import { analyzeCode } from './ai.service'

// ──────────────────────
// СОЗДАТЬ РЕВЬЮ
// ──────────────────────
export const createReview = async (data: {
  code: string
  language: string
  userId: string
}) => {
  // Шаг 1 — создаём запись со статусом PROCESSING
  const review = await prisma.review.create({
    data: {
      code: data.code,
      language: data.language,
      userId: data.userId,
      status: 'PROCESSING',
    }
  })

  try {
    // Шаг 2 — отправляем в AI (mock или реальный)
    const result = await analyzeCode(data.code, data.language)

    // Шаг 3 — сохраняем результат
    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: {
        status: 'COMPLETED',
        summary: result.summary,
        score: result.score,
        items: {
          create: result.items
        }
      },
      include: { items: true }
    })

    return updatedReview

  } catch (error) {
    // AI упал — помечаем FAILED
    await prisma.review.update({
      where: { id: review.id },
      data: { status: 'FAILED' }
    })
    throw error
  }
}

// ──────────────────────
// ПОЛУЧИТЬ ВСЕ РЕВЬЮ
// ──────────────────────
export const getReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      language: true,
      status: true,
      score: true,
      summary: true,
      createdAt: true,
    }
  })
  return reviews
}

// ──────────────────────
// ПОЛУЧИТЬ ОДНО РЕВЬЮ
// ──────────────────────
export const getReviewById = async (id: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: { id, userId },
    include: { items: true }
  })

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND')
  }

  return review
}


// ──────────────────────
// УДАЛИТЬ РЕВЬЮ
// ──────────────────────

export const deleteReview = async (id: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: { id, userId}
  })

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND')
  }

  await prisma.review.delete({
    where: { id }
  })
}