import AdminTable from "@/app/components/admin/admin-table";
import { fetchCities } from "@/app/lib/admin-api";
import Link from "next/link";

type CitiesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function CitiesPage({ searchParams }: CitiesPageProps) {
  const params = (await searchParams) ?? {};
  const search = asSingle(params.search).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const citiesRes = await fetchCities({ search, page, pageSize });
  const payload = citiesRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);
  const meetupTotal = rows.reduce((sum, row) => sum + (row.meetupCount ?? 0), 0);
  const coworkingTotal = rows.reduce((sum, row) => sum + (row.coworkingCount ?? 0), 0);

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Content Supply</p>
              <h1 className="text-3xl font-bold">城市列表 / Cities</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">
                这个页面管理的是进入 App 内容供给层的城市资源。先定义查询条件，再看资源清单与关联供给规模。
              </p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Cities</span>
                <strong>{formatCount(totalCount)}</strong>
                <p>当前查询条件下的城市总数</p>
              </div>
              <div className="control-summary-card">
                <span>Meetups In Page</span>
                <strong>{formatCount(meetupTotal)}</strong>
                <p>本页城市关联的活动规模</p>
              </div>
              <div className="control-summary-card">
                <span>Coworkings In Page</span>
                <strong>{formatCount(coworkingTotal)}</strong>
                <p>本页城市关联的联合办公规模</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Current Query</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">搜索词</span>
                  <span className="font-semibold">{search || "未设置"}</span>
                </div>
              </div>
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">分页大小</span>
                  <span className="font-semibold">{pageSize}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">资源查询区</h2>
              <p className="control-area-muted">这一块只负责定义搜索条件和每页大小，不展示城市明细数据。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>先锁定城市范围，再查看资源结果</strong>
            </div>
            <div className="control-focus-item">
              <span>Boundary</span>
              <strong>条件区与结果区明确分离</strong>
            </div>
          </div>

          <form className="control-filter-form mt-5">
        <label className="form-control md:col-span-3">
          <span className="label-text text-xs">搜索 (城市名/国家)</span>
          <input name="search" defaultValue={search} className="input input-bordered input-sm" placeholder="e.g. Beijing" />
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
          <Link href="/cities" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>
        </div>
      </section>

      {!citiesRes.ok ? (
        <div className="alert alert-warning">
          <span>城市数据读取失败: {citiesRes.message}</span>
        </div>
      ) : null}

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 02</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">城市资源结果区</h2>
              <p className="control-area-muted">这一块只展示城市明细、关联资源和分页动作。和筛选区保持清晰边界。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Total</span>
              <strong>{formatCount(totalCount)} 个城市</strong>
            </div>
            <div className="control-focus-item">
              <span>Page</span>
              <strong>第 {page} 页，当前 {rows.length} 条</strong>
            </div>
          </div>

      <AdminTable
        headers={["城市", "国家/地区", "时区", "平均成本", "关联资源", "操作"]}
        hasRows={rows.length > 0}
        emptyMessage="暂无城市数据 / No city data"
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.name || "-"}</p>
              <p className="text-xs text-base-content/60 font-mono">{row.id}</p>
            </td>
            <td>{row.country || row.region || "-"}</td>
            <td>{row.timezone || "-"}</td>
            <td>{row.averageCost ?? "-"}</td>
            <td>
              <div className="text-xs">
                <p>Meetup: {row.meetupCount ?? "-"}</p>
                <p>Coworking: {row.coworkingCount ?? "-"}</p>
              </div>
            </td>
            <td>
              <Link href={`/cities/${encodeURIComponent(row.id)}`} className="btn btn-xs">
                查看详情
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/cities?search=${encodeURIComponent(search)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/cities?search=${encodeURIComponent(search)}&page=${nextPage}&pageSize=${pageSize}`}
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
