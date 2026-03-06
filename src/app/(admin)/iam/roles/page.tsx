import AdminTable from "@/app/components/admin/admin-table";
import { fetchRoles } from "@/app/lib/admin-api";

function inferScope(name: string): string {
  if (name.includes("super") || name.includes("admin")) return "global";
  if (name.includes("moderator")) return "global/by-city";
  return "global/by-region";
}

export default async function RolesPage() {
  const rolesRes = await fetchRoles();
  const roleRows = rolesRes.data ?? [];

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">角色权限管理 / IAM Roles</h1>
            <p className="mt-2 text-sm text-base-content/70">
              管理 RBAC 角色、权限矩阵与城市/区域范围授权。
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm">+ 新建角色</button>
        </div>
      </header>

      {!rolesRes.ok ? (
        <div className="alert alert-warning">
          <span>角色数据读取失败: {rolesRes.message}</span>
        </div>
      ) : null}

      <AdminTable
        headers={["角色", "说明", "人数", "Scope", "操作"]}
        hasRows={roleRows.length > 0}
        emptyMessage="暂无角色数据 / No role data"
      >
        {roleRows.map((row) => (
          <tr key={row.id}>
            <td className="font-mono text-xs">{row.name}</td>
            <td>{row.description}</td>
            <td>{row.userCount ?? "-"}</td>
            <td>
              <span className="badge badge-info badge-sm">{inferScope(row.name)}</span>
            </td>
            <td>
              <div className="flex gap-2">
                <button type="button" className="btn btn-xs">权限矩阵</button>
                <button type="button" className="btn btn-xs btn-outline">编辑</button>
                <button type="button" className="btn btn-xs btn-error">删除</button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}
