import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  manager: "/manager",
  team_leader: "/team-leader",
  agent: "/agent",
  client: "/client",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isApiOrAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico";

  if (isApiOrAsset) return NextResponse.next();

  const token = request.cookies.get("rt_auth_token")?.value;
  const role = request.cookies.get("rt_auth_role")?.value;

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && role && isPublicRoute) {
    const home = ROLE_HOME[role] ?? "/client";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (token && role && pathname === "/") {
    const home = ROLE_HOME[role] ?? "/client";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
