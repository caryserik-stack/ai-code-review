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
  fetchReviews: () => Promise<void>;
  addReview: (review: ReviewListItem) => void;
  removeReview: (id: string) => void;
}

export const useReviewsStore = create<ReviewsStore>((set) => ({
  reviews: [],
  loaded: false,

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
  }
}));
