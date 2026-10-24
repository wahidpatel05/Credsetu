// A loan as it comes out of the database.
export type Loan = {
  id: number;
  friend_name: string;
  amount: string; // PostgreSQL sends NUMERIC as text, so we convert it with Number()
  due_date: string; // "YYYY-MM-DD"
  is_repaid: boolean;
  repaid_at: string | null;
  receipt_url: string | null;
  created_at: string;
};

// Today's date as "YYYY-MM-DD" (same format as due_date), in the server's local time.
export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// A loan is overdue if it is NOT repaid and its due date is already in the past.
export function isOverdue(loan: Loan, today: string) {
  return !loan.is_repaid && loan.due_date < today;
}

// Adds up the numbers for the summary card.
export function calculateSummary(loans: Loan[], today: string) {
  let totalLent = 0;
  let totalRepaid = 0;
  let overdueAmount = 0;

  for (const loan of loans) {
    const amount = Number(loan.amount);
    totalLent += amount;
    if (loan.is_repaid) totalRepaid += amount;
    if (isOverdue(loan, today)) overdueAmount += amount;
  }

  return {
    totalLent,
    totalRepaid,
    pending: totalLent - totalRepaid,
    overdueAmount,
  };
}
