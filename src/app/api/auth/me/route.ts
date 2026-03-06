import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiBase, normalizeEnvelope } from "../_utils";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "未登录", data: null, errors: [] },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${getApiBase()}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "网关连接失败", data: null, errors: [] },
      { status: 502 },
    );
  }

  const raw = await upstream.json().catch(() => ({}));
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw, "获取当前用户失败");
  return NextResponse.json(normalized, { status: upstream.status });
}
