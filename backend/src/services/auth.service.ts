import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { sendPasswordResetEmail } from "./email.service";
import { sendVerificationEmail } from "./email.service";
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

// Создаём JWT токен
const createToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: "7d" }, // строка вместо переменной
  );
};

// Безопасный объект пользователя — без пароля
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
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // 2. Хэшируем пароль
  // 12 раундов = баланс безопасности и скорости
  // 10 = быстро но слабее, 14 = медленно но сильнее
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Создаём пользователя
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  })

  await prisma.emailVerificationToken.create({
    data: { code, userId: user.id, expiresAt },
  });

  await sendVerificationEmail(email, code);

  // 4. Создаём токен
  const token = createToken(user.id, user.email);

  return { token, user: safeUser(user) };
};

// ──────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────
export const login = async (input: LoginInput) => {
  const { email, password } = input;

  // 1. Ищем пользователя
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Важно: одинаковое сообщение для "нет юзера" и "неверный пароль"
  // Чтобы хакер не мог узнать существует ли email
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 2. Проверяем пароль
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 3. Создаём токен
  const token = createToken(user.id, user.email);

  return { token, user: safeUser(user) };
};

// ──────────────────────────────────────────
// GET ME
// ──────────────────────────────────────────
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return safeUser(user);
};

// ──────────────────────────────────────────
// UPDATE PROFILE
// ──────────────────────────────────────────
export const updateProfile = async (
  userId: string,
  data: { name?: string; email?: string },
) => {
  if (data.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== userId) {
      throw new Error("EMAIL_EXISTS");
    }
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
  data: { currentPassword: string; newPassword: string },
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

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
  if (!user) return;

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

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
// VERIFY CODE
// ──────────────────────────────────────────
export const verifyResetCode = async (email: string, code: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: code },
  });

  if (!resetToken) throw new Error("Invalid_code");
  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token: code } });
    throw new Error("Code has expired. Please request a new one.");
  }

  const user = await prisma.user.findUnique({
    where: { id: resetToken.userId },
  });
  if (!user || user.email !== email) throw new Error("Invalid_code");
};

// ──────────────────────────────────────────
// VERIFY EMAIL
// ──────────────────────────────────────────

export const verifyEmail = async (userId: string, code: string) => {
  const verificationToken = await prisma.emailVerificationToken.findFirst({
    where: { userId, code },
    orderBy: { createdAt: "desc" },
  });

  if (!verificationToken) {
    throw new Error("INVALID_CODE");
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    throw new Error("CODE_EXPIRED");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
};

export const resendVerificationCode = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  console.log(
    "resend: user found:",
    user?.email,
    "verified:",
    user?.emailVerified,
  );

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.emailVerified) throw new Error("ALREADY_VERIFIED");

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { code, userId, expiresAt },
  });

  console.log("resend: sending email to", user.email, "with code", code);
  await sendVerificationEmail(user.email, code);
  console.log("resend: email sent successfully");
};
