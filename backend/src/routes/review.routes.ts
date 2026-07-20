import { Router } from 'express'
import * as reviewController from '../controllers/review.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../services/validate.middleware'
import { createReviewSchema, toggleResolvedSchema } from '../lib/schemas'
import * as reportController from '../controllers/report.controller'
import * as chatController from '../controllers/chat.controller'
import { sendChatMessageSchema } from '../lib/schemas'

const router = Router()

router.get('/limits', authMiddleware, reviewController.getLimits)

router.post('/', authMiddleware, validate(createReviewSchema), reviewController.createReview)
router.get('/', authMiddleware, reviewController.getReviews)
router.get('/count', authMiddleware, reviewController.getReviewsCount)
router.get('/:id', authMiddleware, reviewController.getReviewById)
router.delete('/:id', authMiddleware, reviewController.deleteReview)

router.get('/:id/report', authMiddleware, reportController.getReviewReport)

router.patch('/items/:itemId/resolve', authMiddleware, validate(toggleResolvedSchema), reviewController.toggleItemResolved)

router.get('/:id/chat', authMiddleware, chatController.getChatHistory)
router.post('/:id/chat', authMiddleware, validate(sendChatMessageSchema), chatController.sendChatMessage)

export default router