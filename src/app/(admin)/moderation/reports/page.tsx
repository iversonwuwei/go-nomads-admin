import ReportsTableClient from "@/app/components/admin/reports-table-client";
import {
    fetchCityById,
    fetchCoworkingById,
    fetchInnovationById,
    fetchMeetupById,
    fetchMyReports,
    fetchReportById,
    fetchUserById,
} from "@/app/lib/admin-api";

type ReportsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const reportId = asSingle(params.reportId).trim();

  const listRes = await fetchMyReports();
  const reportRows = listRes.data ?? [];
  const detailRes = reportId ? await fetchReportById(reportId) : null;
  const detail = detailRes?.ok ? detailRes.data : null;

  const reporterRes = detail?.reporterId ? await fetchUserById(detail.reporterId) : null;

  let targetResolved: string | null = null;
  if (detail?.targetId) {
    const contentType = (detail.contentType || "").toLowerCase();
    const targetId = detail.targetId;

    if (contentType === "user") {
      const userRes = await fetchUserById(targetId);
      if (userRes.ok && userRes.data) {
        targetResolved = `${userRes.data.name || "-"} (${userRes.data.email || userRes.data.id})`;
      }
    } else if (contentType === "city") {
      const cityRes = await fetchCityById(targetId);
      if (cityRes.ok && cityRes.data) {
        targetResolved = `${cityRes.data.name || cityRes.data.id} / ${cityRes.data.country || "-"}`;
      }
    } else if (contentType === "coworking") {
      const coworkingRes = await fetchCoworkingById(targetId);
      if (coworkingRes.ok && coworkingRes.data) {
        targetResolved = `${coworkingRes.data.name || coworkingRes.data.id} / ${coworkingRes.data.cityName || coworkingRes.data.cityId || "-"}`;
      }
    } else if (contentType === "meetup" || contentType === "event") {
      const meetupRes = await fetchMeetupById(targetId);
      if (meetupRes.ok && meetupRes.data) {
        targetResolved = `${meetupRes.data.title || meetupRes.data.id} / ${meetupRes.data.organizerName || meetupRes.data.organizerId || "-"}`;
      }
    } else if (contentType === "innovationproject" || contentType === "innovation") {
      const innovationRes = await fetchInnovationById(targetId);
      if (innovationRes.ok && innovationRes.data) {
        targetResolved = `${innovationRes.data.title || innovationRes.data.id} / ${innovationRes.data.creatorName || innovationRes.data.creatorId || "-"}`;
      }
    }
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm">
        <h1 className="text-2xl font-bold">举报中心 / Report Moderation</h1>
        <p className="mt-2 text-sm text-base-content/70">
          处理用户举报，支持分级处置、SLA 跟踪与审计回放。
        </p>
      </header>

      <form className="grid gap-3 md:grid-cols-4">
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
        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm">
          <h2 className="text-base font-semibold">举报详情 / Report Detail</h2>
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
              {targetResolved || detailRes.data.targetName || "-"}
            </p>
            <p>
              <span className="text-base-content/60">对象 ID:</span>{" "}
              <span className="font-mono">{detailRes.data.targetId || "-"}</span>
            </p>
            <p>
              <span className="text-base-content/60">原因:</span>{" "}
              {detailRes.data.reasonLabel || detailRes.data.reasonId || "-"}
            </p>
            <p>
              <span className="text-base-content/60">举报人:</span>{" "}
              {reporterRes?.ok && reporterRes.data
                ? `${reporterRes.data.name || "-"} (${reporterRes.data.email || reporterRes.data.id})`
                : detailRes.data.reporterName || detailRes.data.reporterId || "-"}
            </p>
          </div>
        </article>
      ) : null}

      <ReportsTableClient initialRows={reportRows} />
    </section>
  );
}
