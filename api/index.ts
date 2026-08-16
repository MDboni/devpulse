import app from "../app";

/**
 * Vercel serverless entry point.
 *
 * An Express app is itself a `(req, res)` request listener, so it can be the
 * default export directly. Schema bootstrap is handled by the `ensureDB`
 * middleware inside the app, which keeps this file free of untyped shims.
 */
export default app;
