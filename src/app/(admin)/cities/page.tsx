import Linklnextlinextlink
import AdminTable AdminWorkspaceToolbar, admintable
nts / admi
AdminToolbarSlot,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
  ntsworksp / systcomponentsworksp / systemaworkspace
import { fetchCities }tchCiti@/app/libtadmin-apiti@/app/lib admin - api "@/app/lib/admin-api";

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

function buildCitiesHref({
  search,
  page,
  pageSize,
}: {
  search: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/cities?${params.toString()}`;
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const meetupTotal = rows.reduce((sum, row) => sum + (row.meetupCount ?? 0), 0);
  const coworkingTotal = rows.reduce((sum, row) => sum + (row.coworkingCount ?? 0), 0);

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "城市供给" }]} />
      <AdminWorkspaceHero
        eyebrow="Content Supply"
        title="城市列表 / Cities"
        description="这个页面管理的是进入 App 内容供给层的城市资源。先定义查询条件，再看资源清单与关联供给规模。"
        actions={
          <Link href="/app-control" className="btn btn-outline rounded-2xl">
            返回 App 控制台
          </Link>
        }
        stats={[
          { label: "Total Cities", value: formatCount(totalCount), hint: "当前查询条件下的城市总数" },
          { label: "Meetups In Page", value: formatCount(meetupTotal), hint: "本页城市关联的活动规模" },
          { label: "Coworkings In Page", value: formatCount(coworkingTotal), hint: "本页城市关联的联合办公规模" },
        ]}
      />

      <AdminWorkspaceSection
        title="资源查询"
        description="先锁定城市范围和分页大小，再进入结果表查看供给明细与详情入口。"
      >
        <form>
          <input type="hidden" name="page" value="1" />
          <AdminWorkspaceToolbar>
            <AdminToolbarSlot label="搜索" grow>
              <input
                name="search"
                defaultValue={search}
                className="input input-bordered input-sm w-full"
                placeholder="搜索城市名或国家，例如 Beijing"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="每页数量">
              <select name="pageSize" defaultValue={String(pageSize)} className="select select-bordered select-sm w-full">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </AdminToolbarSlot>
            <AdminToolbarSlot label="当前过滤">
              <div className="text-sm text-base-content/70">搜索词 {search || "未设置"} / 每页 {pageSize}</div>
            </AdminToolbarSlot>
            <AdminToolbarSlot label="操作">
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary btn-sm rounded-xl">查询</button>
                <Link href="/cities" className="btn btn-outline btn-sm rounded-xl">重置</Link>
              </div>
            </AdminToolbarSlot>
          </AdminWorkspaceToolbar>
        </form>
      </AdminWorkspaceSection>

      {!citiesRes.ok ? (
        <div className="alert alert-warning">
          <span>城市数据读取失败: {citiesRes.message}</span>
        </div>
      ) : null}

      <AdminWorkspaceSection
        title="城市资源结果"
        description="统一查看城市主档、地域、时区与供给负载，并从同页进入详情页继续做评分、照片或版主管理。"
      >
        <AdminTable
          headers={["城市", "国家/地区", "时区", "平均成本", "关联资源", "操作"]}
          hasRows={rows.length > 0}
          emptyMessage="暂无城市数据 / No city data"
          colSpan={6}
          meta={
            <>
              <div>
                <span className="admin-table-meta-label">Current Result Set</span>
                <span className="admin-table-meta-value">{formatCount(rows.length)}</span>
              </div>
              <p className="admin-table-meta-copy">第 {page}/{totalPages} 页，共 {formatCount(totalCount)} 个城市。列表页只保留资源识别和详情跳转，不把深度治理动作塞回这里。</p>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="admin-entity-copy">
                  <span className="admin-entity-title">{row.name || "-"}</span>
                  <span className="admin-entity-subtitle">City ID · {row.id}</span>
                </div>
              </td>
              <td>{row.country || row.region || "-"}</td>
              <td>{row.timezone || "-"}</td>
              <td>{row.averageCost ?? "-"}</td>
              <td>
                <div className="space-y-1 text-xs text-base-content/70">
                  <p>Meetup: {row.meetupCount ?? "-"}</p>
                  <p>Coworking: {row.coworkingCount ?? "-"}</p>
                </div>
              </td>
              <td>
                <Link href={`/cities/${encodeURIComponent(row.id)}`} className="btn btn-ghost btn-xs rounded-xl">
                  查看详情
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>

        <div className="admin-pagination-shell">
          <p className="admin-pagination-copy">当前第 {page}/{totalPages} 页，已加载 {rows.length} 条。</p>
          <div className="join">
            <Link
              className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
              href={buildCitiesHref({ search, page: prevPage, pageSize })}
            >
              上一页
            </Link>
            <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
            <Link
              className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
              href={buildCitiesHref({ search, page: nextPage, pageSize })}
            >
              下一页
            </Link>
          </div>
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
