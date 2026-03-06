import { NextResponse } from "next/server";

type AuditEventPayload = {
  scope?: string;
  entityId?: string;
  action?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  happenedAt?: string;
};

type AuditEvent = {
  id: string;
  scope: string;
  entityId: string;
  action: string;
  note: string;
  metadata: Record<string, unknown>;
  happenedAt: string;
};

const inMemoryAuditEvents: AuditEvent[] = [];

function getApiBase(): string {
  return process.env.API_BASE || "https://api.go-nomads.com/api/v1";
}

function getAuthToken(): string | undefined {
  return process.env.ADMIN_BEARER_TOKEN;
}

function isDryRun() {
  return process.env.ADMIN_ACTION_DRY_RUN !== "false";
}

function parseScope(input?: string) {
  const scope = (input || "").trim();
  return scope || "global";
}

function mapEvent(raw: AuditEventPayload) {
  const scope = parseScope(raw.scope);
  const entityId = (raw.entityId || "").trim();
  const action = (raw.action || "").trim();
  const note = (raw.note || "").trim();
  const happenedAt = (raw.happenedAt || "").trim() || new Date().toISOString();

  return {
    id: `${scope}-${entityId || "na"}-${action || "na"}-${Date.now()}`,
    scope,
    entityId,
    action,
    note,
    metadata: raw.metadata || {},
    happenedAt,
  } satisfies AuditEvent;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope") || "global");

  if (isDryRun()) {
    const rows = inMemoryAuditEvents.filter((x) => x.scope === scope).slice(0, 100);
    return NextResponse.json({ success: true, message: "OK(dry-run)", data: rows });
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const endpoint = `${getApiBase()}/admin/audit/events?scope=${encodeURIComponent(scope)}`;
  const upstream = await fetch(endpoint, {
    method: "GET",
    headers,
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ success: false, message: "Upstream network error", data: [] }, { status: 502 });
  }

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, message: `Upstream ${upstream.status}`, data: [] },
      { status: upstream.status },
    );
  }

  return NextResponse.json(raw ?? { success: true, message: "OK", data: [] });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AuditEventPayload;
  const event = mapEvent(body);

  if (!event.action || !event.note) {
    return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
  }

  if (isDryRun()) {
    inMemoryAuditEvents.unshift(event);
    if (inMemoryAuditEvents.length > 500) inMemoryAuditEvents.length = 500;

    return NextResponse.json({
      success: true,
      message: "Saved(dry-run)",
      data: event,
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const endpoint = `${getApiBase()}/admin/audit/events`;
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ success: false, message: "Upstream network error" }, { status: 502 });
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, message: `Upstream ${upstream.status}`, details: raw },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ success: true, message: "Saved", data: event, upstream: raw });
}
