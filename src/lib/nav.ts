"use client";

import { create } from "zustand";

export type Route =
  | { view: "feed" }
  | { view: "explore" }
  | { view: "people" }
  | { view: "jobs" }
  | { view: "job"; id: string }
  | { view: "create-job" }
  | { view: "my-jobs" }
  | { view: "profile"; id: string }
  | { view: "my-profile" }
  | { view: "edit-profile" }
  | { view: "connections" }
  | { view: "chat"; conversationId?: string }
  | { view: "notifications" }
  | { view: "tickets" }
  | { view: "ticket"; id: string }
  | { view: "admin" }
  | { view: "auth" };

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "feed" };
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [path, ...rest] = hash.split("/");
  switch (path) {
    case "explore":
      return { view: "explore" };
    case "people":
      return { view: "people" };
    case "jobs":
      return { view: "jobs" };
    case "job":
      return { view: "job", id: rest[0] || "" };
    case "create-job":
      return { view: "create-job" };
    case "my-jobs":
      return { view: "my-jobs" };
    case "profile":
      return { view: "profile", id: rest[0] || "" };
    case "edit-profile":
      return { view: "edit-profile" };
    case "connections":
      return { view: "connections" };
    case "chat":
      return { view: "chat", conversationId: rest[0] };
    case "notifications":
      return { view: "notifications" };
    case "tickets":
      return { view: "tickets" };
    case "ticket":
      return { view: "ticket", id: rest[0] || "" };
    case "admin":
      return { view: "admin" };
    case "auth":
      return { view: "auth" };
    default:
      return { view: "feed" };
  }
}

function routeToHash(r: Route): string {
  switch (r.view) {
    case "job":
      return `#/job/${r.id}`;
    case "profile":
      return `#/profile/${r.id}`;
    case "chat":
      return r.conversationId ? `#/chat/${r.conversationId}` : "#/chat";
    case "ticket":
      return `#/ticket/${r.id}`;
    default:
      return `#/${r.view}`;
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
