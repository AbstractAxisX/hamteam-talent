"use client";

import { create } from "zustand";

export type Route =
  | { view: "feed" }
  | { view: "dashboard" }
  | { view: "following" }
  | { view: "discover" }
  | { view: "talents" }
  | { view: "needs" }
  | { view: "need"; id: string }
  | { view: "create-need" }
  | { view: "my-needs" }
  | { view: "category"; id: string }
  | { view: "profile"; id: string }
  | { view: "my-profile" }
  | { view: "edit-profile" }
  | { view: "connections" }
  | { view: "chat"; conversationId?: string }
  | { view: "notifications" }
  | { view: "tickets" }
  | { view: "ticket"; id: string }
  | { view: "settings" }
  | { view: "admin" }
  | { view: "auth" };

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "feed" };
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [path, ...rest] = hash.split("/");
  switch (path) {
    case "feed": return { view: "feed" };
    case "dashboard": return { view: "dashboard" };
    case "discover": return { view: "discover" };
    case "following": return { view: "following" };
    case "talents": return { view: "talents" };
    case "needs": return { view: "needs" };
    case "need": return { view: "need", id: rest[0] || "" };
    case "create-need": return { view: "create-need" };
    case "my-needs": return { view: "my-needs" };
    case "category": return { view: "category", id: rest[0] || "" };
    case "profile": return { view: "profile", id: rest[0] || "" };
    case "my-profile": return { view: "my-profile" };
    case "edit-profile": return { view: "edit-profile" };
    case "connections": return { view: "connections" };
    case "chat": return { view: "chat", conversationId: rest[0] };
    case "notifications": return { view: "notifications" };
    case "tickets": return { view: "tickets" };
    case "ticket": return { view: "ticket", id: rest[0] || "" };
    case "settings": return { view: "settings" };
    case "admin": return { view: "admin" };
    case "auth": return { view: "auth" };
    default: return { view: "feed" };
  }
}

function routeToHash(r: Route): string {
  switch (r.view) {
    case "profile": return `#/profile/${r.id}`;
    case "category": return `#/category/${r.id}`;
    case "need": return `#/need/${r.id}`;
    case "chat": return r.conversationId ? `#/chat/${r.conversationId}` : "#/chat";
    case "ticket": return `#/ticket/${r.id}`;
    default: return `#/${r.view}`;
  }
}

interface NavState {
  route: Route;
  setRoute: (r: Route) => void;
  init: () => () => void;
}

export const useNav = create<NavState>((set) => ({
  route: typeof window !== "undefined" ? parseHash() : { view: "feed" },
  setRoute: (r) => {
    if (typeof window !== "undefined") {
      window.location.hash = routeToHash(r);
    }
    set({ route: r });
  },
  init: () => {
    if (typeof window === "undefined") return () => {};
    const handler = () => set({ route: parseHash() });
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  },
}));

export function navigate(r: Route) {
  useNav.getState().setRoute(r);
}
