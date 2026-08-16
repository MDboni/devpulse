import { Pool } from "pg";
import config from "../config/index";

if (!config.database_url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env locally, or to the environment variables of your deployment platform.",
  );
}

export const pool = new Pool({
  connectionString: config.database_url,
  ssl: {
    rejectUnauthorized: false,
  },
  // Serverless invocations are short-lived; keep the pool small and let idle
  // clients go so a suspended host (e.g. Neon free tier) does not hold sockets.
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
});

// A pooled client can fail after checkout (host suspend, network drop). Without
// a listener, `pg` escalates that to an uncaught exception and kills the process.
pool.on("error", (error) => {
  console.error("Unexpected error on idle PostgreSQL client:", error);
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor','maintainer')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug','feature_request')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
    reporter_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

let schemaReady: Promise<void> | null = null;

/**
 * Creates the schema if it does not exist.
 *
 * The result is cached per process so that concurrent requests hitting a cold
 * serverless instance share a single round trip instead of each issuing their
 * own CREATE TABLE. A failed attempt is not cached, so the next request retries.
 */
export const initDB = async (): Promise<void> => {
  if (!schemaReady) {
    schemaReady = pool
      .query(SCHEMA_SQL)
      .then(() => {
        console.log("Database connection successful and tables are ready.");
      })
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
};

export default pool;
