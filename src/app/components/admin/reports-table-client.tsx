"use client";

import { MuseEffect, useMemo, useState } emo, ureact
import ReportRowActionsm "@/app/cococomponentsnentsn/report-roweactions//report-rowaactionsn/report-row-actions";
import { { {
  ReportDtoapi
  import { type AdminAuditEventnAfetchAuditEventsntwriteAuditEventuditEvent@/app/lib / admin - audit - clientiteAuditEventuditEvent@/app/lib/admin-audit-clientiteAuditEvent } from "@/app / lib / admin - audit - client";

type ReportsTableClientProps = {
  initialRows: ReportDto[];
};

function nextStatus(current: string, action: "assign" | "resolve" | "dismiss") {
  if (action === "assign") return "assigned";
  if (action === "resolve") return "resolved";
  if (action === "dismiss") return "dismissed";
  return current || "pending";
}

function getTargetHref(row: ReportDto) {
  const targetId = (row.targetId || "").trim();
  const contentType = (row.contentType || "").toLowerCase();
  if (!targetId) return "";

  if (contentType === "city") return `/cities/${encodeURIComponent(targetId)}`;
  if (contentType === "meetup" || contentType === "event") return `/meetups/${encodeURIComponent(targetId)}`;
  if (contentType === "innovationproject" || contentType === "innovation") return `/innovation/${encodeURIComponent(targetId)}`;
  if (contentType === "coworking") return `/coworking/${encodeURIComponent(targetId)}`;
  if (contentType === "user") return `/users?q=${encodeURIComponent(targetId)}`;
  return "";
}

  function formatDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    }).format(date);
  }

  function getPriorityMeta(row: ReportDto) {
    const normalizedReason = `${row.reasonLabel || ""} ${row.reasonId || ""}`.toLowerCase();
    const normalizedStatus = (row.status || "pending").toLowerCase();

    if (/(暴力|危险|hate|harass|仇恨|欺诈|fraud|scam)/.test(normalizedReason)) {
      return { label: "高", className: "moderation-chip moderation-chip-danger" };
    }

    if (normalizedStatus === "assigned" || /(不当|spam|misinfo|虚假)/.test(normalizedReason)) {
      return { label: "中", className: "moderation-chip moderation-chip-warning" };
    }

    return { label: "常规", className: "moderation-chip moderation-chip-info" };
  }

  function getStatusMeta(status?: string) {
    const normalized = (status || "pending").toLowerCase();

    if (normalized === "resolved") {
      return { label: "已结案", className: "moderation-chip moderation-chip-success" };
    }

    if (normalized === "assigned") {
      return { label: "处理中", className: "moderation-chip moderation-chip-info" };
    }

    if (normalized === "dismissed") {
      return { label: "已驳回", className: "moderation-chip moderation-chip-muted" };
    }

    return { label: "待处理", className: "moderation-chip moderation-chip-warning" };
  }

export default function ReportsTableClient({ initialRows }: ReportsTableClientProps) {
  const [rows, setRows] = useState<ReportDto[]>(initialRows);
  const [auditTrail, setAuditTrail] = useState<AdminAuditEvent[]>([]);

  useEffect(() => {
    void (async () => {
      const list = await fetchAuditEvents("reports");
      setAuditTrail(list);
    })();
  }, []);

  const hasRows = rows.length > 0;
  const totalOpen = useMemo(() => rows.filter((x) => (x.status || "pending") !== "resolved").length, [rows]);

  function handleActionComplete(payload: {
    reportId: string;
    action: "assign" | "resolve" | "dismiss";
    operatedAt: string;
    message: string;
  }) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== payload.reportId) return row;
        return {
          ...row,
          status: nextStatus(row.status || "pending", payload.action),
          updatedAt: payload.operatedAt,
        };
      }),
    );

    void (async () => {
      const saved = await writeAuditEvent({
        scope: "reports",
        entityId: payload.reportId,
        action: payload.action,
        note: payload.message,
        happenedAt: payload.operatedAt,
      });

      const fallback: AdminAuditEvent = {
        id: `${payload.reportId}-${payload.operatedAt}-${payload.action}`,
        scope: "reports",
        entityId: payload.reportId,
        action: payload.action,
        note: payload.message,
        happenedAt: payload.operatedAt,
        metadata: {},
      };

      setAuditTrail((prev) => [saved || fallback, ...prev]);
    })();
  }

  return (
    <section className="control-area">
      <div className="control-area-header">
        <p className="control-area-label">Area 03</p>
        <div className="control-area-title-row">
          <div>
            <h2 className="control-area-title">举报处置区</h2>
            <p className="control-area-muted">这一块聚焦举报列表本身、处置动作和本地时间线，帮助管理员完成完整的治理闭环。</p>
          </div>
        </div>
      </div>
      <div className="control-area-body space-y-4">
        <div className="control-focus-bar">
          <div className="control-focus-item">
            <span>Focus</span>
            <strong>当前 {rows.length} 条案件，待闭环 {totalOpen} 条</strong>
          </div>
          <div className="control-focus-item">
            <span>Boundary</span>
            <strong>此区只做处置，不负责详情查询</strong>
          </div>
        </div>

        <article className="control-table-shell">
          <div className="control-table-wrap">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>举报单号</th>
              <th>对象类型</th>
                  <th>对象</th>
              <th>原因</th>
              <th>举报人</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
                {rows.map((row) => (
              <tr key={row.id}>
              <td className="font-mono text-xs">{row.id}</td>
                <td>{row.contentType || "-"}</td>
                <td>
                  {getTargetHref(row) ? (
                    <a href={getTargetHref(row)} className="link link-primary">
                      {row.targetDisplayName || row.targetName || "-"}
                    </a>
                  ) : (
                      <span>{row.targetDisplayName || row.targetName || "-"}</span>
                  )}
                  {row.targetSummary ? (
                    <p className="text-xs text-base-content/60">{row.targetSummary}</p>
                  ) : null}
                </td>
              <td>{row.reasonLabel || row.reasonId || "-"}</td>
                <td>
                  <p>{row.reporterDisplayName || row.reporterName || "-"}</p>
                {row.reporterSummary ? <p className="text-xs text-base-content/60">{row.reporterSummary}</p> : null}
                </td>
                <td>
                  <span className="badge badge-outline badge-sm">{row.status || "pending"}</span>
                </td>
                <td>{row.createdAt || "-"}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/moderation/reports?reportId=${encodeURIComponent(row.id)}`}
                      className="btn btn-xs"
                    >
                    详情
                    </a>
                  <ReportRowActions reportId={row.id} onActionComplete={handleActionComplete} />
                </div>
              </td>
            </tr>
          ))}

            {!hasRows ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-base-content/60">
                  暂无举报数据 / No report data
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
          </div>
      </article>

        <article className="admin-panel rounded-3xl p-4">
        <h3 className="text-sm font-semibold">处置时间线 / Action Timeline</h3>
          <div className="space-y-2 text-sm">
            {auditTrail.length === 0 ? (
              <p className="text-base-content/60">尚无本地处置记录，执行分配/结案/驳回后将显示。</p>
            ) : (
              auditTrail.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-base-300/60 bg-base-200/40 p-2">
                <p className="font-mono text-xs">{entry.entityId}</p>
                <p>
                  <span className="capitalize">{entry.action}</span> · {entry.note}
                </p>
                <p className="text-xs text-base-content/60">{entry.happenedAt}</p>
                </div>
              ))
            )}
          </div>
      </article>
      </div>
    </section>
  );
}
