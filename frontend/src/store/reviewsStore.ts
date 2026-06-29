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
  remaining: number;
  limit: number;
  fetchReviews: () => Promise<void>;
  addReview: (review: ReviewListItem) => void;
  removeReview: (id: string) => void;
  setRateLimit: (remaining: number, limit: number) => void;
}

export const useReviewsStore = create<ReviewsStore>((set) => ({
  reviews: [],
  loaded: false,
  remaining: -1,
  limit: -1,

  fetchReviews: async () => {
    try {
      const data = await reviewApi.getAll();
      set({ reviews: data.reviews ?? [], loaded: true });
    } catch {
      set({ reviews: [], loaded: true });
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
