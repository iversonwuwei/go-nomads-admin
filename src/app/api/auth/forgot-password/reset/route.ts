import { NextResponse } from "next/server";
import { getApiBase, normalizeEnvelope } from "../../_utils";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    emailOrPhone?: string;
    code?: string;
    newPassword?: string;
  };

  const emailOrPhone = (body.emailOrPhone || "").trim();
  const code = (body.code || "").trim();
  const newPassword = body.newPassword || "";

  if (!emailOrPhone || !code || !newPassword) {
    return NextResponse.json(
      { success: false, message: "请填写完整重置信息", data: null, errors: [] },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/auth/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone, code, newPassword }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<null>(raw, "重置密码失败");
  return NextResponse.json(normalized, { status: upstream.status });
}
