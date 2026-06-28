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
    const error = new Error(data.error || "Something went wrong") as Error & {
      status: number;
    };
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
    })
};

export const reviewApi = {
  create: (data: { code: string; language: string }) =>
    request("reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => request("/reviews"),

  getById: (id: string) => request(`/reviews/${id}`),

  delete: (id: string) => request(`/reviews/${id}`, { method: "DELETE" }),
};
