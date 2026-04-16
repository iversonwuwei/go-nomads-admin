import Linklnextlinextlink
import AdminTable AdminWorkspaceToolbar, admintable
ents / adm
AdminToolbarSlot,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
  ents - works / syscomponentspworks / systempworkspace";
import { fetchUsers }tchUser@/app/libcadmin-apir@/app/libfadmin-api"@/app/lib/admin-api";

type UsersPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function buildUsersHref({
  q,
  role,
  page,
  pageSize,
}: {
  q: string;
  role: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return `/users?${params.toString()}`;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = (await searchParams) ?? {};
  const q = asSingle(params.q).trim();
  const role = asSingle(params.role).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const usersRes = await fetchUsers({ q, role, page, pageSize });
  const payload = usersRes.data;
  const rows = payload?.items ?? [];
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);

  const totalCount = payload?.totalCount ?? 0;
  const currentRoles = new Set(rows.map((row) => row.role).filter(Boolean)).size;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "用户中心" }]} />
      <AdminWorkspaceHero
        eyebrow="User Governance"
        title="用户中心 / Users"
        description="这个页面用于识别用户、角色和创建节奏。先明确筛选条件，再查看结果列表，不把查询动作和结果数据混在一起。"
        actions={
          <Link href="/operations" className="btn btn-outline rounded-2xl">
            返回运营入口
          </Link>
        }
        stats={[
          { label: "Total Users", value: formatCount(totalCount), hint: "当前查询条件下的总记录数" },
          { label: "Current Page", value: formatCount(rows.length), hint: "本页实际返回的用户记录" },
          { label: "Roles In Page", value: formatCount(currentRoles), hint: "当前结果页出现的角色类型数" },
        ]}
      />

      <AdminWorkspaceSection
        title="查询条件"
        description="先收窄关键词、角色和分页大小，再进入结果表查看用户主档与详情入口。"
      >
        <form>
          <input type="hidden" name="page" value="1" />
          <AdminWorkspaceToolbar>
            <AdminToolbarSlot label="关键字" grow>
              <input
                name="q"
                defaultValue={q}
                className="input input-bordered input-sm w-full"
                placeholder="搜索 name / email"
              />
            </AdminToolbarSlot>
            <AdminToolbarSlot label="角色">
              <input
                name="role"
                defaultValue={role}
                className="input input-bordered input-sm w-full"
                placeholder="admin"
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
              <div className="text-sm text-base-content/70">
                关键词 {q || "未设置"} / 角色 {role || "全部"}
              </div>
            </AdminToolbarSlot>
            <AdminToolbarSlot label="操作">
              <div className="flex items-center gap-2">
                <button type="submit" className="btn btn-primary btn-sm rounded-xl">查询</button>
                <Link href="/users" className="btn btn-outline btn-sm rounded-xl">重置</Link>
              </div>
            </AdminToolbarSlot>
          </AdminWorkspaceToolbar>
        </form>
      </AdminWorkspaceSection>

      {!usersRes.ok ? (
        <div className="alert alert-warning">
          <span>用户数据读取失败: {usersRes.message}</span>
        </div>
      ) : null}

      <AdminWorkspaceSection
        title="用户结果"
        description="按用户主档、邮箱、角色与创建时间统一查看结果，详情跳转保持在列表内，避免把治理动作重新塞回筛选区。"
      >
        <AdminTable
          headers={["用户", "邮箱", "角色", "创建时间", "操作"]}
          hasRows={rows.length > 0}
          emptyMessage="暂无用户数据 / No user data"
          colSpan={5}
          meta={
            <>
              <div>
                <span className="admin-table-meta-label">Current Result Set</span>
                <span className="admin-table-meta-value">{formatCount(rows.length)}</span>
              </div>
              <p className="admin-table-meta-copy">第 {page}/{totalPages} 页，共 {formatCount(totalCount)} 条结果。列表仅保留详情跳转，减少筛选区与结果区语义混杂。</p>
            </>
          }
        >
          {rows.map((row) => (
            <tr key={row.id}>
            <td>
              <div className="admin-entity-copy">
                <Link href={`/users/${row.id}`} className="admin-entity-title text-primary hover:underline">
                  {row.name || row.email || row.id}
                </Link>
                <span className="admin-entity-subtitle">User ID · {row.id}</span>
              </div>
            </td>
            <td>{row.email || "-"}</td>
            <td>
              <span className="badge badge-outline badge-sm">{row.role || "-"}</span>
            </td>
            <td className="text-sm text-base-content/65">{row.createdAt || "-"}</td>
            <td>
              <Link href={`/users/${row.id}`} className="btn btn-ghost btn-xs rounded-xl">
                详情
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
              href={buildUsersHref({ q, role, page: prevPage, pageSize })}
            >
              上一页
            </Link>
            <button type="button" className="join-item btn btn-sm btn-disabled">
              第 {page} 页
            </button>
            <Link
              className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
              href={buildUsersHref({ q, role, page: nextPage, pageSize })}
            >
              下一页
            </Link>
          </div>
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
