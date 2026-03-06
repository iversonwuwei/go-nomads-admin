import { NextResponse } from "next/server";
import { clearAuthCookies, getApiBase } from "../_utils";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "已退出登录", data: null, errors: [] });
  clearAuthCookies(response);

  // 尝试通知后端退出，不阻塞前端流程。
  await fetch(`${getApiBase()}/auth/logout`, {
    method: "POST",
    cache: "no-store",
  }).catch(() => null);

  return response;
}
