import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../utility/AppError";

const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let errors: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (isPostgresDuplicateError(err)) {
    statusCode = StatusCodes.CONFLICT;
    message = "Duplicate entry. Resource already exists.";
    errors = err.detail;
  } else if (err instanceof Error) {
    message = err.message;
  }

  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (typeof errors !== "undefined") body.errors = errors;

  res.status(statusCode).json(body);
};

const isPostgresDuplicateError = (
  error: unknown,
): error is { code: string; detail?: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505";

export default globalErrorHandler;
