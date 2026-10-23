import { type NextRequest, NextResponse } from "next/server";

import { corsHeaders } from "@/server/cors";

// The marketing pages are gone, so "/" has nothing to render. Everything that
// is not the app itself goes to the sign-in page.
const APP_ENTRY_POINT = "/login";

// Widget-facing routes that need CORS for cross-origin browser requests
function needsCors(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1/widget/") ||
    pathname.startsWith("/api/v1/feedback")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS handling for widget-facing API routes — applied at the proxy level
  // so headers survive any downstream redirects (e.g. trailing-slash 307s)
  if (needsCors(pathname)) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: origin ? corsHeaders(origin) : undefined,
      });
    }

    const response = NextResponse.next();
    if (origin) {
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        response.headers.set(key, value);
      }
    }
    return response;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(APP_ENTRY_POINT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Widget-facing API routes (CORS)
    "/api/v1/widget/:path*",
    "/api/v1/feedback/:path*",
    // Non-static routes (cloud/self-hosted proxy)
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
