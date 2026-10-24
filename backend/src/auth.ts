import { Request, Response, NextFunction } from "express";
import { pool } from "./db";

// Express lets us add our own field to "req". We store the logged-in user's id here.
export type AuthRequest = Request & { userId?: number };

// "Middleware" runs BEFORE the route. This one checks the login token.
// The app sends the token in a header like:  Authorization: Bearer abc123
export async function requireLogin(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Please log in" });
  }

  const result = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Session expired, please log in again" });
  }

  req.userId = result.rows[0].user_id;
  next(); // token is fine -> go to the actual route
}
