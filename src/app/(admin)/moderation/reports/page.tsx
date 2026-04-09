import ReportsTableClient from "@/app/components/admin/reports-table-client";
import { fetchMyReports, fetchReportById } from "@/app/lib/admin-api";

type ReportsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const reportId = asSingle(params.reportId).trim();

  const listRes = await fetchMyReports();
  const reportRows = listRes.data ?? [];
  const openCount = reportRows.filter((row) => (row.status || "pending") !== "resolved").length;
  const pendingCount = reportRows.filter((row) => (row.status || "pending") === "pending").length;
  const detailRes = reportId ? await fetchReportById(reportId) : null;

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Moderation & Risk</p>
              <h1 className="text-3xl font-bold">举报中心 / Report Moderation</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">这里处理的不是普通列表，而是 App 社区与内容风险。需要把列表、详情、处置时间线明确分开，才能支撑真正的治理闭环。</p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Reports</span>
                <strong>{formatCount(reportRows.length)}</strong>
                <p>当前返回的举报单总数</p>
              </div>
              <div className="control-summary-card">
                <span>Open Reports</span>
                <strong>{formatCount(openCount)}</strong>
                <p>仍待闭环的举报数量</p>
              </div>
              <div className="control-summary-card">
                <span>Pending Reports</span>
                <strong>{formatCount(pendingCount)}</strong>
                <p>尚未处理的初始待办数量</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Case Focus</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">详情单号</span><span className="font-semibold">{reportId || "未指定"}</span></div></div>
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">治理目标</span><span className="font-semibold">分配 / 结案 / 驳回</span></div></div>
            </div>
          </div>
        </div>
      </header>

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">案件查询区</h2>
              <p className="control-area-muted">这一块只用于按举报单号定位详情案件，不与列表和处置结果混合展示。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Focus</span><strong>先锁定案件，再进入处置</strong></div>
            <div className="control-focus-item"><span>Boundary</span><strong>查询区不展示处置列表</strong></div>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-4">
        <label className="form-control md:col-span-2">
          <span className="label-text text-xs">举报单号 (详情查询)</span>
          <input
            name="reportId"
            defaultValue={reportId}
            className="input input-bordered input-sm"
            placeholder="e.g. 95f8b7c8-..."
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-2">
          <button type="submit" className="btn btn-primary btn-sm">
            查询详情
          </button>
          <a href="/moderation/reports" className="btn btn-outline btn-sm">
            重置
          </a>
        </div>
      </form>
        </div>
      </section>

      {!listRes.ok ? (
        <div className="alert alert-warning">
          <span>举报列表读取失败: {listRes.message}</span>
        </div>
      ) : null}

      {reportId && detailRes && !detailRes.ok ? (
        <div className="alert alert-warning">
          <span>举报详情读取失败: {detailRes.message}</span>
        </div>
      ) : null}

      {detailRes?.ok && detailRes.data ? (
        <section className="control-area">
          <div className="control-area-header">
            <p className="control-area-label">Area 02</p>
            <div className="control-area-title-row">
              <div>
                <h2 className="control-area-title">举报详情区</h2>
                <p className="control-area-muted">这里展示当前选中案件的上下文、对象解析结果和举报人信息，供管理员做判断。</p>
              </div>
            </div>
          </div>
          <div className="control-area-body">
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="text-base-content/60">ID:</span>{" "}
              <span className="font-mono">{detailRes.data.id}</span>
            </p>
            <p>
              <span className="text-base-content/60">状态:</span>{" "}
              {detailRes.data.status || "-"}
            </p>
            <p>
              <span className="text-base-content/60">对象类型:</span>{" "}
              {detailRes.data.contentType || "-"}
            </p>
            <p>
              <span className="text-base-content/60">对象:</span>{" "}
                {detailRes.data.targetDisplayName || detailRes.data.targetName || "-"}
            </p>
              {detailRes.data.targetSummary ? (
                <p>
                  <span className="text-base-content/60">对象摘要:</span>{" "}
                  {detailRes.data.targetSummary}
                </p>
              ) : null}
            <p>
              <span className="text-base-content/60">原因:</span>{" "}
              {detailRes.data.reasonLabel || detailRes.data.reasonId || "-"}
            </p>
            <p>
              <span className="text-base-content/60">举报人:</span>{" "}
                {detailRes.data.reporterDisplayName || detailRes.data.reporterName || "-"}
            </p>
              {detailRes.data.reporterSummary ? (
                <p>
                  <span className="text-base-content/60">举报人摘要:</span>{" "}
                  {detailRes.data.reporterSummary}
                </p>
              ) : null}
          </div>
          </div>
        </section>
      ) : null}

      <ReportsTableClient initialRows={reportRows} />
    </section>
  );
}
