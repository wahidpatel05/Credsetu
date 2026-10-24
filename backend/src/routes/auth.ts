import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db";
import { phoneSchema, verifyOtpSchema, firstErrorMessage } from "../validation";

export const authRouter = Router();

// We keep OTPs in memory (a simple Map): phone -> { otp, expiresAt }.
// This is fine for a mock OTP. In a real app we'd use SMS + store it in a database/Redis.
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const OTP_VALID_FOR_MS = 5 * 60 * 1000; // 5 minutes

// Step 1: user enters phone -> we create an OTP and print it in the server log.
authRouter.post("/request-otp", (req, res) => {
  const parsed = phoneSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstErrorMessage(parsed.error) });
  }

  const { phone } = parsed.data;
  const otp = crypto.randomInt(100000, 1000000).toString(); // random 6-digit number
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_VALID_FOR_MS });

  console.log(`📱 OTP for ${phone} is ${otp}`); // mock SMS
  res.json({ message: "OTP sent (check the server log)" });
});

// Step 2: user enters the OTP -> if correct, we give back a login token.
authRouter.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstErrorMessage(parsed.error) });
  }

  const { phone, otp } = parsed.data;
  const saved = otpStore.get(phone);

  if (!saved || saved.expiresAt < Date.now()) {
    return res.status(400).json({ error: "OTP expired, please request a new one" });
  }
  if (saved.otp !== otp) {
    return res.status(400).json({ error: "Wrong OTP" });
  }

  otpStore.delete(phone); // an OTP can only be used once

  // Find the user, or create them if this is their first login.
  // "ON CONFLICT ... DO UPDATE" means: if this phone already exists, just return that row.
  const user = await pool.query(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [phone]
  );
  const userId = user.rows[0].id;

  // Make a long random token and remember which user it belongs to.
  const token = crypto.randomBytes(32).toString("hex");
  await pool.query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);

  res.json({ token });
});
