import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

interface JwtPayload {
  userId: string;
  email: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ error: "Unauthorized: no token" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};
