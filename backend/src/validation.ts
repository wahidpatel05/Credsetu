import { z } from "zod";

// These "schemas" describe what a valid request body looks like.
// If the body doesn't match, zod tells us exactly what is wrong.

// Phone must be exactly 10 digits, e.g. "9876543210".
export const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const newLoanSchema = z.object({
  friendName: z.string().trim().min(1, "Friend name is required").max(100),
  // z.coerce turns "500" (text from a form) into the number 500.
  amount: z.coerce.number().positive("Amount must be more than 0").max(10_000_000),
  // Date must look like 2026-12-31 and be a real date.
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
    .refine((value) => !isNaN(Date.parse(value)), "Due date is not a real date"),
});

// Turns zod's error into one simple message like "Phone must be 10 digits".
export function firstErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
