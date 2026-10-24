import { Pool, types } from "pg";

// By default "pg" turns a DATE column into a JavaScript Date object, which can shift
// the day because of time zones. 1082 is the id of the DATE type; we keep it as plain text.
types.setTypeParser(1082, (value) => value);

// A "pool" keeps a few open connections to PostgreSQL so we can reuse them.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Creates our 3 tables if they don't exist yet. Runs once when the server starts.
export async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      phone      TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- A session = "this token belongs to this user". Created after OTP login.
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- One row for every time the user lends money to a friend.
    CREATE TABLE IF NOT EXISTS loans (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name TEXT NOT NULL,
      amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      due_date    DATE NOT NULL,
      is_repaid   BOOLEAN NOT NULL DEFAULT FALSE,
      repaid_at   TIMESTAMPTZ,
      receipt_url TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
