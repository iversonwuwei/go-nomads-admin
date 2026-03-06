import { NextResponse } from "next/server";

type ReportActionPayload = {
  reportId?: string;
  action?: "assign" | "resolve" | "dismiss";
  note?: string;
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
  const body = (await request.json().catch(() => ({}))) as ReportActionPayload;
  const reportId = (body.reportId || "").trim();
  const action = body.action;
  const note = (body.note || "").trim();

  if (!reportId || !action) {
    return NextResponse.json(
      { success: false, message: "Invalid payload" },
      { status: 400 },
    );
  }

  if (isDryRun()) {
    return NextResponse.json({
      success: true,
      message: "Dry-run success (report admin action endpoint pending)",
      data: {
        reportId,
        action,
        note,
        operatedAt: new Date().toISOString(),
      },
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // NOTE: endpoint is a planned backend contract.
  const endpoint = `${getApiBase()}/reports/${encodeURIComponent(reportId)}/${action}`;

  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ note }),
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
    message: "Report action submitted",
    upstream: raw,
  });
}
