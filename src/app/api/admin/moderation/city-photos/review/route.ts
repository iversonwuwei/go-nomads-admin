import { NextResponse } from "next/server";

type ReviewPayload = {
  cityId?: string;
  photoId?: string;
  action?: "approve" | "reject";
  reason?: string;
};

function getApiBase(): string {
  return process.env.API_BASE || "https://api.go-nomads.com/api/v1";
}

function getAuthToken(): string | undefined {
  return process.env.ADMIN_BEARER_TOKEN;
}

function isDryRun() {
  return process.env.ADMIN_ACTION_DRY_RUN !== "false";
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

  if (isDryRun()) {
    return NextResponse.json({
      success: true,
      message: "Dry-run success (backend review endpoint not finalized)",
      data: {
        cityId,
        photoId,
        action,
        reason,
        reviewedAt: new Date().toISOString(),
      },
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // NOTE: backend endpoint is planned; keep path configurable and explicit.
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

  return NextResponse.json({
    success: true,
    message: "Review submitted",
    upstream: raw,
  });
}
