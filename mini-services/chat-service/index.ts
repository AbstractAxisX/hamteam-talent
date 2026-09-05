// Chat socket.io mini-service for همتیم (HamTeam)
// Runs on port 3003. The Next.js frontend connects via Caddy gateway using:
//   io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { token } })
//
// Responsibilities:
//   - 🔒 Verify the HMAC-signed socket token (issued by /api/chat/socket-token)
//     — userId from the CLIENT is never trusted (impersonation fix)
//   - `join` event: join room `conv:${conversationId}` (participant check)
//   - `message` event: persist via Prisma, broadcast to room
//     · pending_request conversations: only the INITIATOR may send until accepted
//   - `typing` event: broadcast to room (no persistence)
//
// The DB path is set absolutely so this independent bun project can resolve it
// reliably from the parent project's Prisma client install.

import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Configure DB URL to point at the parent project's SQLite file.
// Bun resolves `@prisma/client` from the parent project's node_modules.
process.env.DATABASE_URL = "file:/home/z/my-project/db/custom.db";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

/* ── SESSION_SECRET — همان رازی که اپ Next استفاده می‌کند ──
   ترتیب: env مستقیم → فایل .env پروژهٔ اصلی (مسیرهای محتمل) → سقوط امن */
function loadSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const candidates = [
    path.resolve(import.meta.dir, "../../.env"), // my-project/.env
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
  ];
  for (const p of candidates) {
    try {
      const txt = fs.readFileSync(p, "utf8");
      const m = txt.match(/^SESSION_SECRET=(.+)$/m);
      if (m) return m[1].trim();
    } catch { /* next candidate */ }
  }
  return "dev-secret-change-in-production-please";
}
const SESSION_SECRET = loadSessionSecret();

/* ── توکن سوکت: `u:<userId>:<expMs>.<hmac>` ── */
function verifySocketToken(token: unknown): { userId: string } | null {
  if (typeof token !== "string" || !token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  try {
    if (
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      const parts = payload.split(":");
      if (parts[0] !== "u" || parts.length !== 3) return null;
      const userId = parts[1];
      const exp = Number(parts[2]);
      if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;
      return { userId };
    }
  } catch { /* fallthrough */ }
  return null;
}

interface ServerToClientEvents {
  message: (msg: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
  }) => void;
  typing: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  error: (err: { message: string }) => void;
}

interface ClientToServerEvents {
  join: (data: { conversationId: string }) => void;
  message: (data: { conversationId: string; senderId: string; content: string }) => void;
  typing: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
}

type InterServerEvents = Record<string, (...args: unknown[]) => void>;
interface SocketData {
  userId?: string;
}

const httpServer = createServer();
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

function roomFor(conversationId: string) {
  return `conv:${conversationId}`;
}

async function getConversation(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true, status: true, initiatorId: true },
  });
}

io.on("connection", (socket) => {
  // 🔒 فقط توکنِ امضاشده پذیرفته می‌شود — userId کلاینت هرگز اعتماد نمی‌شود
  const auth = socket.handshake.auth as { token?: unknown; userId?: unknown } | undefined;
  const verified = verifySocketToken(auth?.token);
  if (!verified) {
    socket.emit("error", { message: "invalid or expired socket token" });
    socket.disconnect(true);
    return;
  }
  const userId = verified.userId;
  socket.data.userId = userId;
  console.log(`[chat] connected: user=${userId} socket=${socket.id}`);

  socket.on("join", async (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      if (!conversationId) return;
      const conv = await getConversation(conversationId);
      if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) {
        socket.emit("error", { message: "not a participant" });
        return;
      }
      socket.join(roomFor(conversationId));
      console.log(`[chat] join: user=${userId} conv=${conversationId}`);
    } catch (err) {
      console.error("[chat] join error", err);
    }
  });

  socket.on("message", async (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      const content = String(data?.content || "").trim();
      if (!conversationId || !content) return;
      // 🔒 فرستنده همیشه از توکن می‌آید — senderId کلاینت نادیده گرفته می‌شود
      if (content.length > 4000) return;

      const conv = await getConversation(conversationId);
      if (!conv || (conv.userAId !== userId && conv.userBId !== userId)) {
        socket.emit("error", { message: "not a participant" });
        return;
      }

      // 🔒 در گفتگوی «درخواست پیام» فقط آغازگر می‌تواند بنویسد تا مقصد تأیید کند
      if (conv.status === "pending_request" && conv.initiatorId && conv.initiatorId !== userId) {
        socket.emit("error", { message: "message request not accepted yet" });
        return;
      }

      const msg = await prisma.message.create({
        data: { conversationId, senderId: userId, content },
      });

      const payload = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      };
      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(roomFor(conversationId)).emit("message", payload);
      console.log(
        `[chat] message: conv=${conversationId} sender=${userId} len=${content.length}`
      );
    } catch (err) {
      console.error("[chat] message error", err);
    }
  });

  socket.on("typing", (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      if (!conversationId) return;
      // typingUserId از توکن می‌آید (userId ارسالی کلاینت نادیده)
      socket.to(roomFor(conversationId)).emit("typing", {
        conversationId,
        userId,
        isTyping: Boolean(data?.isTyping),
      });
    } catch (err) {
      console.error("[chat] typing error", err);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[chat] disconnected: user=${userId} reason=${reason}`);
  });

  socket.on("error", (err) => {
    console.error(`[chat] socket error user=${userId}:`, err);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[chat-service] socket.io server listening on port ${PORT} (token-verified auth)`);
});

process.on("SIGTERM", () => {
  console.log("[chat-service] SIGTERM received, shutting down...");
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
});

process.on("SIGINT", () => {
  console.log("[chat-service] SIGINT received, shutting down...");
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
});
