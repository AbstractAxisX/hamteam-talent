// Session-based auth using signed httpOnly cookies (no external deps).
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";

const SESSION_COOKIE = "sn_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production-please";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(token: string): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  // timing-safe compare
  if (sig.length !== expected.length) return null;
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

export async function createSession(userId: string) {
  const token = sign(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): string | undefined {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || user.isBanned) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

// Demo OTP — fixed code for development (per requirement doc, no real SMS)
export const DEMO_OTP = "1234";

// OTP staging: stores pending auth attempts temporarily in-memory
interface PendingReg {
  mode: "register" | "login";
  name: string;
  phone: string;
  nationalId: string;
  existingUserId?: string;
  otp: string;
  expires: number;
}
const pending = new Map<string, PendingReg>();

export function stageAuth(data: PendingReg): string {
  pending.set(data.phone, data);
  return data.otp;
}

export function getPendingAuth(phone: string): PendingReg | null {
  const reg = pending.get(phone);
  if (!reg) return null;
  if (Date.now() > reg.expires) {
    pending.delete(phone);
    return null;
  }
  return reg;
}

export function clearPendingAuth(phone: string) {
  pending.delete(phone);
}
