import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    throw new AppError(401, "API Key is required");
  }

  if (apiKey !== process.env.API_KEY) {
    throw new AppError(403, "Invalid API Key");
  }

  next();
};
