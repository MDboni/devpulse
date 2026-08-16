import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { initDB } from "../db/index";
import AppError from "../utility/AppError";

/**
 * Guarantees the schema exists before a route touches the database.
 *
 * On a long-running server `initDB()` has already run at boot; on serverless
 * every cold start gets a fresh process, so the first request through this
 * middleware pays for the bootstrap and the rest reuse the cached result.
 */
const ensureDB = async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await initDB();
    next();
  } catch (error) {
    // The driver's own message can carry connection-string details (host, role,
    // "password authentication failed"), so log it and surface a safe summary.
    console.error("Database initialization failed:", error);
    next(
      new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Database is currently unavailable. Please try again shortly.",
      ),
    );
  }
};

export default ensureDB;
