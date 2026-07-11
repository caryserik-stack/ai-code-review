import { Router } from 'express'
import * as reviewController from '../controllers/review.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../services/validate.middleware'
import { createReviewSchema, toggleResolvedSchema } from '../lib/schemas'

const router = Router()

router.get('/limits', authMiddleware, reviewController.getLimits)

router.post('/', authMiddleware, validate(createReviewSchema), reviewController.createReview)
router.get('/', authMiddleware, reviewController.getReviews)
router.get('/count', authMiddleware, reviewController.getReviewsCount)
router.get('/:id', authMiddleware, reviewController.getReviewById)
router.delete('/:id', authMiddleware, reviewController.deleteReview)

router.patch('/items/:itemId/resolve', authMiddleware, validate(toggleResolvedSchema), reviewController.toggleItemResolved)

export default router