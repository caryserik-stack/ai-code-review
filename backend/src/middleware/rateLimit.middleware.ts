import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.ip || req.connection.remoteAddress || "unknown";
  },
};

export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: { error: "Too many requests, please try again later." },
});

export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { error: "Too many attempts, please try again in 15 minutes." },
});

export const forgotPasswordLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: {
    error: "Too many password reset attempts, please try again in an hour.",
  },
});

export const verifyCodeLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: {
    error: "Too many verification attempts, please try again in 15 minutes.",
  },
});
