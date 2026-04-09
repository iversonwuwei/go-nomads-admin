"use client";

import AdminTable from "@/app/components/admin/admin-table";
import {
  AdminField,
  AdminFormGrid,
  AdminModal,
  AdminWorkspace,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  AdminWorkspaceToolbar,
} from "@/app/components/admin/system-workspace";
import {
  createRole,
  deleteRole,
  fetchRoles,
  fetchRoleUsers,
  updateRole,
  type RoleDto,
  type UserDto,
} from "@/app/lib/admin-api";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type RoleFormState = {
  name: string;
  description: string;
};

function inferScope(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("super") || normalized.includes("admin")) return "global";
  if (normalized.includes("moderator")) return "city-cluster";
  return "regional";
}

function formatDateLabel(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>({ name: "", description: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [usersRole, setUsersRole] = useState<RoleDto | null>(null);
  const [roleUsers, setRoleUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadRoles = useCallback(async () => {
    const res = await fetchRoles();
    if (!res.ok || !res.data) {
      setRoles([]);
      setError(res.message || "角色读取失败");
      setLoading(false);
      return;
    }

    setRoles(res.data);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        void loadRoles();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadRoles]);

  const filteredRoles = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return roles;

    return roles.filter((role) =>
      [role.name, role.description, inferScope(role.name)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [roles, search]);

  const totalUsers = useMemo(
    () => roles.reduce((sum, role) => sum + (role.userCount ?? 0), 0),
    [roles],
  );

  function openCreateModal() {
    setEditingRole(null);
    setForm({ name: "", description: "" });
    setFormOpen(true);
  }

  function openEditModal(role: RoleDto) {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description ?? "" });
    setFormOpen(true);
  }

  function closeFormModal() {
    setEditingRole(null);
    setForm({ name: "", description: "" });
    setFormOpen(false);
  }

  async function openUsersModal(role: RoleDto) {
    setUsersRole(role);
    setUsersLoading(true);
    const res = await fetchRoleUsers(role.id);
    if (!res.ok || !res.data) {
      setRoleUsers([]);
      setError(res.message || "角色用户读取失败");
      setUsersLoading(false);
      return;
    }

    setRoleUsers(res.data);
    setUsersLoading(false);
  }

  async function handleDelete(role: RoleDto) {
    if (!window.confirm(`确认删除角色“${role.name}”吗？`)) return;

    startTransition(() => {
      void (async () => {
        const res = await deleteRole(role.id);
        if (!res.ok) {
          setError(res.message || "删除角色失败");
          return;
        }
        setLoading(true);
        await loadRoles();
      })();
    });
  }

  function handleSubmit() {
    startTransition(() => {
      void (async () => {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
        };

        if (!payload.name) {
          setError("角色名称不能为空");
          return;
        }

        const res = editingRole
          ? await updateRole(editingRole.id, payload)
          : await createRole(payload);

        if (!res.ok) {
          setError(res.message || "角色保存失败");
          return;
        }

        closeFormModal();
        setLoading(true);
        await loadRoles();
      })();
    });
  }

  return (
    <AdminWorkspace>
      <AdminWorkspaceHero
        eyebrow="System / IAM"
        title="角色权限治理"
        description="把角色实体、成员归属和后台操作统一到一个产品化 workflow 中，避免继续停留在只读表格和占位按钮。"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            新建角色
          </button>
        }
        stats={[
          { label: "角色总数", value: String(roles.length), hint: "含系统内建与业务角色" },
          { label: "已分配成员", value: String(totalUsers), hint: "基于角色当前用户数汇总" },
          { label: "当前视图", value: String(filteredRoles.length), hint: "受搜索条件影响" },
        ]}
      />

      <AdminWorkspaceSection
        title="角色列表"
        description="统一查看角色说明、成员规模和作用域，并在同页完成创建、编辑、删除和成员核查。"
      >
        <AdminWorkspaceToolbar>
          <label className="admin-field">
            <span className="admin-field-label">搜索角色</span>
            <span className="admin-field-hint">按角色名、说明或作用域筛选</span>
            <span className="admin-field-control">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="例如 admin / moderator / regional"
              />
            </span>
          </label>
          <article className="admin-workspace-stat">
            <span>最新更新时间</span>
            <strong>{formatDateLabel(roles[0]?.updatedAt)}</strong>
            <p>按角色数据最近变更时间展示</p>
          </article>
          <article className="admin-workspace-stat">
            <span>分配密度</span>
            <strong>{roles.length ? (totalUsers / roles.length).toFixed(1) : "0.0"}</strong>
            <p>平均每个角色的成员数</p>
          </article>
          <article className="admin-workspace-stat">
            <span>治理风险</span>
            <strong>{roles.some((role) => (role.userCount ?? 0) > 25) ? "需关注" : "稳定"}</strong>
            <p>用于快速定位大范围授权角色</p>
          </article>
        </AdminWorkspaceToolbar>

        {error ? (
          <div className="alert alert-warning mt-4">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-4">
          <AdminTable
            headers={["角色", "说明", "成员数", "Scope", "更新时间", "操作"]}
            hasRows={!loading && filteredRoles.length > 0}
            emptyMessage={loading ? "角色加载中..." : "暂无角色数据"}
          >
            {filteredRoles.map((role) => (
              <tr key={role.id}>
                <td>
                  <div className="space-y-1">
                    <p className="font-semibold text-base-content">{role.name}</p>
                    <p className="text-xs text-base-content/50">{role.id}</p>
                  </div>
                </td>
                <td className="text-sm text-base-content/70">{role.description || "-"}</td>
                <td className="font-semibold">{role.userCount ?? 0}</td>
                <td>
                  <span className="badge badge-outline badge-sm">{inferScope(role.name)}</span>
                </td>
                <td className="text-sm text-base-content/60">{formatDateLabel(role.updatedAt)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => void openUsersModal(role)}>
                      成员
                    </button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => openEditModal(role)}>
                      编辑
                    </button>
                    <button type="button" className="btn btn-xs btn-error btn-outline" onClick={() => void handleDelete(role)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </AdminWorkspaceSection>

      <AdminModal
        open={formOpen}
        title={editingRole ? `编辑角色 · ${editingRole.name}` : "新建角色"}
        description="统一使用标准表单间距、输入框高度和描述文字层级，降低后台维护成本。"
        onClose={closeFormModal}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeFormModal}>
              取消
            </button>
            <button type="button" className="btn btn-primary" disabled={isPending} onClick={handleSubmit}>
              {isPending ? "保存中..." : editingRole ? "保存修改" : "创建角色"}
            </button>
          </>
        }
      >
        <AdminFormGrid>
          <AdminField label="角色名称" hint="建议保持与后端 RBAC 命名一致，避免额外映射。">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </AdminField>
          <AdminField label="治理范围" hint="当前根据角色命名自动推断，用于前端快速识别。">
            <input value={inferScope(form.name || editingRole?.name || "")} readOnly />
          </AdminField>
          <div className="md:col-span-2">
            <AdminField label="角色说明" hint="描述此角色的授权目的、边界和适用对象。">
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="例如：负责全局平台治理、可操作系统配置与法务内容"
              />
            </AdminField>
          </div>
        </AdminFormGrid>
      </AdminModal>

      <AdminModal
        open={Boolean(usersRole)}
        title={usersRole ? `${usersRole.name} · 角色成员` : "角色成员"}
        description="快速核查该角色当前的授权覆盖面，辅助判断是否适合继续保留或拆分。"
        onClose={() => {
          setUsersRole(null);
          setRoleUsers([]);
        }}
      >
        {usersLoading ? (
          <p className="text-sm text-base-content/60">成员加载中...</p>
        ) : roleUsers.length === 0 ? (
          <p className="text-sm text-base-content/60">当前角色暂无成员。</p>
        ) : (
          <div className="space-y-3">
            {roleUsers.map((user) => (
              <article key={user.id} className="rounded-2xl border border-base-300/70 bg-base-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-base-content">{user.name || user.email || user.id}</p>
                    <p className="text-sm text-base-content/55">{user.email || user.phone || "无联系方式"}</p>
                  </div>
                  <span className="badge badge-outline">{user.role || usersRole?.name}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminModal>
    </AdminWorkspace>
  );
}
