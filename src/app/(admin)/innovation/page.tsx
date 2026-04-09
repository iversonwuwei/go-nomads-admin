import AdminTable from "@/app/components/admin/admin-table";
import { fetchInnovations } from "@/app/lib/admin-api";
import Link from "next/link";

type InnovationPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function InnovationPage({ searchParams }: InnovationPageProps) {
  const params = (await searchParams) ?? {};
  const search = asSingle(params.search).trim();
  const category = asSingle(params.category).trim();
  const stage = asSingle(params.stage).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const listRes = await fetchInnovations({ search, category, stage, page, pageSize });
  const payload = listRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);
  const totalViews = rows.reduce((sum, row) => sum + (row.viewCount ?? 0), 0);
  const totalLikes = rows.reduce((sum, row) => sum + (row.likeCount ?? 0), 0);

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Innovation Supply</p>
              <h1 className="text-3xl font-bold">Innovation 列表</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">这个页面管理进入 App 探索与创新板块的项目供给。它不仅是列表，也是对项目阶段、热度和创建者质量的观察面。</p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Projects</span>
                <strong>{formatCount(totalCount)}</strong>
                <p>当前筛选条件下的创新项目总数</p>
              </div>
              <div className="control-summary-card">
                <span>Total Views In Page</span>
                <strong>{formatCount(totalViews)}</strong>
                <p>当前页项目累计浏览热度</p>
              </div>
              <div className="control-summary-card">
                <span>Total Likes In Page</span>
                <strong>{formatCount(totalLikes)}</strong>
                <p>当前页项目累计点赞热度</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Current Filter</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">搜索</span><span className="font-semibold">{search || "未设置"}</span></div></div>
              <div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">分类 / 阶段</span><span className="font-semibold">{category || "全部"} / {stage || "全部"}</span></div></div>
            </div>
          </div>
        </div>
      </header>

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">项目筛选区</h2>
              <p className="control-area-muted">这一块只负责搜索创新项目、控制分类和阶段，不展示结果表格。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Focus</span><strong>先锁定项目类型，再看热度和创建者</strong></div>
            <div className="control-focus-item"><span>Boundary</span><strong>查询条件与结果区分离</strong></div>
          </div>

          <form className="control-filter-form mt-5 md:grid-cols-6">
        <label className="form-control md:col-span-2">
          <span className="label-text text-xs">搜索</span>
          <input name="search" defaultValue={search} className="input input-bordered input-sm" placeholder="title keyword" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">分类</span>
          <input name="category" defaultValue={category} className="input input-bordered input-sm" placeholder="AI / Travel" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">阶段</span>
          <input name="stage" defaultValue={stage} className="input input-bordered input-sm" placeholder="MVP / Growth" />
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
          <Link href="/innovation" className="btn btn-outline btn-sm">重置</Link>
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
              <h2 className="control-area-title">项目结果区</h2>
              <p className="control-area-muted">这一块专门展示项目明细、热度、创建者和分页动作，让产品和运营清楚自己正在看供给结果。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item"><span>Total</span><strong>{formatCount(totalCount)} 个项目</strong></div>
            <div className="control-focus-item"><span>Page</span><strong>第 {page} 页，当前 {rows.length} 条</strong></div>
          </div>

      <AdminTable headers={["项目", "分类/阶段", "创建者", "热度", "时间", "操作"]} hasRows={rows.length > 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.title || "-"}</p>
              <p className="text-xs font-mono text-base-content/60">{row.id}</p>
            </td>
            <td>
              <p>{row.category || "-"}</p>
              <p className="text-xs text-base-content/60">{row.stage || "-"}</p>
            </td>
            <td>{row.creatorName || row.creatorId || "-"}</td>
            <td>
              <div className="text-xs">
                <p>浏览: {row.viewCount ?? "-"}</p>
                <p>点赞: {row.likeCount ?? "-"}</p>
              </div>
            </td>
            <td>{row.createdAt || row.updatedAt || "-"}</td>
            <td>
              <Link href={`/innovation/${encodeURIComponent(row.id)}`} className="btn btn-xs">查看详情</Link>
            </td>
          </tr>
        ))}
      </AdminTable>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/innovation?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&stage=${encodeURIComponent(stage)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/innovation?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&stage=${encodeURIComponent(stage)}&page=${nextPage}&pageSize=${pageSize}`}
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
