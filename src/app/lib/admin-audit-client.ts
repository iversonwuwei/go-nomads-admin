export type AdminAuditEvent = {
  id: string;
  scope: string;
  entityId: string;
  action: string;
  note: string;
  metadata?: Record<string, unknown>;
  happenedAt: string;
};

type AuditEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export async function fetchAuditEvents(scope: string): Promise<AdminAuditEvent[]> {
  const res = await fetch(`/api/admin/audit/events?scope=${encodeURIComponent(scope)}`, {
    method: "GET",
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as AuditEnvelope<AdminAuditEvent[]>;
  return Array.isArray(body.data) ? body.data : [];
}

export async function writeAuditEvent(payload: {
  scope: string;
  entityId: string;
  action: string;
  note: string;
  metadata?: Record<string, unknown>;
  happenedAt?: string;
}): Promise<AdminAuditEvent | null> {
  const res = await fetch("/api/admin/audit/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const body = (await res.json().catch(() => ({}))) as AuditEnvelope<AdminAuditEvent>;
  return body.data || null;
}
