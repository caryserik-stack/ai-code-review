import { prisma } from '../lib/prisma'

// ──────────────────────
// СОЗДАТЬ РЕВЬЮ
// ──────────────────────
export const createReview = async (data: {
  code: string
  language: string
  userId: string
}) => {
  // Создаём запись в БД со статусом PENDING
  // AI анализ добавим позже
  const review = await prisma.review.create({
    data: {
      code: data.code,
      language: data.language,
      userId: data.userId,
      status: 'PENDING',
    }
  })

  return review
}

// ──────────────────────
// ПОЛУЧИТЬ ВСЕ РЕВЬЮ ЮЗЕРА
// ──────────────────────
export const getReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }, // новые первыми
    select: {
      id: true,
      language: true,
      status: true,
      score: true,
      summary: true,
      createdAt: true,
      // code не включаем — он большой, не нужен в списке
    }
  })

  return reviews
}

// ──────────────────────
// ПОЛУЧИТЬ ОДНО РЕВЬЮ
// ──────────────────────
export const getReviewById = async (id: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: {
      id,
      userId, // важно! юзер видит только свои ревью
    },
    include: {
      items: true, // включаем замечания
    }
  })

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND')
  }

  return review
}