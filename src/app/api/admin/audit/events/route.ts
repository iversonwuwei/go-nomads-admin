import { resolveApiBase } from "@/app/lib/runtime-api-base";
import { cookies } from "next/headers";
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

function getApiBase(): string {
  return resolveApiBase();
}

function getAuthToken(): string | undefined {
  return process.env.ADMIN_BEARER_TOKEN;
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

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value || getAuthToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "未登录", data: [] }, { status: 401 });
  }
  const headers: HeadersInit = {};
  headers.Authorization = `Bearer ${token}`;

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

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_access_token")?.value || getAuthToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  }
  const headers: HeadersInit = { "Content-Type": "application/json" };
  headers.Authorization = `Bearer ${token}`;

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

  try {
    const json = raw ? JSON.parse(raw) : { success: true, message: "Saved", data: event };
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ success: true, message: "Saved", raw });
  }
}
