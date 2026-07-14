const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const request = async (endpoint: string, options: RequestInit = {}) => {
  const cleanEndpoint = endpoint.replace(/^\//, "");

  const response = await fetch(`${API_URL}/api/${cleanEndpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      response.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : data.error || "Something went wrong";

    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return data;
};

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    request("auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request("auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => request("auth/logout", { method: "POST" }),

  me: () => request("auth/me"),

  updateProfile: (data: { name?: string; email?: string }) =>
    request("auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request("auth/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    request("auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request("auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyResetCode: (data: { email: string; code: string }) =>
    request("auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (data: { code: string }) =>
    request("auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendVerification: () =>
    request("auth/resend-verification", { method: "POST" }),
};

export const reviewApi = {
  create: async (data: {
    code: string;
    language: string;
    reviewerLevel: string;
  }) => {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    const responseData = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message =
        response.status === 429
          ? "Review limit reached. Please try again later."
          : responseData.error || "Something went wrong";
      const error = new Error(message) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return responseData;
  },

  getAll: (cursor?: string) =>
    request(cursor ? `/reviews?cursor=${cursor}` : "/reviews"),

  getById: (id: string) => request(`/reviews/${id}`),

  delete: (id: string) => request(`/reviews/${id}`, { method: "DELETE" }),

  getLimits: async () => request("/reviews/limits"),

  getCount: () => request("/reviews/count"),

  toggleItemResolved: (itemId: string, resolved: boolean) =>
    request(`/reviews/items/${itemId}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolved }),
    }),
};
