import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

// ──────────────────────────────────────────
// ТИПЫ
// ──────────────────────────────────────────
interface RegisterInput {
  email: string
  password: string
  name?: string
}

interface LoginInput {
  email: string
  password: string
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

// Создаём JWT токен
const createToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET as string
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '7d' }  // строка вместо переменной
  )
}

// Безопасный объект пользователя — без пароля
const safeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
})

// ──────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────
export const register = async (input: RegisterInput) => {
  const { email, password, name } = input

  // 1. Проверяем существует ли email
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new Error('EMAIL_EXISTS')
  }

  // 2. Хэшируем пароль
  // 12 раундов = баланс безопасности и скорости
  // 10 = быстро но слабее, 14 = медленно но сильнее
  const hashedPassword = await bcrypt.hash(password, 12)

  // 3. Создаём пользователя
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    }
  })

  // 4. Создаём токен
  const token = createToken(user.id, user.email)

  return { token, user: safeUser(user) }
}

// ──────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────
export const login = async (input: LoginInput) => {
  const { email, password } = input

  // 1. Ищем пользователя
  const user = await prisma.user.findUnique({
    where: { email }
  })

  // Важно: одинаковое сообщение для "нет юзера" и "неверный пароль"
  // Чтобы хакер не мог узнать существует ли email
  if (!user) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // 2. Проверяем пароль
  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // 3. Создаём токен
  const token = createToken(user.id, user.email)

  return { token, user: safeUser(user) }
}

// ──────────────────────────────────────────
// GET ME
// ──────────────────────────────────────────
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  return safeUser(user)
}