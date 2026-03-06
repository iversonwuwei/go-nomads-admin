"use client";

import ReportRowActions from "@/app/components/admin/report-row-actions";
import type { ReportDto } from "@/app/lib/admin-api";
import { type AdminAuditEvent, fetchAuditEvents, writeAuditEvent } from "@/app/lib/admin-audit-client";
import { useEffect, useMemo, useState } from "react";

type ReportsTableClientProps = {
  initialRows: ReportDto[];
};

function nextStatus(current: string, action: "assign" | "resolve" | "dismiss") {
  if (action === "assign") return "assigned";
  if (action === "resolve") return "resolved";
  if (action === "dismiss") return "dismissed";
  return current || "pending";
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
    <section className="space-y-4">
      <div className="rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm text-base-content/70">
        当前列表共 <span className="font-semibold text-base-content">{rows.length}</span> 条举报，待闭环
        <span className="mx-1 font-semibold text-base-content">{totalOpen}</span>条。
      </div>

      <article className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100 p-2 shadow-sm">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>举报单号</th>
              <th>对象类型</th>
              <th>对象 ID</th>
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
                <td className="font-mono text-xs">{row.targetId || "-"}</td>
                <td>{row.reasonLabel || row.reasonId || "-"}</td>
                <td>{row.reporterName || row.reporterId || "-"}</td>
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
      </article>

      <article className="rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm">
        <h3 className="text-sm font-semibold">处置时间线 / Action Timeline</h3>
        <div className="mt-3 space-y-2 text-sm">
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
    </section>
  );
}
