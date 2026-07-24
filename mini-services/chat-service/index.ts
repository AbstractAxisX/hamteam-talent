// Chat socket.io mini-service for همتیم (HamTeam)
// Runs on port 3003. The Next.js frontend connects via Caddy gateway using:
//   io("/", { path: "/", query: { XTransformPort: "3003" }, auth: { userId } })
//
// Responsibilities:
//   - Accept connections with `auth: { userId }`
//   - `join` event: join room `conv:${conversationId}`
//   - `message` event: persist via Prisma, broadcast to room
//   - `typing` event: broadcast to room (no persistence)
//
// The DB path is set absolutely so this independent bun project can resolve it
// reliably from the parent project's Prisma client install.

import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

// Configure DB URL to point at the parent project's SQLite file.
// Bun resolves `@prisma/client` from the parent project's node_modules.
process.env.DATABASE_URL = "file:/home/z/my-project/db/custom.db";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

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

async function isParticipant(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conv) return false;
  return conv.userAId === userId || conv.userBId === userId;
}

io.on("connection", (socket) => {
  const userId = (socket.handshake.auth as { userId?: string } | undefined)?.userId;
  if (!userId) {
    socket.emit("error", { message: "auth required" });
    socket.disconnect(true);
    return;
  }
  socket.data.userId = userId;
  console.log(`[chat] connected: user=${userId} socket=${socket.id}`);

  socket.on("join", async (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      if (!conversationId) return;
      const ok = await isParticipant(conversationId, userId);
      if (!ok) {
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
      const senderId = String(data?.senderId || userId);
      const content = String(data?.content || "").trim();
      if (!conversationId || !content) return;
      if (senderId !== userId) return; // can't spoof sender
      if (content.length > 4000) return;

      const ok = await isParticipant(conversationId, senderId);
      if (!ok) {
        socket.emit("error", { message: "not a participant" });
        return;
      }

      const msg = await prisma.message.create({
        data: { conversationId, senderId, content },
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
        `[chat] message: conv=${conversationId} sender=${senderId} len=${content.length}`
      );
    } catch (err) {
      console.error("[chat] message error", err);
    }
  });

  socket.on("typing", (data) => {
    try {
      const conversationId = String(data?.conversationId || "");
      const typingUserId = String(data?.userId || userId);
      if (!conversationId || typingUserId !== userId) return;
      // Broadcast to others in the room; client filters as needed
      socket.to(roomFor(conversationId)).emit("typing", {
        conversationId,
        userId: typingUserId,
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
  console.log(`[chat-service] socket.io server listening on port ${PORT}`);
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
