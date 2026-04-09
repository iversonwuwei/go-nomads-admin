import AdminTable from "@/app/components/admin/admin-table";
import { fetchCoworkings } from "@/app/lib/admin-api";
import Link from "next/link";

type CoworkingPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function CoworkingPage({ searchParams }: CoworkingPageProps) {
  const params = (await searchParams) ?? {};
  const cityId = asSingle(params.cityId).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const listRes = await fetchCoworkings({ cityId, page, pageSize });
  const payload = listRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);
  const activeCount = rows.filter((row) => (row.status || "").toLowerCase() === "active").length;
  const ratedCount = rows.filter((row) => typeof row.rating === "number").length;

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Workspace Supply</p>
              <h1 className="text-3xl font-bold">Coworking 列表</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">这个页面管理进入 App 的联合办公供给。先确定城市范围，再查看资源状态、评分和价格信息。</p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Coworkings</span>
                <strong>{formatCount(totalCount)}</strong>
                <p>当前查询条件下的办公资源总数</p>
              </div>
              <div className="control-summary-card">
                <span>Active In Page</span>
                <strong>{formatCount(activeCount)}</strong>
                <p>当前页处于 active 的资源数</p>
              </div>
              <div className="control-summary-card">
                <span>Rated In Page</span>
                <strong>{formatCount(ratedCount)}</strong>
                <p>当前页带评分的数据量</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Current Filter</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">城市</span><span className="font-semibold">{cityId || "全部"}</span></div></div>
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">分页大小</span><span className="font-semibold">{pageSize}</span></div></div>
            </div>
          </div>
        </div>
      </header>

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">资源筛选区</h2>
              <p className="control-area-muted">这一块只负责定义城市范围与分页大小，不展示 Coworking 结果明细。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Focus</span><strong>先确定城市范围，再看资源结果</strong></div>
            <div className="control-focus-item"><span>Boundary</span><strong>条件区不承载资源列表</strong></div>
          </div>

          <form className="control-filter-form mt-5">
        <label className="form-control md:col-span-3">
          <span className="label-text text-xs">城市 ID (可选)</span>
          <input name="cityId" defaultValue={cityId} className="input input-bordered input-sm" placeholder="filter by city id" />
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
          <Link href="/coworking" className="btn btn-outline btn-sm">重置</Link>
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
              <h2 className="control-area-title">Coworking 结果区</h2>
              <p className="control-area-muted">这一块只展示办公资源结果、状态和分页。用户能快速区分自己是在看供给明细而不是筛选器。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Total</span><strong>{formatCount(totalCount)} 个资源</strong></div>
            <div className="control-focus-item"><span>Page</span><strong>第 {page} 页，当前 {rows.length} 条</strong></div>
          </div>

      <AdminTable headers={["名称", "城市", "地址", "评分/价格", "状态", "操作"]} hasRows={rows.length > 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.name || "-"}</p>
              <p className="text-xs font-mono text-base-content/60">{row.id}</p>
            </td>
            <td>{row.cityName || row.cityId || "-"}</td>
            <td>{row.address || "-"}</td>
            <td>
              <div className="text-xs">
                <p>评分: {row.rating ?? "-"}</p>
                <p>日均: {row.pricePerDay ?? "-"}</p>
              </div>
            </td>
            <td>{row.status || "-"}</td>
            <td><Link href={`/coworking/${encodeURIComponent(row.id)}`} className="btn btn-xs">查看详情</Link></td>
          </tr>
        ))}
      </AdminTable>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/coworking?cityId=${encodeURIComponent(cityId)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/coworking?cityId=${encodeURIComponent(cityId)}&page=${nextPage}&pageSize=${pageSize}`}
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
