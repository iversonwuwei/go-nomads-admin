import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot-password", "/privacy"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function parseRoleFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;

    const role =
      payload.role ??
      payload.roles ??
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    if (typeof role === "string") return role.toLowerCase();
    if (Array.isArray(role) && role.length > 0) {
      const first = role[0];
      if (typeof first === "string") return first.toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_access_token")?.value;
  const hasToken = Boolean(token);

  if (!hasToken && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && !isPublicPath(pathname)) {
    const role = parseRoleFromJwt(token || "");
    if (role && role !== "admin" && role !== "superadmin") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("forbidden", "1");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("admin_access_token");
      response.cookies.delete("admin_refresh_token");
      return response;
    }
  }

  if (hasToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
