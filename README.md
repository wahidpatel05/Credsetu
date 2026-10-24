# MiniLedger

A small app to track money you lent to friends.

- **Backend:** Node.js + TypeScript + Express + PostgreSQL
- **App:** React Native (Expo) + TypeScript

Features:

- Login with phone number + OTP (mock OTP, printed in the server log)
- Add a loan entry (friend name, amount, due date picked from a calendar) with an optional **receipt photo**
- Mark an entry as repaid
- Summary card: total lent, total repaid, still pending, overdue amount
- Overdue entries are highlighted in red
- Input validation on both the app and the server, plus backend tests

---

## How to run

### What you need

- Node.js 20 or newer
- Docker (to run PostgreSQL) — or your own PostgreSQL
- The **Expo Go** app on your phone (Android / iOS), or an Android emulator

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 (user / password / database are all `miniledger`).
The tables are created automatically when the backend starts.

### 2. Start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API runs on `http://localhost:4000`. **Keep this terminal open — the OTP is printed here.**

### 3. Start the app

In a new terminal:

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (phone and laptop must be on the same Wi-Fi).
Press `a` for an Android emulator, or `w` to open it in the browser.

The app finds the backend by itself (it uses your laptop's IP, port 4000).
If that doesn't work, create `mobile/.env` with your laptop's IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.5:4000
```

### 4. Log in

1. Enter any 10 digit phone number → **Send OTP**
2. Look at the backend terminal: `📱 OTP for 9876543210 is 482913`
3. Enter that OTP → **Verify & Login**

### Run the tests

PostgreSQL must be running (step 1).

```bash
cd backend
npm test
```

---

## API

All `/loans` routes need the header `Authorization: Bearer <token>`.

| Method | URL                   | What it does                                                   |
| ------ | --------------------- | -------------------------------------------------------------- |
| POST   | `/auth/request-otp`   | `{ phone }` → creates an OTP and prints it in the server log   |
| POST   | `/auth/verify-otp`    | `{ phone, otp }` → returns `{ token }`                         |
| GET    | `/loans`              | List of your loans (each has an `isOverdue` flag)              |
| POST   | `/loans`              | Add a loan: `friendName`, `amount`, `dueDate`, optional `receipt` photo |
| PATCH  | `/loans/:id/repay`    | Mark a loan as repaid                                          |
| GET    | `/loans/summary`      | `{ totalLent, totalRepaid, pending, overdueAmount }`           |

Example with curl:

```bash
curl -X POST localhost:4000/auth/request-otp -H "Content-Type: application/json" -d '{"phone":"9876543210"}'
curl -X POST localhost:4000/auth/verify-otp  -H "Content-Type: application/json" -d '{"phone":"9876543210","otp":"<OTP from log>"}'
curl localhost:4000/loans/summary -H "Authorization: Bearer <token>"
```

---

## Project structure

```
backend/
  src/
    index.ts         starts the server (creates tables, then listens on port 4000)
    app.ts           sets up Express: JSON, CORS, routes, error handler
    db.ts            PostgreSQL connection + CREATE TABLE statements
    auth.ts          "requireLogin" middleware: checks the token on every /loans request
    validation.ts    rules for valid input (using zod)
    summary.ts       overdue check + summary math
    routes/auth.ts   request OTP, verify OTP
    routes/loans.ts  list, add, mark repaid, summary, receipt upload
  tests/             unit tests + API tests (vitest + supertest)
  uploads/           receipt photos are saved here

mobile/
  App.tsx                       shows Login or Home depending on whether we have a token
  src/api.ts                    all calls to the backend in one place
  src/screens/LoginScreen.tsx   phone → OTP → login
  src/screens/HomeScreen.tsx    summary card + add form + list
  src/components/               SummaryCard, LoanItem, AddLoanForm, Button
  src/theme.ts                  colors
```

---

## How it works (in simple words)

### Database (3 tables)

- **users** — one row per phone number.
- **sessions** — after login we create a random token and save "this token belongs to user X".
- **loans** — every loan: who it belongs to, friend name, amount, due date, repaid or not, receipt photo link.

### Login flow

1. App sends the phone → server makes a random 6 digit OTP, keeps it in memory for 5 minutes, and prints it in the log (this is the "mock SMS").
2. App sends phone + OTP → server checks it. If correct, it finds or creates the user, creates a random **token**, saves it in `sessions`, and sends it back.
3. The app sends this token with every request. The `requireLogin` middleware looks it up in `sessions` to know who the user is.

### Overdue

A loan is **overdue** when it is **not repaid** and its **due date is before today**.
The server adds an `isOverdue` flag to every loan, and the app colors those rows red.

### Summary

The server loads all your loans and adds them up:

- `totalLent` = all amounts
- `totalRepaid` = amounts of repaid loans
- `pending` = totalLent − totalRepaid
- `overdueAmount` = amounts of overdue loans

### Receipt photo

The app uses `expo-image-picker` to choose a photo, then sends the loan as a **form** (`FormData`) with the photo inside.
On the server, `multer` saves the photo in `backend/uploads/` and we store its link (like `/uploads/123.jpg`) in the loan row.

### Validation

- **Server:** `zod` checks every request (10 digit phone, 6 digit OTP, name not empty, amount > 0, date like `2026-12-31`). Bad input gets a `400` with a clear message.
- **App:** the same checks run before sending, so the user sees the error right away.
- **Security:** every loan query has `WHERE user_id = ...`, so you can only see and change your own loans. All SQL uses `$1, $2` parameters, which prevents SQL injection.

### Things I would add in a real product

- Real SMS (e.g. Twilio / MSG91) and storing OTPs in Redis, with a limit on attempts
- Session expiry and saving the token on the phone (so you stay logged in)
- Storing receipts in cloud storage (S3) instead of the local disk
- Edit / delete entries
