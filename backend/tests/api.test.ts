// These tests call the real API, so PostgreSQL must be running (docker compose up -d).
import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { pool, createTables } from "../src/db";

// A random phone so each test run is a fresh user.
const phone = "9" + Math.floor(100000000 + Math.random() * 899999999);
let token = "";

beforeAll(async () => {
  await createTables();
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE phone = $1", [phone]); // clean up test data
  await pool.end();
});

describe("MiniLedger API", () => {
  it("rejects requests without a login token", async () => {
    const res = await request(app).get("/loans");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid phone number", async () => {
    const res = await request(app).post("/auth/request-otp").send({ phone: "123" });
    expect(res.status).toBe(400);
  });

  it("logs in with phone + OTP", async () => {
    // The OTP is only printed in the log, so we "spy" on console.log to read it.
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await request(app).post("/auth/request-otp").send({ phone }).expect(200);
    const otp = String(logSpy.mock.calls[0][0]).match(/\d{6}$/)![0];
    logSpy.mockRestore();

    const wrong = await request(app).post("/auth/verify-otp").send({ phone, otp: otp === "111111" ? "222222" : "111111" });
    expect(wrong.status).toBe(400);

    const res = await request(app).post("/auth/verify-otp").send({ phone, otp });
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  it("adds loans, marks one repaid and returns the right summary", async () => {
    const auth = { Authorization: `Bearer ${token}` };

    const bad = await request(app).post("/loans").set(auth).send({ friendName: "", amount: 100, dueDate: "2026-12-01" });
    expect(bad.status).toBe(400);

    const first = await request(app).post("/loans").set(auth).send({ friendName: "Rahul", amount: 1000, dueDate: "2999-01-01" });
    expect(first.status).toBe(201);
    await request(app).post("/loans").set(auth).send({ friendName: "Priya", amount: 300, dueDate: "2020-01-01" }).expect(201);

    await request(app).patch(`/loans/${first.body.id}/repay`).set(auth).expect(200);

    const list = await request(app).get("/loans").set(auth);
    expect(list.body).toHaveLength(2);

    const summary = await request(app).get("/loans/summary").set(auth);
    expect(summary.body).toEqual({ totalLent: 1300, totalRepaid: 1000, pending: 300, overdueAmount: 300 });
  });
});
