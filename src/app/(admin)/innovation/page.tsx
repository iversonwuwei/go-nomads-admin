import Linklnextlinextlink
import AdminTable AdminWorkspaceToolbar, admintable
dmin / sys
AdminToolbarSlot,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
  ce";/systemworcomponentsace/systemworkspace
import { fetchInnovations }tchInno@/app/liboadmin-apitchInno@/app/liboadmin-api from "@/app/lib/admin-api";

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

function buildInnovationHref({
  search,
  category,
  stage,
  page,
  pageSize,
}: {
  search: string;
  category: string;
  stage: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (stage) params.set("stage", stage);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/innovation?${params.toString()}`;
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const totalViews = rows.reduce((sum, row) => sum + (row.viewCount ?? 0), 0);
  const totalLikes = rows.reduce((sum, row) => sum + (row.likeCount ?? 0), 0);

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "创新项目" }]} />
      <AdminWorkspaceHero
        eyebrow="Innovation Supply"
        title="Innovation 列表"
        description="这个页面管理进入 App 探索与创新板块的项目供给。它不仅是列表，也是对项目阶段、热度和创建者质量的观察面。"
        actions={
          <Link href="/app-control" className="btn btn-outline rounded-2xl">
            返回 App 控制台
          </Link>
        }
        stats={[
          { label: "Total Projects", value: formatCount(totalCount), hint: "当前筛选条件下的创新项目总数" },
          { label: "Total Views In Page", value: formatCount(totalViews), hint: "当前页项目累计浏览热度" },
          { label: "Total Likes In Page", value: formatCount(totalLikes), hint: "当前页项目累计点赞热度" },
        ]}
      />

      <AdminWorkspaceSection
        title="项目筛选"
        description="先锁定项目关键词、分类和阶段，再进入结果表观察热度、作者和详情入口。"
      >
        <form>
          <input type="hidden" name="page" value="1" />
          <AdminWorkspaceToolbar>
            <AdminToolbarSlot label="搜索" grow>
              <input
                name="search"
                defaultValue={search}
                className="input input-bordered input-sm w-full"
                placeholder="title keyword"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="分类">
              <input
                name="category"
                defaultValue={category}
                className="input input-bordered input-sm w-full"
                placeholder="AI / Travel"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="阶段">
              <input
                name="stage"
                defaultValue={stage}
                className="input input-bordered input-sm w-full"
                placeholder="MVP / Growth"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="每页数量">
              <select name="pageSize" defaultValue={String(pageSize)} className="select select-bordered select-sm w-full">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </AdminToolbarSlot>
            <AdminToolbarSlot label="操作">
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary btn-sm rounded-xl">查询</button>
                <Link href="/innovation" className="btn btn-outline btn-sm rounded-xl">重置</Link>
              </div>
            </AdminToolbarSlot>
          </AdminWorkspaceToolbar>
        </form>
      </AdminWorkspaceSection>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <AdminWorkspaceSection
        title="项目结果"
        description="统一查看标题、分类阶段、作者、热度和时间线，从同页进入详情继续做编辑、删除或阶段治理。"
      >
        <AdminTable
          headers={["项目", "分类/阶段", "创建者", "热度", "时间", "操作"]}
          hasRows={rows.length > 0}
          colSpan={6}
          meta={
            <>
              <div>
                <span className="admin-table-meta-label">Current Result Set</span>
                <span className="admin-table-meta-value">{formatCount(rows.length)}</span>
              </div>
              <p className="admin-table-meta-copy">第 {page}/{totalPages} 页，共 {formatCount(totalCount)} 个项目。列表保留供给识别与详情跳转，深度 CRUD 动作继续留在详情页收口。</p>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="admin-entity-copy">
                  <span className="admin-entity-title">{row.title || "-"}</span>
                  <span className="admin-entity-subtitle">Innovation ID · {row.id}</span>
                </div>
              </td>
              <td>
                <div className="space-y-1">
                  <p>{row.category || "-"}</p>
                  <p className="text-xs text-base-content/60">{row.stage || "-"}</p>
                </div>
              </td>
              <td>{row.creatorName || row.creatorId || "-"}</td>
              <td>
                <div className="space-y-1 text-xs text-base-content/70">
                  <p>浏览: {row.viewCount ?? "-"}</p>
                  <p>点赞: {row.likeCount ?? "-"}</p>
                </div>
              </td>
              <td className="text-sm text-base-content/65">{row.createdAt || row.updatedAt || "-"}</td>
              <td>
                <Link href={`/innovation/${encodeURIComponent(row.id)}`} className="btn btn-ghost btn-xs rounded-xl">查看详情</Link>
              </td>
            </tr>
          ))}
        </AdminTable>

        <div className="admin-pagination-shell">
          <p className="admin-pagination-copy">当前第 {page}/{totalPages} 页，已加载 {rows.length} 条。</p>
          <div className="join">
            <Link
              className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
              href={buildInnovationHref({ search, category, stage, page: prevPage, pageSize })}
            >
              上一页
            </Link>
            <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
            <Link
              className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
              href={buildInnovationHref({ search, category, stage, page: nextPage, pageSize })}
            >
              下一页
            </Link>
          </div>
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
