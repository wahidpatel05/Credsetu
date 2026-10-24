import "dotenv/config"; // loads values from the .env file into process.env
import { app } from "./app";
import { createTables } from "./db";

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  await createTables();
  // "0.0.0.0" means: accept requests from other devices too (like your phone on the same Wi-Fi).
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ MiniLedger API running on http://localhost:${PORT}`);
  });
}

start();
