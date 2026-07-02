import { create } from "zustand";
import { reviewApi } from "@/lib/apiClient";

interface ReviewListItem {
  id: string;
  language: string;
  createdAt: string;
}

interface ReviewsStore {
  reviews: ReviewListItem[];
  loaded: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  hasMore: boolean;
  remaining: number;
  limit: number;
  fetchReviews: () => Promise<void>;
  loadMore: () => Promise<void>;
  addReview: (review: ReviewListItem) => void;
  removeReview: (id: string) => void;
  setRateLimit: (remaining: number, limit: number) => void;
}

export const useReviewsStore = create<ReviewsStore>((set, get) => ({
  reviews: [],
  loaded: false,
  loadingMore: false,
  nextCursor: null,
  hasMore: false,
  remaining: -1,
  limit: -1,

  fetchReviews: async () => {
    try {
      const [data, limits] = await Promise.all([
        reviewApi.getAll(),
        reviewApi.getLimits(),
      ]);
      set({
        reviews: data.reviews ?? [],
        loaded: true,
        nextCursor: data.nextCursor,
        hasMore: !!data.nextCursor,
        remaining: limits.remaining,
        limit: limits.limit,
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
    set((state) => ({ reviews: [review, ...state.reviews] }));
  },

  removeReview: (id: string) => {
    set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) }));
  },

  setRateLimit: (remaining: number, limit: number) => {
    set({ remaining, limit });
  },
}));
