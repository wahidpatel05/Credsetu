import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { loansRouter } from "./routes/loans";

// We build the app in its own file (without starting it) so tests can use it too.
export const app = express();

app.use(cors()); // allow the mobile app to call this API
app.use(express.json()); // read JSON request bodies
app.use("/uploads", express.static("uploads")); // serve receipt photos as normal links

app.get("/", (_req, res) => {
  res.json({ message: "MiniLedger API is running" });
});

app.use("/auth", authRouter);
app.use("/loans", loansRouter);

// If anything crashes inside a route, we end up here and send a clean error.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});
