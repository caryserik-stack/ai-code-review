import { Response } from 'express'
import * as reviewService from '../services/review.service'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'


export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body

    if (!code || !language) {
      res.status(400).json({ error: 'Code and language are required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user?.emailVerified) {
      res.status(403).json({ error: 'Please verify your email before creating reviews' })
      return
    }

    const review = await reviewService.createReview({
     code,
     language,
     userId: req.userId!
    })

    res.status(201).json({ review})

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}



export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await reviewService.getReviews(req.userId!)
    res.status(200).json({ reviews })

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}


export const getReviewById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const review = await reviewService.getReviewById(id, req.userId!)

    res.status(200).json({ review })

  } catch (error: any) {
    if (error.message === 'REVIEW_NOT_FOUND') {
      res.status(404).json({ error: 'Review not found' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}


export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    await reviewService.deleteReview(id, req.userId!)

    res.status(200).send()

  } catch(error: any) {
    if (error.message === 'REVIEW_NOT_FOUND') {
      res.status(404).json({ error: 'Review not found' })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getLimits = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ message: 'ok' })
}