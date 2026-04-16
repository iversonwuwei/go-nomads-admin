import Linklnextlinextlink
import AdminTable AdminWorkspaceToolbar, admintable
ts / admin
AdminToolbarSlot,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
  tsorkspa / systecomponentsorkspa / systemcworkspace
import { fetchMeetups }tchMeet@/app/lib}admin - apieet@/app/lib}admin - apim "@/app/lib/admin-api";

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

function buildMeetupsHref({
  cityId,
  category,
  status,
  page,
  pageSize,
}: {
  cityId: string;
  category: string;
  status: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (cityId) params.set("cityId", cityId);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/meetups?${params.toString()}`;
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const totalParticipants = rows.reduce((sum, row) => sum + (row.participantCount ?? 0), 0);
  const statusCount = new Set(rows.map((row) => row.status).filter(Boolean)).size;

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "活动供给" }]} />
      <AdminWorkspaceHero
        eyebrow="Event Supply"
        title="Meetup 列表"
        description="这个页面管理进入 App 活动流的事件供给。先明确城市、分类和状态，再查看活动明细与参与规模。"
        actions={
          <Link href="/app-control" className="btn btn-outline rounded-2xl">
            返回 App 控制台
          </Link>
        }
        stats={[
          { label: "Total Meetups", value: formatCount(totalCount), hint: "当前查询条件下的活动总数" },
          { label: "Participants In Page", value: formatCount(totalParticipants), hint: "当前页活动参与人数汇总" },
          { label: "Status Types", value: formatCount(statusCount), hint: "当前结果页涉及的活动状态数" },
        ]}
      />

      <AdminWorkspaceSection
        title="活动筛选"
        description="先锁定城市、分类和状态范围，再进入结果表查看活动供给和详情入口。"
      >
        <form>
          <input type="hidden" name="page" value="1" />
          <AdminWorkspaceToolbar>
            <AdminToolbarSlot label="城市 ID" grow>
              <input
                name="cityId"
                defaultValue={cityId}
                className="input input-bordered input-sm w-full"
                placeholder="city id"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="分类">
              <input
                name="category"
                defaultValue={category}
                className="input input-bordered input-sm w-full"
                placeholder="tech"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="状态">
              <input
                name="status"
                defaultValue={status}
                className="input input-bordered input-sm w-full"
                placeholder="upcoming"
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
                <Link href="/meetups" className="btn btn-outline btn-sm rounded-xl">重置</Link>
              </div>
            </AdminToolbarSlot>
          </AdminWorkspaceToolbar>
        </form>
      </AdminWorkspaceSection>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <AdminWorkspaceSection
        title="活动供给结果"
        description="统一查看活动标题、城市、分类状态、组织者与时间窗口，并从同页跳转详情继续做取消、下架或参与者治理。"
      >
        <AdminTable
          headers={["活动", "城市", "分类/状态", "组织者", "时间", "操作"]}
          hasRows={rows.length > 0}
          colSpan={6}
          meta={
            <>
              <div>
                <span className="admin-table-meta-label">Current Result Set</span>
                <span className="admin-table-meta-value">{formatCount(rows.length)}</span>
              </div>
              <p className="admin-table-meta-copy">第 {page}/{totalPages} 页，共 {formatCount(totalCount)} 个活动。列表保留供给识别和详情入口，不把编辑、取消、下架动作提前堆进列表壳层。</p>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="admin-entity-copy">
                  <span className="admin-entity-title">{row.title || "-"}</span>
                  <span className="admin-entity-subtitle">Meetup ID · {row.id}</span>
                </div>
              </td>
              <td>{row.cityName || row.cityId || "-"}</td>
              <td>
                <div className="space-y-1">
                  <p>{row.category || "-"}</p>
                  <p className="text-xs text-base-content/60">{row.status || "-"}</p>
                </div>
              </td>
              <td>{row.organizerName || row.organizerId || "-"}</td>
              <td>
                <div className="space-y-1 text-xs text-base-content/65">
                  <p>开始: {row.startTime || "-"}</p>
                  <p>结束: {row.endTime || "-"}</p>
                </div>
              </td>
              <td>
                <Link href={`/meetups/${encodeURIComponent(row.id)}`} className="btn btn-ghost btn-xs rounded-xl">查看详情</Link>
              </td>
            </tr>
          ))}
        </AdminTable>

        <div className="admin-pagination-shell">
          <p className="admin-pagination-copy">当前第 {page}/{totalPages} 页，已加载 {rows.length} 条。</p>
          <div className="join">
            <Link
              className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
              href={buildMeetupsHref({ cityId, category, status, page: prevPage, pageSize })}
            >
              上一页
            </Link>
            <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
            <Link
              className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
              href={buildMeetupsHref({ cityId, category, status, page: nextPage, pageSize })}
            >
              下一页
            </Link>
          </div>
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
