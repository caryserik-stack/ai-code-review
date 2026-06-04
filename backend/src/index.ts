import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

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

// CORS — разрешаем запросы с фронтенда
// Без этого браузер блокирует запросы с другого порта
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // разрешаем отправку cookies
}))

// ──────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────

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