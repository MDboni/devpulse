import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { pool } from "../../db/index";
import config from "../../config/index";
import AppError from "../../utility/AppError";
import type {
  ILoginPayload,
  ISignupPayload,
  IUserRow,
} from "./auth.interface";

const signupIntoDB = async (payload: ISignupPayload) => {
  const { name, email, password, role } = payload;

  if (!name || !email || !password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "name, email, and password are required.",
    );
  }

  if (role && role !== "contributor" && role !== "maintainer") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "role must be either 'contributor' or 'maintainer'.",
    );
  }

  const existing = await pool.query(
    `SELECT id FROM users WHERE email=$1`,
    [email],
  );
  if (existing.rows.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A user with this email already exists.",
    );
  }

  const hashedPassword = await bcrypt.hash(password, config.bcrypt_salt_rounds);

  const result = await pool.query<IUserRow>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role ?? null],
  );

  return result.rows[0];
};

const loginFromDB = async (payload: ILoginPayload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "email and password are required.",
    );
  }

  const result = await pool.query<IUserRow>(
    `SELECT id, name, email, password, role, created_at, updated_at
     FROM users WHERE email=$1`,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid email or password.");
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwt_secret,
    { expiresIn: config.jwt_expires_in as jwt.SignOptions["expiresIn"] },
  );

  const { password: _pw, ...safeUser } = user;

  return { token, user: safeUser };
};

export const authService = {
  signupIntoDB,
  loginFromDB,
};
