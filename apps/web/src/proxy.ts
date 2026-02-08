import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE } from "@/lib/session";

const APP_PATHS = ["/today", "/library", "/lists", "/contests", "/stats", "/settings"];
const AUTH_PATHS = ["/login", "/register"];

function isAppPath(pathname: string) {
  return APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals and public assets.
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  if (isAppPath(pathname) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath(pathname) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|robots.txt|sitemap.xml).*)"],
};
