import { NextResponse } from "next/server";
import { extractTokens, getApiBase, normalizeEnvelope, withAuthCookies } from "../_utils";

function normalizeRole(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}

function isAdminRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "admin" || role === "superadmin";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "邮箱和密码不能为空", data: null, errors: [] },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw, "登录失败");

  if (!upstream.ok || !normalized.success) {
    return NextResponse.json(normalized, { status: upstream.status });
  }

  const authPayload = (normalized.data ?? {}) as Record<string, unknown>;
  const authUser = (authPayload.user ?? authPayload.User ?? {}) as Record<string, unknown>;
  const role = authUser.role ?? authUser.Role;

  if (!isAdminRole(role)) {
    return NextResponse.json(
      {
        success: false,
        message: "当前账号没有管理后台权限，请使用管理员账号登录",
        data: null,
        errors: [],
      },
      { status: 403 },
    );
  }

  const response = NextResponse.json(normalized, { status: upstream.status });
  withAuthCookies(response, extractTokens(raw));
  return response;
}
