import Constants from "expo-constants";
import { Platform } from "react-native";
import { File } from "expo-file-system";

// Where is our backend?
// 1. If EXPO_PUBLIC_API_URL is set (in mobile/.env), use that.
// 2. Otherwise use the same computer that is running Expo (your laptop's Wi-Fi IP), on port 4000.
//    The phone already knows this IP because it downloaded the app from it.
function findApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(":")[0]; // "192.168.1.5:8081" -> "192.168.1.5"
  return `http://${host ?? "localhost"}:4000`;
}

export const API_URL = findApiUrl();

export type Loan = {
  id: number;
  friend_name: string;
  amount: string;
  due_date: string;
  is_repaid: boolean;
  receipt_url: string | null;
  isOverdue: boolean;
};

export type Summary = {
  totalLent: number;
  totalRepaid: number;
  pending: number;
  overdueAmount: number;
};

export type NewLoan = {
  friendName: string;
  amount: string;
  dueDate: string;
  receipt: { uri: string; name: string; type: string } | null;
};

// One helper for every API call: adds the token, sends the request,
// and throws an Error with the server's message if something failed.
async function callApi(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // Only say "this is JSON" when we send a JSON string (not when we send a photo form).
  if (typeof options.body === "string") headers["Content-Type"] = "application/json";

  // If the server doesn't answer in 10 seconds, stop waiting and show an error
  // (otherwise the app would look "stuck" forever).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(API_URL + path, { ...options, headers, signal: controller.signal });
  } catch (e) {
    console.log("Request failed:", path, e); // shows the real reason in the Expo terminal
    throw new Error(`Can't reach the server at ${API_URL} (${(e as Error).message})`);
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong");
  }
  return data;
}

export function requestOtp(phone: string) {
  return callApi("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) });
}

export async function verifyOtp(phone: string, otp: string): Promise<string> {
  const data = await callApi("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) });
  return data.token;
}

export function getLoans(token: string): Promise<Loan[]> {
  return callApi("/loans", {}, token);
}

export function getSummary(token: string): Promise<Summary> {
  return callApi("/loans/summary", {}, token);
}

export function markRepaid(token: string, loanId: number) {
  return callApi(`/loans/${loanId}/repay`, { method: "PATCH" }, token);
}

// We send a "form" (FormData) instead of JSON so we can attach the receipt photo.
export async function addLoan(token: string, loan: NewLoan) {
  const form = new FormData();
  form.append("friendName", loan.friendName);
  form.append("amount", loan.amount);
  form.append("dueDate", loan.dueDate);

  if (loan.receipt) {
    if (Platform.OS === "web") {
      // In a browser we must turn the picked image into a real file (Blob) first.
      const blob = await (await fetch(loan.receipt.uri)).blob();
      form.append("receipt", blob, loan.receipt.name);
    } else {
      // On a phone, we open the picked photo as a File (from expo-file-system).
      // Expo's fetch knows how to read a File and send its bytes to the server.
      form.append("receipt", new File(loan.receipt.uri), loan.receipt.name);
    }
  }

  return callApi("/loans", { method: "POST", body: form }, token);
}

// Small helper to show money nicely, e.g. 1500 -> "₹1,500".
export function formatMoney(amount: number | string) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}
