import { Router } from 'express'
import * as reviewController from '../controllers/review.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../services/validate.middleware'
import { createReviewSchema } from '../lib/schemas'

const router = Router()

router.post('/', authMiddleware, validate(createReviewSchema), reviewController.createReview)
router.get('/', authMiddleware, reviewController.getReviews)
router.get('/:id', authMiddleware, reviewController.getReviewById)
router.delete('/:id', authMiddleware, reviewController.deleteReview)
router.get('/limits', authMiddleware, reviewController.getLimits)

export default router