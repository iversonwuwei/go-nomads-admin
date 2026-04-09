"use client";

import {
    AdminDetailCard,
    AdminDetailGrid,
    AdminField,
    AdminFormGrid,
    AdminWorkspace,
    AdminWorkspaceBreadcrumb,
    AdminWorkspaceHero,
    AdminWorkspaceSection,
} from "@/app/components/admin/system-workspace";
import { changeUserRole, fetchRoles, fetchUserById, updateUser, type RoleDto, type UserDto } from "@/app/lib/admin-api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDto | null>(null);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileForm>({ name: "", email: "", phone: "", avatarUrl: "", bio: "" });
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;

    Promise.all([fetchUserById(id), fetchRoles()]).then(([userRes, rolesRes]) => {
      if (!active) return;

      if (!userRes.ok || !userRes.data) {
        setError(`用户详情读取失败: ${userRes.message}`);
        setLoading(false);
        return;
      }

      const loadedUser = userRes.data;
      const loadedRoles = rolesRes.data ?? [];
      const matchedRole = loadedRoles.find((role) => role.name === loadedUser.role || role.id === loadedUser.role);

      setUser(loadedUser);
      setRoles(loadedRoles);
      setProfileForm({
        name: loadedUser.name || "",
        email: loadedUser.email || "",
        phone: loadedUser.phone || "",
        avatarUrl: loadedUser.avatarUrl || "",
        bio: loadedUser.bio || "",
      });
      setSelectedRoleId(matchedRole?.id || "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSaveProfile() {
    if (!id) return;

    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const res = await updateUser(id, {
      name: profileForm.name.trim() || undefined,
      email: profileForm.email.trim() || undefined,
      phone: profileForm.phone.trim() || undefined,
      avatarUrl: profileForm.avatarUrl.trim() || undefined,
      bio: profileForm.bio.trim() || undefined,
    });

    if (!res.ok || !res.data) {
      setError(res.message || "用户资料更新失败");
    } else {
      setUser(res.data);
      setSuccess("用户资料已更新");
    }

    setSavingProfile(false);
  }

  async function handleSaveRole() {
    if (!id || !selectedRoleId) return;

    setSavingRole(true);
    setError(null);
    setSuccess(null);

    const res = await changeUserRole(id, selectedRoleId);
    if (!res.ok || !res.data) {
      setError(res.message || "用户角色更新失败");
    } else {
      setUser(res.data);
      setSuccess("用户角色已更新");
    }

    setSavingRole(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!user) {
    const isMissingMasterUser = (error || "").includes("User not found");

    return (
      <AdminWorkspace>
        <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "用户", href: "/users" }, { label: "用户完整性" }]} />
        <AdminWorkspaceHero
          eyebrow="User Integrity"
          title={isMissingMasterUser ? "孤儿用户引用" : "用户详情读取失败"}
          description={isMissingMasterUser
            ? "UserService 中不存在这个用户主档，但后台业务数据仍在引用该 userId。当前问题已经收敛为主数据缺失，而不是导航异常。"
            : error || "用户详情读取失败"}
          actions={
            <>
              <Link href="/users" className="btn btn-primary rounded-2xl">返回列表</Link>
              <Link href="/app-control" className="btn btn-outline rounded-2xl">进入 App 控制台</Link>
            </>
          }
        />
        <AdminWorkspaceSection title="缺失主档说明" description="保留 userId 原值，方便回查引用链路与跨服务治理。">
          <AdminDetailCard title="用户主档缺失" tone="warning">
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-base-content/75">
              <p className="font-medium text-base-content">用户 ID</p>
              <p className="mt-1 break-all font-mono text-xs">{id}</p>
            </div>
          </AdminDetailCard>
        </AdminWorkspaceSection>
      </AdminWorkspace>
    );
  }

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "用户", href: "/users" }, { label: user.name || user.email || user.id }]} />
      <AdminWorkspaceHero
        eyebrow="User Governance"
        title={user.name || user.email || "用户详情"}
        description="在详情页完成基础资料治理、会员信号查看和角色切换，不把后台操作堆回列表。"
        actions={<Link href="/users" className="btn btn-outline rounded-2xl">返回列表</Link>}
        stats={[
          { label: "Role", value: user.role || "—", hint: "当前生效角色" },
          { label: "Membership", value: user.membership?.levelName || "未订阅", hint: `剩余 ${user.membership?.remainingDays ?? 0} 天` },
          { label: "AI Usage", value: `${user.membership?.aiUsageThisMonth ?? 0} / ${user.membership?.aiUsageLimit ?? 0}`, hint: "本月 AI 配额使用量" },
        ]}
      />

      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success"><span>{success}</span></div> : null}

      <AdminWorkspaceSection
        title="账户概览与会员信号"
        description="把账户基础信息和会员/旅行信号拆成两张稳定信息卡，方便运营快速定位用户状态。"
      >
        <AdminDetailGrid variant="balanced">
          <AdminDetailCard title="账户概览" description="展示主档字段和变更时间，保持用户治理信息的可读性。">
            <div>
              <Row label="用户 ID" value={user.id} />
              <Row label="当前角色" value={user.role} />
              <Row label="创建时间" value={user.createdAt} />
              <Row label="最后更新" value={user.updatedAt} />
            </div>
          </AdminDetailCard>

          <AdminDetailCard title="会员与旅行信号" description="补足权益、旅行活跃度和 AI 使用量，帮助判断是否需要进一步运营动作。">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-base-300/50 bg-base-200/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Membership</p>
                  <p className="mt-2 text-lg font-semibold">{user.membership?.levelName || "未订阅"}</p>
                  <p className="mt-1 text-sm text-base-content/65">剩余 {user.membership?.remainingDays ?? 0} 天</p>
                </div>
                <div className="rounded-2xl border border-base-300/50 bg-base-200/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Travel Stats</p>
                  <p className="mt-2 text-lg font-semibold">{user.stats?.totalTrips ?? 0} 次行程</p>
                  <p className="mt-1 text-sm text-base-content/65">{user.stats?.countriesVisited ?? 0} 国 / {user.stats?.citiesVisited ?? 0} 城</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-base-300/50 bg-base-100 p-4 text-sm">
                  <div className="text-base-content/55">AI 可用</div>
                  <div className="mt-1 font-semibold">{user.membership?.canUseAI ? "是" : "否"}</div>
                </div>
                <div className="rounded-2xl border border-base-300/50 bg-base-100 p-4 text-sm">
                  <div className="text-base-content/55">版主申请</div>
                  <div className="mt-1 font-semibold">{user.membership?.canApplyModerator ? "允许" : "未开放"}</div>
                </div>
                <div className="rounded-2xl border border-base-300/50 bg-base-100 p-4 text-sm">
                  <div className="text-base-content/55">AI 用量</div>
                  <div className="mt-1 font-semibold">{user.membership?.aiUsageThisMonth ?? 0} / {user.membership?.aiUsageLimit ?? 0}</div>
                </div>
              </div>
            </div>
          </AdminDetailCard>
        </AdminDetailGrid>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection title="资料与角色治理" description="把资料编辑和角色调整拆成两块独立控制面，便于分别保存和追踪。">
        <AdminDetailGrid variant="balanced">
          <AdminDetailCard
            title="资料治理"
            description="更新基础展示信息，避免前台继续暴露错误头像、邮箱或简介。"
            actions={
              <button type="button" className="btn btn-primary btn-sm rounded-2xl" disabled={savingProfile} onClick={handleSaveProfile}>
                {savingProfile ? "保存中..." : "保存资料"}
              </button>
            }
          >
            <AdminFormGrid>
              <AdminField label="姓名">
                <input value={profileForm.name} onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))} />
              </AdminField>
              <AdminField label="邮箱">
                <input value={profileForm.email} onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))} />
              </AdminField>
              <AdminField label="手机号">
                <input value={profileForm.phone} onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </AdminField>
              <AdminField label="头像 URL">
                <input value={profileForm.avatarUrl} onChange={(event) => setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))} />
              </AdminField>
              <div className="md:col-span-2 lg:col-span-2">
                <AdminField label="个人简介">
                  <textarea value={profileForm.bio} onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))} />
                </AdminField>
              </div>
            </AdminFormGrid>
          </AdminDetailCard>

          <AdminDetailCard
            title="角色治理"
            description="角色切换直接调用后端接口，不在前端做假状态同步。"
            actions={
              <button type="button" className="btn btn-primary btn-sm rounded-2xl" disabled={savingRole || !selectedRoleId} onClick={handleSaveRole}>
                {savingRole ? "更新中..." : "更新角色"}
              </button>
            }
          >
            <AdminFormGrid>
              <AdminField label="角色">
                <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
                  <option value="">请选择角色</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </AdminField>
            </AdminFormGrid>
            <div className="mt-5 rounded-2xl border border-base-300/50 bg-base-200/20 px-4 py-3 text-sm text-base-content/70">
              当前生效角色: <span className="font-semibold text-base-content">{user.role || "—"}</span>
            </div>
          </AdminDetailCard>
        </AdminDetailGrid>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}