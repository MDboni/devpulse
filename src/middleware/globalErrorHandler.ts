import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import config from "../config/index";
import AppError from "../utils/AppError";

interface IPostgresError {
  code: string;
  detail?: string;
}

/** Postgres error codes we can translate into a meaningful HTTP status. */
const PG_ERROR_MAP: Record<
  string,
  { statusCode: number; message: string }
> = {
  // Spec files duplicate resources under 400, matching the explicit
  // pre-insert check in the auth service; this is the race-condition fallback.
  "23505": {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "Duplicate entry. Resource already exists.",
  },
  "23514": {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "A field value is outside its allowed set.",
  },
  "22001": {
    statusCode: StatusCodes.BAD_REQUEST,
    message: "A field value exceeds its maximum length.",
  },
};

const isPostgresError = (error: unknown): error is IPostgresError =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code: unknown }).code === "string";

const isJsonParseError = (error: unknown): boolean =>
  error instanceof SyntaxError && "body" in error;

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let errors: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (isJsonParseError(err)) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = "Malformed JSON in request body.";
  } else if (isPostgresError(err) && PG_ERROR_MAP[err.code]) {
    const mapped = PG_ERROR_MAP[err.code]!;
    statusCode = mapped.statusCode;
    message = mapped.message;
    errors = err.detail;
  } else {
    // Anything unrecognised is treated as internal. Driver and runtime messages
    // can embed credentials, hostnames, or query text, so they are logged for
    // the operator and never echoed back to the client in production.
    console.error("Unhandled error:", err);
    errors =
      config.node_env === "development" && err instanceof Error
        ? err.message
        : "An unexpected error occurred on the server.";
  }

  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (typeof errors !== "undefined") body.errors = errors;

  res.status(statusCode).json(body);
};

export default globalErrorHandler;
