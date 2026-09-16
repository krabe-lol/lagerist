import type { NextRequest } from "next/server";

// Anything building an absolute URL a client (browser, QR scanner) has to
// follow later — a redirect Location, a URL encoded into a QR code — can't
// rely on the incoming request's Host header alone: behind a reverse proxy
// that doesn't forward the original Host, Next.js sees whatever the proxy
// connects to it as (often "localhost"), producing an unreachable link for
// anyone but the server itself. PUBLIC_APP_URL, set in the deployment env,
// is the source of truth when present; falling back to the request's own
// origin keeps local dev working without extra config.
export function resolveOrigin(request: NextRequest): string {
  const configured = process.env.PUBLIC_APP_URL;
  return configured ? configured.replace(/\/$/, "") : request.nextUrl.origin;
}
