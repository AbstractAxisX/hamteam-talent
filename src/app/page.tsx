// The app is fully driven by AppShell (in layout.tsx) via hash-based routing.
// children here is intentionally null so that AppShell's `{children ?? renderView(route)}`
// falls back to rendering the active view.
export default function Home() {
  return null;
}
