// backend/src/services/chat.service.ts
import { prisma } from "../lib/prisma";

export const getChatHistory = async (reviewId: string, userId: string) => {
  // Проверяем, что ревью принадлежит пользователю — тот же паттерн
  // авторизации, что и в toggleItemResolved
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId, deletedAt: null },
  });
  if (!review) throw new Error("REVIEW_NOT_FOUND");

  return prisma.chatMessage.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
  });
};

// Mock-генератор ответа — имитирует ответ AI, видящего весь код и issues
// ревью. На AI-шаге заменим на реальный вызов Claude с review.code +
// review.items в контексте system prompt.
const generateMockReply = (userMessage: string, itemsCount: number): string => {
  const lower = userMessage.toLowerCase();

  if (lower.includes("why") || lower.includes("почему")) {
    return `This is flagged because it can lead to unexpected behavior under edge cases. Looking at the ${itemsCount} issue(s) found in this review, this pattern is one of the more impactful ones to address first.`;
  }
  if (lower.includes("fix") || lower.includes("исправ")) {
    return `Based on the suggested changes in this review, I'd recommend applying the diff shown in the relevant issue card, then re-running the review to confirm the score improves.`;
  }
  return `I've reviewed the code and the ${itemsCount} issue(s) found. Could you clarify which specific issue or line you'd like me to explain further?`;
};

export const sendChatMessage = async (
  reviewId: string,
  userId: string,
  content: string,
) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId, deletedAt: null },
    include: { items: true },
  });
  if (!review) throw new Error("REVIEW_NOT_FOUND");

  // Сохраняем сообщение пользователя
  await prisma.chatMessage.create({
    data: { reviewId, role: "USER", content },
  });

  // Имитируем задержку "размышления" AI
  await new Promise((resolve) => setTimeout(resolve, 800));

  const replyContent = generateMockReply(content, review.items.length);

  const assistantMessage = await prisma.chatMessage.create({
    data: { reviewId, role: "ASSISTANT", content: replyContent },
  });

  return assistantMessage;
};
