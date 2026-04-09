import AdminTable from "@/app/components/admin/admin-table";
import { fetchMeetups } from "@/app/lib/admin-api";
import Link from "next/link";

type MeetupsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function MeetupsPage({ searchParams }: MeetupsPageProps) {
  const params = (await searchParams) ?? {};
  const cityId = asSingle(params.cityId).trim();
  const category = asSingle(params.category).trim();
  const status = asSingle(params.status).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const listRes = await fetchMeetups({ cityId, category, status, page, pageSize });
  const payload = listRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);
  const totalParticipants = rows.reduce((sum, row) => sum + (row.participantCount ?? 0), 0);
  const statusCount = new Set(rows.map((row) => row.status).filter(Boolean)).size;

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Event Supply</p>
              <h1 className="text-3xl font-bold">Meetup 列表</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">这个页面管理进入 App 活动流的事件供给。先明确城市、分类和状态，再查看活动明细与参与规模。</p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Meetups</span>
                <strong>{formatCount(totalCount)}</strong>
                <p>当前查询条件下的活动总数</p>
              </div>
              <div className="control-summary-card">
                <span>Participants In Page</span>
                <strong>{formatCount(totalParticipants)}</strong>
                <p>当前页活动参与人数汇总</p>
              </div>
              <div className="control-summary-card">
                <span>Status Types</span>
                <strong>{formatCount(statusCount)}</strong>
                <p>当前结果页涉及的活动状态数</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Current Filter</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">城市</span><span className="font-semibold">{cityId || "全部"}</span></div></div>
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">分类</span><span className="font-semibold">{category || "全部"}</span></div></div>
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">状态</span><span className="font-semibold">{status || "全部"}</span></div></div>
            </div>
          </div>
        </div>
      </header>

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">活动筛选区</h2>
              <p className="control-area-muted">这一块只负责设定活动查询条件，不展示活动结果列表，避免筛选条件和供给明细混在一起。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Focus</span><strong>先锁定活动范围，再查看供给结果</strong></div>
            <div className="control-focus-item"><span>Boundary</span><strong>此区不显示活动明细</strong></div>
          </div>

          <form className="control-filter-form mt-5 md:grid-cols-6">
        <label className="form-control md:col-span-2">
          <span className="label-text text-xs">城市 ID</span>
          <input name="cityId" defaultValue={cityId} className="input input-bordered input-sm" placeholder="city id" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">分类</span>
          <input name="category" defaultValue={category} className="input input-bordered input-sm" placeholder="tech" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">状态</span>
          <input name="status" defaultValue={status} className="input input-bordered input-sm" placeholder="upcoming" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">每页</span>
          <select name="pageSize" defaultValue={String(pageSize)} className="select select-bordered select-sm">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="flex items-end gap-2 md:col-span-1">
          <button type="submit" className="btn btn-primary btn-sm">查询</button>
          <Link href="/meetups" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>
        </div>
      </section>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 02</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">活动供给结果区</h2>
              <p className="control-area-muted">这一块专门展示活动清单、组织者、时间和分页动作。用户能明确知道自己在看供给结果，而不是筛选控件。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Total</span><strong>{formatCount(totalCount)} 个活动</strong></div>
            <div className="control-focus-item"><span>Page</span><strong>第 {page} 页，当前 {rows.length} 条</strong></div>
          </div>

      <AdminTable headers={["活动", "城市", "分类/状态", "组织者", "时间", "操作"]} hasRows={rows.length > 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.title || "-"}</p>
              <p className="text-xs font-mono text-base-content/60">{row.id}</p>
            </td>
            <td>{row.cityName || row.cityId || "-"}</td>
            <td>
              <p>{row.category || "-"}</p>
              <p className="text-xs text-base-content/60">{row.status || "-"}</p>
            </td>
            <td>{row.organizerName || row.organizerId || "-"}</td>
            <td>
              <p className="text-xs">开始: {row.startTime || "-"}</p>
              <p className="text-xs">结束: {row.endTime || "-"}</p>
            </td>
            <td><Link href={`/meetups/${encodeURIComponent(row.id)}`} className="btn btn-xs">查看详情</Link></td>
          </tr>
        ))}
      </AdminTable>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/meetups?cityId=${encodeURIComponent(cityId)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/meetups?cityId=${encodeURIComponent(cityId)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&page=${nextPage}&pageSize=${pageSize}`}
          >
            下一页
          </Link>
        </div>
      </div>
        </div>
      </section>
    </section>
  );
}
