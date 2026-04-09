import AdminTable from "@/app/components/admin/admin-table";
import { fetchUsers } from "@/app/lib/admin-api";
import Link from "next/link";

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

  return (
    <section className="control-page">
      <header className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">User Governance</p>
              <h1 className="text-3xl font-bold">用户中心 / Users</h1>
              <p className="max-w-3xl text-sm leading-6 text-base-content/70">
                这个页面用于识别用户、角色和创建节奏。先明确筛选条件，再查看结果列表，不把查询动作和结果数据混在一起。
              </p>
            </div>
            <div className="control-summary-grid">
              <div className="control-summary-card">
                <span>Total Users</span>
                <strong>{formatCount(totalCount)}</strong>
                <p>当前查询条件下的总记录数</p>
              </div>
              <div className="control-summary-card">
                <span>Current Page</span>
                <strong>{formatCount(rows.length)}</strong>
                <p>本页实际返回的用户记录</p>
              </div>
              <div className="control-summary-card">
                <span>Roles In Page</span>
                <strong>{formatCount(currentRoles)}</strong>
                <p>当前结果页出现的角色类型数</p>
              </div>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Query Focus</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">关键字</span>
                  <span className="font-semibold">{q || "未设置"}</span>
                </div>
              </div>
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">角色过滤</span>
                  <span className="font-semibold">{role || "全部"}</span>
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
              <h2 className="control-area-title">查询条件区</h2>
              <p className="control-area-muted">这一块只用于定义筛选条件和分页大小，不展示结果列表，避免表单和数据混读。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>先确定搜索条件，再看用户结果</strong>
            </div>
            <div className="control-focus-item">
              <span>Boundary</span>
              <strong>该区域不承载用户明细</strong>
            </div>
          </div>

          <form className="control-filter-form mt-5">
        <label className="form-control md:col-span-2">
          <span className="label-text text-xs">关键字 (name/email)</span>
          <input name="q" defaultValue={q} className="input input-bordered input-sm" placeholder="search..." />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">角色</span>
          <input name="role" defaultValue={role} className="input input-bordered input-sm" placeholder="admin" />
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
          <Link href="/users" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>
        </div>
      </section>

      {!usersRes.ok ? (
        <div className="alert alert-warning">
          <span>用户数据读取失败: {usersRes.message}</span>
        </div>
      ) : null}

      <section className="control-area">
        <div className="control-area-header">
          <p className="control-area-label">Area 02</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">用户结果区</h2>
              <p className="control-area-muted">这一块只展示用户查询结果和分页操作。用户一眼能判断自己是在看结果，不是在调条件。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Total</span>
              <strong>{formatCount(totalCount)} 条结果</strong>
            </div>
            <div className="control-focus-item">
              <span>Page</span>
              <strong>第 {page} 页，当前 {rows.length} 条</strong>
            </div>
          </div>

      <AdminTable
            headers={["ID", "姓名", "邮箱", "角色", "创建时间", "操作"]}
        hasRows={rows.length > 0}
        emptyMessage="暂无用户数据 / No user data"
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="font-mono text-xs">{row.id}</td>
            <td>
              <Link href={`/users/${row.id}`} className="link-hover link font-medium text-primary">
                {row.name || row.email || row.id}
              </Link>
            </td>
            <td>{row.email || "-"}</td>
            <td>
              <span className="badge badge-outline badge-sm">{row.role || "-"}</span>
            </td>
            <td>{row.createdAt || "-"}</td>
            <td>
              <Link href={`/users/${row.id}`} className="btn btn-ghost btn-xs">
                详情
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
            href={`/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">
            第 {page} 页
          </button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&page=${nextPage}&pageSize=${pageSize}`}
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
