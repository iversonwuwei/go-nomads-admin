import { NextResponse } from "next/server";
import { getApiBase, normalizeEnvelope } from "../../_utils";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { emailOrPhone?: string };
  const emailOrPhone = (body.emailOrPhone || "").trim();

  if (!emailOrPhone) {
    return NextResponse.json(
      { success: false, message: "请输入邮箱或手机号", data: null, errors: [] },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/auth/forgot-password/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw, "发送验证码失败");
  return NextResponse.json(normalized, { status: upstream.status });
}
