import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config/index";
import { pool } from "../db/index";
import type { ROLES } from "../types/index";
import AppError from "../utility/AppError";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Unauthorized access! Token is required.",
        );
      }

      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
      } catch {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Invalid or expired token.",
        );
      }

      const userResult = await pool.query(
        `SELECT id, name, email, role FROM users WHERE id=$1`,
        [decoded.id],
      );

      if (userResult.rows.length === 0) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found!");
      }

      const user = userResult.rows[0];

      if (roles.length && !roles.includes(user.role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "Forbidden! You do not have permission to access this resource.",
        );
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
