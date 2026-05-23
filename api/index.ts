import app from "../app";
import { initDB } from "../src/db/index";

let dbInitialized = false;

const ensureDB = async () => {
  if (dbInitialized) return;
  await initDB();
  dbInitialized = true;
};

export default async (req: any, res: any) => {
  try {
    await ensureDB();
  } catch (err) {
    console.error("DB init failed:", err);
  }
  return app(req, res);
};
