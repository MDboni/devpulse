import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

/** Reads a variable that the app cannot run without. */
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `${key} is not set. Add it to .env locally, or to the environment variables of your deployment platform, then redeploy.`,
    );
  }
  return value;
};

// The assignment pins bcrypt's work factor to this range: below it the hash is
// too cheap, above it a serverless invocation risks timing out.
const MIN_SALT_ROUNDS = 8;
const MAX_SALT_ROUNDS = 12;
const DEFAULT_SALT_ROUNDS = 10;

const readSaltRounds = (): number => {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  if (!raw) return DEFAULT_SALT_ROUNDS;

  const parsed = Number.parseInt(raw, 10);
  if (
    Number.isNaN(parsed) ||
    parsed < MIN_SALT_ROUNDS ||
    parsed > MAX_SALT_ROUNDS
  ) {
    throw new Error(
      `BCRYPT_SALT_ROUNDS must be an integer between ${MIN_SALT_ROUNDS} and ${MAX_SALT_ROUNDS}; received "${raw}".`,
    );
  }
  return parsed;
};

const config = {
  port: parseInt(process.env.PORT || "5000"),
  database_url: required("DATABASE_URL"),
  jwt_secret: required("JWT_SECRET"),
  jwt_expires_in: process.env.JWT_EXPIRES_IN || "7d",
  bcrypt_salt_rounds: readSaltRounds(),
  node_env: process.env.NODE_ENV || "development",
};

export default config;
