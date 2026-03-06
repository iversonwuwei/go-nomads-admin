import { NextResponse } from "next/server";
import { extractTokens, getApiBase, normalizeEnvelope, withAuthCookies } from "../_utils";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
    verificationCode?: string;
  };

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const password = body.password || "";
  const verificationCode = (body.verificationCode || "").trim();

  if (!name || !email || !password || !verificationCode) {
    return NextResponse.json(
      { success: false, message: "请填写完整注册信息", data: null, errors: [] },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      verificationCode,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw, "注册失败");

  if (!upstream.ok || !normalized.success) {
    return NextResponse.json(normalized, { status: upstream.status });
  }

  const response = NextResponse.json(normalized, { status: upstream.status });
  withAuthCookies(response, extractTokens(raw));
  return response;
}
