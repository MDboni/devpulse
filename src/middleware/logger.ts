import type { NextFunction, Request, Response } from "express";

/**
 * Request logger.
 *
 * Writes to stdout rather than a file: serverless hosts (Vercel, Lambda)
 * mount a read-only filesystem, so file-based logging silently fails there.
 * Platform log drains capture stdout instead.
 */
const logger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

export default logger;
