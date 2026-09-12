import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma";
import { changePassword } from "./auth.service";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MESSAGES_PER_PAGE = 50;
const HISTORY_CONTEXT_LIMIT = 20;

export const getChatHistory = async (
  reviewId: string,
  userId: string,
  cursor?: string,
) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId, deletedAt: null },
  });
  if (!review) throw new Error("REVIEW_NOT_FOUND");

  const messages = await prisma.chatMessage.findMany({
    where: { reviewId },
    orderBy: { createdAt: "desc" },
    take: CHAT_MESSAGES_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = messages.length > CHAT_MESSAGES_PER_PAGE;
  const page = hasMore ? messages.slice(0, CHAT_MESSAGES_PER_PAGE) : messages;
  const ordered = [...page].reverse();
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { messages: ordered, hasMore, nextCursor };
};
const buildSystemPrompt = (review: {
  code: string;
  language: string;
  items: {
    type: string;
    title: string;
    description: string;
    line: number | null;
  }[];
}) => `You are a helpful assistant answering questions about a code review.

Code (${review.language}):
\`\`\`${review.language}
${review.code}
\`\`\`

Issues found:
${
  review.items.length === 0
    ? "(no issues found)"
    : review.items
        .map(
          (i, idx) =>
            `${idx + 1}. [${i.type}]${i.line ? ` line ${i.line}` : ""} ${i.title} — ${i.description}`,
        )
        .join("\n")
}

Answer concisely, reference specific issues/line numbers when relevant, stay focused on this review.`;

export const sendChatMessage = async (
  reviewId: string,
  userId: string,
  content: string,
) => {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId, deletedAt: null },
    include: {
      items: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: HISTORY_CONTEXT_LIMIT,
      },
    },
  });
  if (!review) throw new Error("REVIEW_NOT_FOUND");

  await prisma.chatMessage.create({
    data: { reviewId, role: "USER", content },
  });

  // ВАЖНО: у Gemini роль ассистента называется "model", не "assistant"
  const history = [...review.chatMessages].reverse().map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const chat = ai.chats.create({
    model: "gemini-3.6-flash",
    config: { systemInstruction: buildSystemPrompt(review) },
    history,
  });

  const response = await chat.sendMessage({ message: content });
  const replyContent =
    response.text ?? "Sorry, I couldn't generate a response.";

  const assistantMessage = await prisma.chatMessage.create({
    data: { reviewId, role: "ASSISTANT", content: replyContent },
  });

  return assistantMessage;
};
