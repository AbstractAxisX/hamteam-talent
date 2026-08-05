// Session-based auth using signed httpOnly cookies.
// Two separate auth flows:
// 1. User auth: phone + OTP (demo OTP = 1234)
// 2. Admin auth: username + password (separate AdminUser table, separate cookie)
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";

const USER_COOKIE = "hamteam_u";
const ADMIN_COOKIE = "hamteam_a";
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

// ── User session ──
export async function createUserSession(userId: string) {
  const token = sign(`u:${userId}`);
  const store = await cookies();
  store.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyUserSession() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !payload.startsWith("u:")) return null;
  const userId = payload.slice(2);
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

// ── Admin session ──
export async function createAdminSession(adminId: string) {
  const token = sign(`a:${adminId}`);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !payload.startsWith("a:")) return null;
  const adminId = payload.slice(2);
  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  return admin;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("ADMIN_UNAUTHORIZED");
  return admin;
}

// ── Password hashing (simple SHA-256 + salt) ──
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
  } catch {
    return false;
  }
}

// ── Demo OTP for user auth ──
export const DEMO_OTP = "1234";

interface PendingAuth {
  name: string;
  phone: string;
  otp: string;
  expires: number;
}
const pending = new Map<string, PendingAuth>();

export function stageAuth(data: PendingAuth): string {
  pending.set(data.phone, data);
  return data.otp;
}

export function getPendingAuth(phone: string): PendingAuth | null {
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
