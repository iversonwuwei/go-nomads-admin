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

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h1 className="text-2xl font-bold">用户中心 / Users</h1>
        <p className="mt-2 text-sm text-base-content/70">
          实时读取用户列表和搜索结果，支持按角色筛选。
        </p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm md:grid-cols-5">
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

      {!usersRes.ok ? (
        <div className="alert alert-warning">
          <span>用户数据读取失败: {usersRes.message}</span>
        </div>
      ) : null}

      <AdminTable
        headers={["ID", "姓名", "邮箱", "角色", "创建时间"]}
        hasRows={rows.length > 0}
        emptyMessage="暂无用户数据 / No user data"
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="font-mono text-xs">{row.id}</td>
            <td>{row.name || "-"}</td>
            <td>{row.email || "-"}</td>
            <td>
              <span className="badge badge-outline badge-sm">{row.role || "-"}</span>
            </td>
            <td>{row.createdAt || "-"}</td>
          </tr>
        ))}
      </AdminTable>

      <div className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
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
    </section>
  );
}
