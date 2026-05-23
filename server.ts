import app from "./app";
import config from "./src/config/index";
import { initDB, pool } from "./src/db/index";

const main = async () => {
  try {
    await initDB();
    const server = app.listen(config.port, () => {
      console.log(`DevPulse API listening on port ${config.port}`);
    });

    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

main();
