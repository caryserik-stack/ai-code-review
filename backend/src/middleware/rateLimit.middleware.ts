import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

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

export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    try {
      const token = req.cookies?.jwt_token;
      if (!token) return req.ip || "unknown";

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as any;
      return `user_${decoded.userId}`;
    } catch {
      return req.ip || "unknown";
    }
  },
  message: {
    error: "Review limit reached. You can create up to 20 reviews per hour.",
  },
});
