import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.routes'
import cookieParser from 'cookie-parser'
import reviewRouter from './routes/review.routes'
import { errorMiddleware } from './middleware/error.middleware'
import { globalLimiter, authLimiter, forgotPasswordLimiter, reviewLimiter } from './middleware/rateLimit.middleware'

// Загружаем переменные окружения из .env
// Это должно быть ПЕРВЫМ — до любых других импортов
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// ──────────────────────────────────────────
// MIDDLEWARE — выполняются на КАЖДЫЙ запрос
// ──────────────────────────────────────────

// Разрешаем принимать JSON в теле запроса
// Без этого req.body будет undefined
app.use(express.json())
app.use(cookieParser())

// CORS — разрешаем запросы с фронтенда
// Без этого браузер блокирует запросы с другого порта
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // разрешаем отправку cookies
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'RateLimit-Policy'],
}))

app.set('trust proxy', 1)
app.use(globalLimiter)

// ──────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/forgot-password', forgotPasswordLimiter)
app.use('/api/auth', authRouter)

app.use('/api/reviews/limits', (req, res, next) => {
  if (req.method === 'GET') {
    return reviewLimiter(req, res, next)
  }
  next()
})

app.use('/api/reviews', (req, res, next) => {
  if (req.method === 'POST') {
    return reviewLimiter(req, res, next)
  }
  next()
})

app.use('/api/reviews', reviewRouter)




app.use(errorMiddleware)

// Health check — первый эндпоинт
// Используется для проверки что сервер жив
// Docker и деплой-системы пингуют этот эндпоинт
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})


// ──────────────────────────────────────────
// ЗАПУСК СЕРВЕРА
// ──────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app