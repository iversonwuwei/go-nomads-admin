"use client";

import type { CityPhotoDto } from "@/app/lib/admin-api";
import { type AdminAuditEvent, fetchAuditEvents, writeAuditEvent } from "@/app/lib/admin-audit-client";
import Image from "next/image";
import { useEffect, useState } from "react";

type CityPhotoTableProps = {
  rows: CityPhotoDto[];
  cityId: string;
};

type LocalPhotoRow = CityPhotoDto & {
  moderationStatus?: "pending" | "approved" | "rejected";
  reviewedAt?: string;
};

export default function CityPhotoTable({ rows, cityId }: CityPhotoTableProps) {
  const [localRows, setLocalRows] = useState<LocalPhotoRow[]>(rows);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [reviewTarget, setReviewTarget] = useState<CityPhotoDto | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [auditTrail, setAuditTrail] = useState<AdminAuditEvent[]>([]);

  useEffect(() => {
    void (async () => {
      const list = await fetchAuditEvents("city-photos");
      setAuditTrail(list);
    })();
  }, []);

  const reasonTemplates = {
    approve: [
      "图片清晰，内容合规",
      "场景信息完整，具备参考价值",
      "城市定位准确，信息可采纳",
    ],
    reject: [
      "图片质量过低（模糊/过暗）",
      "与城市主题不相关",
      "疑似版权风险或违规内容",
    ],
  };

  function openReview(action: "approve" | "reject", target: CityPhotoDto) {
    setReviewAction(action);
    setReviewTarget(target);
    setReason(reasonTemplates[action][0]);
  }

  async function submitReview() {
    if (!reviewTarget) return;

    setSubmitting(true);

    const response = await fetch("/api/admin/moderation/city-photos/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityId: reviewTarget.cityId || cityId,
        photoId: reviewTarget.id,
        action: reviewAction,
        reason,
      }),
    }).catch(() => null);

    setSubmitting(false);

    if (!response) {
      setFeedback("提交失败: 网络异常 / Network error");
      return;
    }

    const body = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };

    if (!response.ok || !body.success) {
      setFeedback(body.message || `提交失败: ${response.status}`);
      return;
    }

    const actionText = reviewAction === "approve" ? "通过" : "拒绝";
    const reviewedAt = new Date().toISOString();

    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.id !== reviewTarget.id) return row;
        return {
          ...row,
          moderationStatus: reviewAction === "approve" ? "approved" : "rejected",
          reviewedAt,
        };
      }),
    );

    setSelectedIds((prev) => prev.filter((id) => id !== reviewTarget.id));

    const saved = await writeAuditEvent({
      scope: "city-photos",
      entityId: reviewTarget.id,
      action: reviewAction,
      note: reason,
      happenedAt: reviewedAt,
      metadata: { cityId: reviewTarget.cityId || cityId },
    });

    const fallback: AdminAuditEvent = {
      id: `${reviewTarget.id}-${reviewedAt}`,
      scope: "city-photos",
      entityId: reviewTarget.id,
      action: reviewAction,
      note: reason,
      happenedAt: reviewedAt,
      metadata: { cityId: reviewTarget.cityId || cityId },
    };
    setAuditTrail((prev) => [saved || fallback, ...prev]);

    setFeedback(`已提交${actionText}：${reviewTarget.id}（${reason}）`);
    setReviewTarget(null);
    setTimeout(() => setFeedback(""), 2500);
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(localRows.map((x) => x.id));
      return;
    }
    setSelectedIds([]);
  }

  async function runBatchReview(action: "approve" | "reject") {
    if (selectedIds.length === 0) {
      setFeedback("请先选择要处理的图片 / Select rows first");
      return;
    }

    setSubmitting(true);

    const targetRows = localRows.filter((x) => selectedIds.includes(x.id));
    const batchReason =
      action === "approve" ? "批量通过：符合发布规范" : "批量拒绝：不符合发布规范";

    const settled = await Promise.allSettled(
      targetRows.map(async (row) => {
        const response = await fetch("/api/admin/moderation/city-photos/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityId: row.cityId || cityId,
            photoId: row.id,
            action,
            reason: batchReason,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        await response.json().catch(() => ({}));

        const reviewedAt = new Date().toISOString();
        const saved = await writeAuditEvent({
          scope: "city-photos",
          entityId: row.id,
          action,
          note: batchReason,
          happenedAt: reviewedAt,
          metadata: { cityId: row.cityId || cityId, mode: "batch" },
        });

        const fallback: AdminAuditEvent = {
          id: `${row.id}-${reviewedAt}-batch`,
          scope: "city-photos",
          entityId: row.id,
          action,
          note: batchReason,
          happenedAt: reviewedAt,
          metadata: { cityId: row.cityId || cityId, mode: "batch" },
        };

        return {
          rowId: row.id,
          audit: saved || fallback,
          reviewedAt,
        };
      }),
    );

    setSubmitting(false);

    const successRows: { rowId: string; audit: AdminAuditEvent; reviewedAt: string }[] = [];
    for (const item of settled) {
      if (item.status === "fulfilled") successRows.push(item.value);
    }

    const successIds = successRows.map((x) => x.rowId);
    if (successIds.length > 0) {
      setLocalRows((prev) =>
        prev.map((row) => {
          if (!successIds.includes(row.id)) return row;
          return {
            ...row,
            moderationStatus: action === "approve" ? "approved" : "rejected",
            reviewedAt: successRows.find((x) => x.rowId === row.id)?.reviewedAt || row.reviewedAt,
          };
        }),
      );
      setAuditTrail((prev) => [...successRows.map((x) => x.audit), ...prev]);
    }

    setSelectedIds((prev) => prev.filter((id) => !successIds.includes(id)));
    setFeedback(
      `批量${action === "approve" ? "通过" : "拒绝"}完成：成功 ${successIds.length}/${selectedIds.length}`,
    );
    setTimeout(() => setFeedback(""), 3000);
  }

  return (
    <>
      {feedback ? (
        <div className="alert alert-success mb-3">
          <span>{feedback}</span>
        </div>
      ) : null}

      <article className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100 p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-base-300/60 px-2 pb-3">
          <button
            type="button"
            className="btn btn-success btn-xs"
            disabled={submitting || selectedIds.length === 0}
            onClick={() => runBatchReview("approve")}
          >
            {submitting ? "处理中..." : `批量通过 (${selectedIds.length})`}
          </button>
          <button
            type="button"
            className="btn btn-error btn-xs"
            disabled={submitting || selectedIds.length === 0}
            onClick={() => runBatchReview("reject")}
          >
            {submitting ? "处理中..." : `批量拒绝 (${selectedIds.length})`}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            disabled={selectedIds.length === 0}
            onClick={() => setSelectedIds([])}
          >
            清空选择
          </button>
        </div>
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  aria-label="全选图片"
                  title="全选图片"
                  checked={localRows.length > 0 && selectedIds.length === localRows.length}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                />
              </th>
              <th>图片 ID</th>
              <th>城市 ID</th>
              <th>上传者</th>
              <th>图片地址</th>
              <th>风险</th>
              <th>状态</th>
              <th>上传时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {localRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    aria-label={`选择图片 ${row.id}`}
                    title={`选择图片 ${row.id}`}
                    checked={selectedIds.includes(row.id)}
                    onChange={(event) => toggleSelect(row.id, event.target.checked)}
                  />
                </td>
                <td className="font-mono text-xs">{row.id}</td>
                <td className="font-mono text-xs">{row.cityId || cityId}</td>
                <td className="font-mono text-xs">{row.userId || "-"}</td>
                <td className="max-w-40 truncate font-mono text-xs" title={row.imageUrl || ""}>
                  {row.imageUrl || "-"}
                </td>
                <td>待评估 / TBD</td>
                <td>
                  <span className="badge badge-outline badge-sm">
                    {row.moderationStatus === "approved"
                      ? "已通过 / Approved"
                      : row.moderationStatus === "rejected"
                        ? "已拒绝 / Rejected"
                        : "待审核 / Pending"}
                  </span>
                </td>
                <td>{row.createdAt || "-"}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-xs"
                      onClick={() => setPreviewUrl(row.imageUrl || "")}
                      disabled={!row.imageUrl}
                    >
                      预览
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-success"
                      onClick={() => openReview("approve", row)}
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-error"
                      onClick={() => openReview("reject", row)}
                    >
                      拒绝
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {cityId && localRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-base-content/60">
                  当前城市暂无图片数据 / No photos for this city
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>

      <article className="rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm">
        <h3 className="text-sm font-semibold">审核时间线 / Review Timeline</h3>
        <div className="mt-3 space-y-2 text-sm">
          {auditTrail.length === 0 ? (
            <p className="text-base-content/60">尚无本地审核记录，执行通过/拒绝后将显示。</p>
          ) : (
            auditTrail.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-base-300/60 bg-base-200/40 p-2">
                <p className="font-mono text-xs">{entry.entityId}</p>
                <p>
                  {entry.action === "approve" ? "通过" : entry.action === "reject" ? "拒绝" : entry.action} · {entry.note}
                </p>
                <p className="text-xs text-base-content/60">{entry.happenedAt}</p>
              </div>
            ))
          )}
        </div>
      </article>

      <dialog className={`modal ${previewUrl ? "modal-open" : ""}`}>
        <div className="modal-box max-w-5xl">
          <h3 className="text-lg font-semibold">图片预览 / Preview</h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-base-300/70 bg-base-200">
            {previewUrl ? (
              <div className="relative h-[60vh] w-full">
                <Image
                  src={previewUrl}
                  alt="City submission preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="p-8 text-center text-base-content/60">无可预览图片</div>
            )}
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setPreviewUrl("")}>关闭</button>
          </div>
        </div>
      </dialog>

      <dialog className={`modal ${reviewTarget ? "modal-open" : ""}`}>
        <div className="modal-box max-w-2xl">
          <h3 className="text-lg font-semibold">图片审核 / Review Action</h3>
          <p className="mt-2 text-sm text-base-content/70">
            审核对象: <span className="font-mono">{reviewTarget?.id ?? "-"}</span>
          </p>

          <div className="mt-4 space-y-4">
            <label className="form-control">
              <span className="label-text text-xs">审核结果</span>
              <input
                className="input input-bordered input-sm"
                value={reviewAction === "approve" ? "通过 / Approve" : "拒绝 / Reject"}
                readOnly
              />
            </label>

            <label className="form-control">
              <span className="label-text text-xs">原因模板</span>
              <select
                className="select select-bordered select-sm"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {reasonTemplates[reviewAction].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text text-xs">审核备注</span>
              <textarea
                className="textarea textarea-bordered h-24"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="输入审核备注..."
              />
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setReviewTarget(null)}>
              取消
            </button>
            <button
              type="button"
              className={`btn ${reviewAction === "approve" ? "btn-success" : "btn-error"}`}
              onClick={submitReview}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "提交审核"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
