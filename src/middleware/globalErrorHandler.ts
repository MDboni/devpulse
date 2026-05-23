import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../utility/AppError";

const globalErrorHandler = (
  err: any,
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
  } else if (err?.code === "23505") {
    statusCode = StatusCodes.CONFLICT;
    message = "Duplicate entry. Resource already exists.";
    errors = err.detail;
  } else if (err?.message) {
    message = err.message;
  }

  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (typeof errors !== "undefined") body.errors = errors;

  res.status(statusCode).json(body);
};

export default globalErrorHandler;
