"use client";

import { create } from "zustand";

type RouteBase =
  | { view: "feed" }
  | { view: "dashboard" }
  | { view: "explore" }
  | { view: "post"; id: string }
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
  | { view: "onboarding" }
  | { view: "admin" }
  | { view: "auth" };

/** مسیر + پارامترهای اختیاری query داخل هش (مثل #/discover?cat=x) */
export type Route = RouteBase & { params?: Record<string, string> };

function parseBase(path: string, rest: string[]): RouteBase {
  switch (path) {
    case "post": return { view: "post", id: rest[0] || "" };
    case "discover": return { view: "discover" };
    case "profile": return { view: "profile", id: rest[0] || "" };
    case "category": return { view: "category", id: rest[0] || "" };
    case "need": return { view: "need", id: rest[0] || "" };
    case "chat": return { view: "chat", conversationId: rest[0] };
    case "ticket": return { view: "ticket", id: rest[0] || "" };
    case "feed": return { view: "feed" };
    case "dashboard": return { view: "dashboard" };
    case "explore": return { view: "explore" };
    case "following": return { view: "following" };
    case "talents": return { view: "talents" };
    case "needs": return { view: "needs" };
    case "create-need": return { view: "create-need" };
    case "my-needs": return { view: "my-needs" };
    case "my-profile": return { view: "my-profile" };
    case "edit-profile": return { view: "edit-profile" };
    case "connections": return { view: "connections" };
    case "notifications": return { view: "notifications" };
    case "tickets": return { view: "tickets" };
    case "settings": return { view: "settings" };
    case "onboarding": return { view: "onboarding" };
    case "admin": return { view: "admin" };
    case "auth": return { view: "auth" };
    default: return { view: "feed" };
  }
}

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "feed" };
  const raw = window.location.hash.replace(/^#\/?/, "");
  // تفکیک مسیر از query داخل هش — پیش از این #/discover?cat=x به feed سقوط می‌کرد
  const qIdx = raw.indexOf("?");
  const qs = qIdx >= 0 ? raw.slice(qIdx + 1) : "";
  const pathPart = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const params: Record<string, string> = {};
  new URLSearchParams(qs).forEach((v, k) => {
    if (v) params[k] = v;
  });
  const [path, ...rest] = pathPart.split("/");
  const base = parseBase(path, rest);
  return Object.keys(params).length > 0 ? { ...base, params } : base;
}

function routeToHash(r: Route): string {
  let base: string;
  switch (r.view) {
    case "profile": base = `#/profile/${r.id}`; break;
    case "category": base = `#/category/${r.id}`; break;
    case "need": base = `#/need/${r.id}`; break;
    case "post": base = `#/post/${r.id}`; break;
    case "chat": base = r.conversationId ? `#/chat/${r.conversationId}` : "#/chat"; break;
    case "ticket": base = `#/ticket/${r.id}`; break;
    default: base = `#/${r.view}`; break;
  }
  if (r.params && Object.keys(r.params).length > 0) {
    const qs = new URLSearchParams(r.params).toString();
    return `${base}?${qs}`;
  }
  return base;
}

interface NavState {
  route: Route;
  setRoute: (r: Route) => void;
  init: () => () => void;
}

export const useNav = create<NavState>((set) => ({
  // Always start with "feed" on both server and client to prevent hydration mismatch.
  // The actual route is synced after mount in init().
  route: { view: "feed" },
  setRoute: (r) => {
    if (typeof window !== "undefined") {
      window.location.hash = routeToHash(r);
    }
    set({ route: r });
  },
  init: () => {
    if (typeof window === "undefined") return () => {};
    // Sync route from hash after mount (avoids SSR hydration mismatch)
    set({ route: parseHash() });
    const handler = () => set({ route: parseHash() });
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  },
}));

export function navigate(r: Route) {
  useNav.getState().setRoute(r);
}
