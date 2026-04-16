import Linklnextlinextlink
import AdminTable AdminWorkspaceToolbar, admintable
admin / sy
AdminToolbarSlot,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
  pace"/system;wcomponentsspace/systemworkspace
import { fetchCoworkings }tchCowo@/app/libgadmin-apichCowo@/app/libgadmin-apifrom "@/app/lib/admin-api";

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

function buildCoworkingHref({
  cityId,
  page,
  pageSize,
}: {
  cityId: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (cityId) params.set("cityId", cityId);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/coworking?${params.toString()}`;
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeCount = rows.filter((row) => (row.status || "").toLowerCase() === "active").length;
  const ratedCount = rows.filter((row) => typeof row.rating === "number").length;

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "联合办公" }]} />
      <AdminWorkspaceHero
        eyebrow="Workspace Supply"
        title="Coworking 列表"
        description="这个页面管理进入 App 的联合办公供给。先确定城市范围，再查看资源状态、评分和价格信息。"
        actions={
          <Link href="/app-control" className="btn btn-outline rounded-2xl">
            返回 App 控制台
          </Link>
        }
        stats={[
          { label: "Total Coworkings", value: formatCount(totalCount), hint: "当前查询条件下的办公资源总数" },
          { label: "Active In Page", value: formatCount(activeCount), hint: "当前页处于 active 的资源数" },
          { label: "Rated In Page", value: formatCount(ratedCount), hint: "当前页带评分的数据量" },
        ]}
      />

      <AdminWorkspaceSection
        title="资源筛选"
        description="先收窄城市范围和分页大小，再进入结果表查看供给明细与详情入口。"
      >
        <form>
          <input type="hidden" name="page" value="1" />
          <AdminWorkspaceToolbar>
            <AdminToolbarSlot label="城市 ID" grow>
              <input
                name="cityId"
                defaultValue={cityId}
                className="input input-bordered input-sm w-full"
                placeholder="filter by city id"
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
              <div className="text-sm text-base-content/70">城市 {cityId || "全部"} / 每页 {pageSize}</div>
            </AdminToolbarSlot>
            <AdminToolbarSlot label="操作">
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary btn-sm rounded-xl">查询</button>
                <Link href="/coworking" className="btn btn-outline btn-sm rounded-xl">重置</Link>
              </div>
            </AdminToolbarSlot>
          </AdminWorkspaceToolbar>
        </form>
      </AdminWorkspaceSection>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <AdminWorkspaceSection
        title="Coworking 结果"
        description="统一查看名称、城市、地址、评分和价格，从同页进入详情继续做审核状态、评论或验证资格治理。"
      >
        <AdminTable
          headers={["名称", "城市", "地址", "评分/价格", "状态", "操作"]}
          hasRows={rows.length > 0}
          colSpan={6}
          meta={
            <>
              <div>
                <span className="admin-table-meta-label">Current Result Set</span>
                <span className="admin-table-meta-value">{formatCount(rows.length)}</span>
              </div>
              <p className="admin-table-meta-copy">第 {page}/{totalPages} 页，共 {formatCount(totalCount)} 个资源。列表只保留供给识别和详情跳转，深度审核动作继续放在详情页闭环。</p>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="admin-entity-copy">
                  <span className="admin-entity-title">{row.name || "-"}</span>
                  <span className="admin-entity-subtitle">Coworking ID · {row.id}</span>
                </div>
              </td>
              <td>{row.cityName || row.cityId || "-"}</td>
              <td>{row.address || "-"}</td>
              <td>
                <div className="space-y-1 text-xs text-base-content/70">
                  <p>评分: {row.rating ?? "-"}</p>
                  <p>日均: {row.pricePerDay ?? "-"}</p>
                </div>
              </td>
              <td>{row.status || "-"}</td>
              <td>
                <Link href={`/coworking/${encodeURIComponent(row.id)}`} className="btn btn-ghost btn-xs rounded-xl">查看详情</Link>
              </td>
            </tr>
          ))}
        </AdminTable>

        <div className="admin-pagination-shell">
          <p className="admin-pagination-copy">当前第 {page}/{totalPages} 页，已加载 {rows.length} 条。</p>
          <div className="join">
            <Link
              className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
              href={buildCoworkingHref({ cityId, page: prevPage, pageSize })}
            >
              上一页
            </Link>
            <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
            <Link
              className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
              href={buildCoworkingHref({ cityId, page: nextPage, pageSize })}
            >
              下一页
            </Link>
          </div>
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
