import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service";

// ──────────────────────────────────────────
// ТИПЫ
// ──────────────────────────────────────────

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

// Access token — живёт 15 минут
// Если украли — быстро протухает
const createAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" }
  );
};

// Refresh token — случайная строка, хранится в БД
// Живёт 7 дней, можно отозвать в любой момент
const createRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
};

// Безопасный объект пользователя — без пароля и внутренних полей
const safeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
});

// ──────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────

export const register = async (input: RegisterInput) => {
  const { email, password, name } = input;

  // 1. Проверяем существует ли email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("EMAIL_EXISTS");

  // 2. Хэшируем пароль
  // 12 раундов = баланс безопасности и скорости
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Создаём пользователя
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  // 4. Создаём и отправляем код верификации email
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await prisma.emailVerificationToken.create({
    data: { code, userId: user.id, expiresAt },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  await sendVerificationEmail(email, code);

  // 5. Создаём токены
  const accessToken = createAccessToken(user.id, user.email);
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: safeUser(user) };
};

// ──────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────

export const login = async (input: LoginInput) => {
  const { email, password } = input;

  // 1. Ищем пользователя
  const user = await prisma.user.findUnique({ where: { email } });

  // Одинаковое сообщение для "нет юзера" и "неверный пароль"
  // Чтобы атакующий не мог узнать существует ли email
  if (!user) throw new Error("INVALID_CREDENTIALS");

  // 2. Проверяем пароль
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new Error("INVALID_CREDENTIALS");

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  // 3. Создаём токены
  const accessToken = createAccessToken(user.id, user.email);
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, user: safeUser(user) };
};

// ──────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────

export const logout = async (refreshToken: string) => {
  // Удаляем refresh token из БД — он больше не действителен
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
};

// ──────────────────────────────────────────
// REFRESH TOKENS
// ──────────────────────────────────────────

export const refreshTokens = async (token: string) => {
  // 1. Ищем токен в БД
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken) throw new Error("INVALID_REFRESH_TOKEN");

  // 2. Проверяем не истёк ли
  if (refreshToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  // 3. Ротация — удаляем старый токен, создаём новый
  // Если старый токен украли и попытались использовать повторно — он уже удалён
  await prisma.refreshToken.delete({ where: { token } });

  const accessToken = createAccessToken(refreshToken.user.id, refreshToken.user.email);
  const newRefreshToken = await createRefreshToken(refreshToken.user.id);

  return { accessToken, refreshToken: newRefreshToken, user: safeUser(refreshToken.user) };
};

// ──────────────────────────────────────────
// GET ME
// ──────────────────────────────────────────

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  return safeUser(user);
};

// ──────────────────────────────────────────
// UPDATE PROFILE
// ──────────────────────────────────────────

export const updateProfile = async (
  userId: string,
  data: { name?: string; email?: string }
) => {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) throw new Error("EMAIL_EXISTS");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
    },
  });

  return safeUser(user);
};

// ──────────────────────────────────────────
// CHANGE PASSWORD
// ──────────────────────────────────────────

export const changePassword = async (
  userId: string,
  data: { currentPassword: string; newPassword: string }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) throw new Error("INVALID_CURRENT_PASSWORD");

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

// ──────────────────────────────────────────
// FORGOT PASSWORD
// ──────────────────────────────────────────

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Не сообщаем существует ли email — просто тихо выходим
  if (!user) return;

  // Удаляем старые токены перед созданием нового
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

  await prisma.passwordResetToken.create({
    data: { token: code, userId: user.id, expiresAt },
  });

  await sendPasswordResetEmail(email, code);
};

// ──────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────

export const resetPassword = async (code: string, newPassword: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: code },
  });

  if (!resetToken) throw new Error("INVALID_TOKEN");

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token: code } });
    throw new Error("TOKEN_EXPIRED");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { token: code } });
};

// ──────────────────────────────────────────
// VERIFY RESET CODE
// ──────────────────────────────────────────

export const verifyResetCode = async (email: string, code: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: code },
  });

  if (!resetToken) throw new Error("INVALID_CODE");

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token: code } });
    throw new Error("CODE_EXPIRED");
  }

  const user = await prisma.user.findUnique({ where: { id: resetToken.userId } });
  if (!user || user.email !== email) throw new Error("INVALID_CODE");
};

// ──────────────────────────────────────────
// VERIFY EMAIL
// ──────────────────────────────────────────

export const verifyEmail = async (userId: string, code: string) => {
  const verificationToken = await prisma.emailVerificationToken.findFirst({
    where: { userId, code },
    orderBy: { createdAt: "desc" }, // берём последний если вдруг несколько
  });

  if (!verificationToken) throw new Error("INVALID_CODE");

  if (verificationToken.expiresAt < new Date()) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    throw new Error("CODE_EXPIRED");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  // Удаляем все токены верификации этого юзера
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
};

// ──────────────────────────────────────────
// RESEND VERIFICATION CODE
// ──────────────────────────────────────────

export const resendVerificationCode = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.emailVerified) throw new Error("ALREADY_VERIFIED");

  // Удаляем старые токены перед созданием нового
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

  await prisma.emailVerificationToken.create({
    data: { code, userId, expiresAt },
  });

  await sendVerificationEmail(user.email, code);
};