import { resolveApiBase } from "@/app/lib/runtime-api-base";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type ReviewPayload = {
  cityId?: string;
  photoId?: string;
  action?: "approve" | "reject";
  reason?: string;
};

function getApiBase(): string {
  return resolveApiBase();
}

function getAuthToken(): string | undefined {
  return process.env.ADMIN_BEARER_TOKEN;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ReviewPayload;
  const cityId = (body.cityId || "").trim();
  const photoId = (body.photoId || "").trim();
  const action = body.action;
  const reason = (body.reason || "").trim();

  if (!cityId || !photoId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json(
      { success: false, message: "Invalid payload" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value || getAuthToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  }
  const headers: HeadersInit = { "Content-Type": "application/json" };
  headers.Authorization = `Bearer ${token}`;

  const endpoint = `${getApiBase()}/cities/${encodeURIComponent(cityId)}/user-content/photos/${encodeURIComponent(photoId)}/${action}`;

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ reason }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { success: false, message: "Upstream network error" },
      { status: 502 },
    );
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      {
        success: false,
        message: `Upstream ${upstream.status}`,
        details: raw,
      },
      { status: upstream.status },
    );
  }

  try {
    return NextResponse.json(raw ? JSON.parse(raw) : { success: true, message: "Review submitted" });
  } catch {
    return NextResponse.json({ success: true, message: "Review submitted", raw });
  }
}
