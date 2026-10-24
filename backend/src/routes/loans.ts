import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db";
import { requireLogin, AuthRequest } from "../auth";
import { newLoanSchema, firstErrorMessage } from "../validation";
import { calculateSummary, isOverdue, todayString, Loan } from "../summary";

export const loansRouter = Router();

// Every route in this file needs the user to be logged in.
loansRouter.use(requireLogin);

// "multer" reads file uploads (the receipt photo) and saves them in the uploads/ folder.
const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
      // Give each file a unique name so two uploads never overwrite each other.
      const extension = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
  fileFilter: (_req, file, cb) => {
    // Only accept images (check the file type, or the file name ending like ".jpg").
    const isImage = file.mimetype.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.originalname);
    cb(null, isImage);
  },
});

// GET /loans -> all loans of the logged-in user (newest first).
loansRouter.get("/", async (req: AuthRequest, res) => {
  const result = await pool.query<Loan>(
    "SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC",
    [req.userId]
  );

  // Add an "isOverdue" flag so the app knows which rows to highlight.
  const today = todayString();
  const loans = result.rows.map((loan) => ({ ...loan, isOverdue: isOverdue(loan, today) }));
  res.json(loans);
});

// GET /loans/summary -> total lent, total repaid, overdue amount.
loansRouter.get("/summary", async (req: AuthRequest, res) => {
  const result = await pool.query<Loan>("SELECT * FROM loans WHERE user_id = $1", [req.userId]);
  res.json(calculateSummary(result.rows, todayString()));
});

// POST /loans -> add a new loan. Can be plain JSON, or a form with a "receipt" photo.
loansRouter.post("/", upload.single("receipt"), async (req: AuthRequest, res) => {
  const parsed = newLoanSchema.safeParse(req.body);
  if (!parsed.success) {
    if (req.file) fs.unlinkSync(req.file.path); // bad input -> don't keep the uploaded photo
    return res.status(400).json({ error: firstErrorMessage(parsed.error) });
  }

  const { friendName, amount, dueDate } = parsed.data;
  // If a photo was uploaded, save the link to it (e.g. "/uploads/123.jpg").
  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const result = await pool.query<Loan>(
    `INSERT INTO loans (user_id, friend_name, amount, due_date, receipt_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.userId, friendName, amount, dueDate, receiptUrl]
  );

  res.status(201).json(result.rows[0]);
});

// PATCH /loans/:id/repay -> mark a loan as repaid.
loansRouter.patch("/:id/repay", async (req: AuthRequest, res) => {
  const loanId = Number(req.params.id);
  if (!Number.isInteger(loanId)) {
    return res.status(400).json({ error: "Invalid loan id" });
  }

  // "AND user_id = $2" makes sure you can only update YOUR OWN loans.
  const result = await pool.query<Loan>(
    `UPDATE loans SET is_repaid = TRUE, repaid_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [loanId, req.userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Loan not found" });
  }
  res.json(result.rows[0]);
});
