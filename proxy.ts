import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = request.cookies.get("admin_session");

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Validate session token
    try {
      const sessionData = JSON.parse(
        Buffer.from(session.value, "base64").toString()
      );
      const expiresAt = new Date(sessionData.expiresAt);

      if (expiresAt <= new Date()) {
        const response = NextResponse.redirect(
          new URL("/admin/login", request.url)
        );
        response.cookies.delete("admin_session");
        return response;
      }
    } catch {
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete("admin_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
