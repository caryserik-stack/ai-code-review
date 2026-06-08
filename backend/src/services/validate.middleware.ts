import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

// Универсальный middleware для валидации
// Принимает любую Zod схему
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      // Zod даёт подробные ошибки — форматируем их
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))

      res.status(400).json({
        error: 'Validation failed',
        errors
      })
      return
    }

    // Данные валидны — заменяем req.body на очищенные данные
    req.body = result.data
    next()
  }
}