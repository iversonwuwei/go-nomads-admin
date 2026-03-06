"use client";

import { useState } from "react";

type ReportRowActionsProps = {
  reportId: string;
  onActionComplete?: (payload: {
    reportId: string;
    action: "assign" | "resolve" | "dismiss";
    operatedAt: string;
    message: string;
  }) => void;
};

export default function ReportRowActions({ reportId, onActionComplete }: ReportRowActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  async function runAction(action: "assign" | "resolve" | "dismiss") {
    setLoadingAction(action);
    setFeedback("");

    const response = await fetch("/api/admin/moderation/reports/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        action,
        note: `Admin action from web: ${action}`,
      }),
    }).catch(() => null);

    setLoadingAction("");

    if (!response) {
      setFeedback("请求失败 / request failed");
      return;
    }

    const body = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: {
        operatedAt?: string;
      };
    };

    if (!response.ok || !body.success) {
      setFeedback(body.message || `失败: ${response.status}`);
      return;
    }

    const isDryRun = (body.message || "").toLowerCase().includes("dry-run");
    const message =
      action === "assign"
        ? isDryRun
          ? "已分配(模拟)"
          : "已分配"
        : action === "resolve"
          ? isDryRun
            ? "已结案(模拟)"
            : "已结案"
          : isDryRun
            ? "已驳回(模拟)"
            : "已驳回";
    const operatedAt = body.data?.operatedAt || new Date().toISOString();

    setFeedback(message);
    onActionComplete?.({ reportId, action, operatedAt, message });
    setTimeout(() => setFeedback(""), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn btn-xs btn-warning"
        onClick={() => runAction("assign")}
        disabled={loadingAction.length > 0}
      >
        {loadingAction === "assign" ? "处理中..." : "分配"}
      </button>
      <button
        type="button"
        className="btn btn-xs btn-success"
        onClick={() => runAction("resolve")}
        disabled={loadingAction.length > 0}
      >
        {loadingAction === "resolve" ? "处理中..." : "结案"}
      </button>
      <button
        type="button"
        className="btn btn-xs btn-error"
        onClick={() => runAction("dismiss")}
        disabled={loadingAction.length > 0}
      >
        {loadingAction === "dismiss" ? "处理中..." : "驳回"}
      </button>
      {feedback ? <span className="text-xs text-base-content/60">{feedback}</span> : null}
    </div>
  );
}
