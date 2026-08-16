import type { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

const sendResponse = <T>(res: Response, payload: IResponse<T>) => {
  const { statusCode, success, message, data, errors } = payload;

  const body: Record<string, unknown> = {
    success,
    message,
  };

  if (typeof data !== "undefined") body.data = data;
  if (typeof errors !== "undefined") body.errors = errors;

  return res.status(statusCode).json(body);
};

export default sendResponse;
