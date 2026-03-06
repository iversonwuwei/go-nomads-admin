import { NextResponse } from "next/server";
import { getApiBase, normalizeEnvelope } from "../../_utils";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim();

  if (!email) {
    return NextResponse.json(
      { success: false, message: "邮箱不能为空", data: null, errors: [] },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/auth/register/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<null>(raw, "发送验证码失败");
  return NextResponse.json(normalized, { status: upstream.status });
}
