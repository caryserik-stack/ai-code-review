import { create } from "zustand";
import { reviewApi } from "@/lib/apiClient";

interface ReviewListItem {
  id: string;
  language: string;
  createdAt: string;
}

interface FullReview {
  id: string;
  code: string;
  language: string;
  reviewerLevel: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
  items: any[];
}

interface ReviewsStore {
  reviews: ReviewListItem[];
  loaded: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  remaining: number;
  limit: number;
  totalCount: number;
  reviewCache: Record<string, FullReview>;
  fetchReviews: () => Promise<void>;
  loadMore: () => Promise<void>;
  addReview: (review: ReviewListItem) => void;
  removeReview: (id: string) => void;
  setRateLimit: (remaining: number, limit: number) => void;
  cacheReview: (review: FullReview) => void;
}

export const useReviewsStore = create<ReviewsStore>((set, get) => ({
  reviews: [],
  loaded: false,
  loadingMore: false,
  nextCursor: null,
  hasMore: false,
  remaining: -1,
  limit: -1,
  totalCount: 0,
  reviewCache: {},

  fetchReviews: async () => {
    try {
      const [data, limits, countData] = await Promise.all([
        reviewApi.getAll(),
        reviewApi.getLimits(),
        reviewApi.getCount(),
      ]);
      set({
        reviews: data.reviews ?? [],
        loaded: true,
        nextCursor: data.nextCursor,
        hasMore: !!data.nextCursor,
        remaining: limits.remaining,
        limit: limits.limit,
        totalCount: countData.count,
      });
    } catch {
      set({ reviews: [], loaded: true });
    }
  },

  loadMore: async () => {
    const { nextCursor, loadingMore } = get();
    if (!nextCursor || loadingMore) return;

    set({ loadingMore: true });
    try {
      const data = await reviewApi.getAll(nextCursor);
      set((state) => ({
        reviews: [...state.reviews, ...data.reviews],
        nextCursor: data.nextCursor,
        hasMore: !!data.nextCursor,
      }));
    } catch {
    } finally {
      set({ loadingMore: false });
    }
  },

  addReview: (review) => {
    set((state) => ({
      reviews: [review, ...state.reviews],
      totalCount: state.totalCount + 1,
    }));
  },

  removeReview: (id: string) => {
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
      totalCount: state.totalCount - 1,
    }));
  },

  setRateLimit: (remaining: number, limit: number) => {
    set({ remaining, limit });
  },

  cacheReview: (review) => {
    set((state) => ({
      reviewCache: { ...state.reviewCache, [review.id]: review },
    }));
  },
}));
