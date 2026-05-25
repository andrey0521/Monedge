import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const path = request.nextUrl.pathname;

  const isProtected = path.startsWith("/panel");
  const isAuth = path === "/login" || path === "/register";

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuth && token) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/login", "/register"],
};
