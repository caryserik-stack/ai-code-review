import { Request, Response, NextFunction } from 'express'

// Централизованный обработчик ошибок
// Стоит ПОСЛЕДНИМ в index.ts — ловит все необработанные ошибки
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', err.message)

  res.status(500).json({
    error: 'Internal server error',
    // В продакшне не показываем детали ошибки
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message
    })
  })
}