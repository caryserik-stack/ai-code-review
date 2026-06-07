import { Router } from 'express'
import * as reviewController from '../controllers/review.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/', authMiddleware, reviewController.createReview)
router.get('/', authMiddleware, reviewController.getReviews)
router.get('/:id', authMiddleware, reviewController.getReviewById)

export default router