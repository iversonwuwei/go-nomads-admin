"use client";

import AdminTable from "@/app/components/admin/admin-table";
import {
    AdminField,
    AdminFormGrid,
    AdminModal,
    AdminToolbarSlot,
    AdminWorkspace,
    AdminWorkspaceBreadcrumb,
    AdminWorkspaceHero,
    AdminWorkspaceSection,
    AdminWorkspaceToolbar,
} from "@/app/components/admin/system-workspace";
import { UserIdentityLink } from "@/app/components/admin/user-identity-link";
import {
    createNotification,
    deleteNotification,
    fetchNotifications,
    type NotificationDto,
} from "@/app/lib/admin-api";
import { FunnelIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
    { label: "全部状态", value: "" },
    { label: "已读", value: "read" },
    { label: "未读", value: "unread" },
];

const TYPE_OPTIONS = [
    { label: "系统通知", value: "system" },
    { label: "活动提醒", value: "event" },
    { label: "系统公告", value: "announcement" },
];

const SCOPE_OPTIONS = [
    { label: "管理员广播", value: "admins" },
];

function getScopeDisplayLabel(scope?: string, scopeDisplay?: string) {
    if (scopeDisplay?.trim()) return scopeDisplay;
    if (scope === "admins") return "管理员广播";
    if (scope === "all_users") return "全站用户";
    if (scope === "city_moderators") return "城市版主";
    return scope || "管理员广播";
}

function getRecipientDisplayLabel(scope?: string, recipientSummary?: string, recipientUserName?: string, userId?: string) {
    if (recipientSummary?.trim()) return recipientSummary;
    if (recipientUserName?.trim()) return recipientUserName;
    if (scope === "admins") return "管理员群体";
    return userId?.trim() ? "定向用户" : "管理员群体";
}

function RecipientDisplay({
    scope,
    recipientSummary,
    recipientUserName,
    userId,
}: {
    scope?: string;
    recipientSummary?: string;
    recipientUserName?: string;
    userId?: string;
}) {
    if (userId?.trim()) {
        return <UserIdentityLink userId={userId} userName={recipientUserName || recipientSummary} fallback="定向用户" />;
    }

    return <span>{getRecipientDisplayLabel(scope, recipientSummary, recipientUserName, userId)}</span>;
}

function formatCount(value: number) {
    return new Intl.NumberFormat("zh-CN").format(value);
}

function StatusBadge({ status }: { status?: string }) {
    const map: Record<string, string> = {
        read: "badge-success",
        unread: "badge-warning",
    };
    const labels: Record<string, string> = {
      read: "已读",
      unread: "未读",
  };

    return <span className={`badge badge-sm ${map[status ?? ""] ?? "badge-ghost"}`}>{labels[status ?? ""] ?? status ?? "—"}</span>;
}

export default function NotificationsPage() {
    const [items, setItems] = useState<NotificationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [statusFilter, setStatusFilter] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState("system");
    const [formTitle, setFormTitle] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formScope, setFormScope] = useState("admins");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        fetchNotifications({ page, pageSize, status: statusFilter || undefined }).then((res) => {
            if (!active) return;
        if (res.ok && res.data) {
            setItems(res.data.items);
            setTotal(res.data.totalCount);
        }
        setLoading(false);
    });
      return () => {
          active = false;
      };
  }, [page, pageSize, statusFilter]);

    const readCount = items.filter((item) => item.status === "read").length;
    const unreadCount = items.filter((item) => item.status === "unread").length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    async function reload() {
        setLoading(true);
        const res = await fetchNotifications({ page, pageSize, status: statusFilter || undefined });
      if (res.ok && res.data) {
          setItems(res.data.items);
          setTotal(res.data.totalCount);
      }
      setLoading(false);
  }

    async function handleCreate() {
        if (!formTitle.trim()) return;
        setSaving(true);
        await createNotification({
            type: formType,
            title: formTitle,
            content: formContent,
            scope: formScope,
        });
        setSaving(false);
        setShowForm(false);
        setFormTitle("");
        setFormContent("");
        await reload();
    }

    async function handleDelete(id: string) {
        if (!confirm("确定删除此通知？")) return;
        await deleteNotification(id);
        await reload();
    }

    return (
      <AdminWorkspace>
          <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "通知推送" }]} />
          <AdminWorkspaceHero
              eyebrow="Reach & Recall"
              title="通知推送"
              description="统一管理 App 的召回、提醒和运营触达，让投放条件、受众与结果表保持清晰分层。"
              actions={
                  <>
                      <button type="button" className="btn btn-primary rounded-2xl" onClick={() => setShowForm(true)}>
                          <PlusIcon className="h-4 w-4" /> 新建通知
                      </button>
                      <Link href="/app-control" className="btn btn-outline rounded-2xl">
                          返回 App 控制台
                      </Link>
                  </>
              }
              stats={[
                  { label: "Total Notifications", value: String(total), hint: "当前筛选范围内的总通知量" },
                  { label: "Unread In Page", value: String(unreadCount), hint: "当前页待关注的未读通知" },
                  { label: "Current Page", value: `${page}/${totalPages}`, hint: "当前分页位置" },
              ]}
          />

          <AdminWorkspaceSection
              title="投放筛选与范围"
              description="先明确通知状态和当前可投放范围，再进入结果表做查看、删除或详情处理。"
          >
              <AdminWorkspaceToolbar>
                  <AdminToolbarSlot label="状态过滤">
                      <FunnelIcon className="admin-toolbar-search-icon h-4 w-4" />
                      <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                          {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </AdminToolbarSlot>
                  <AdminToolbarSlot label="当前默认受众">
                      <div className="text-sm font-medium text-base-content">管理员广播</div>
                  </AdminToolbarSlot>
                  <AdminToolbarSlot label="读数概览">
                      <div className="text-sm text-base-content/70">已读 {formatCount(readCount)} / 未读 {formatCount(unreadCount)}</div>
                  </AdminToolbarSlot>
              </AdminWorkspaceToolbar>
          </AdminWorkspaceSection>

          <AdminWorkspaceSection
              title="通知结果"
              description="按类型、受众、状态和时间统一审视投放明细，保留详情跳转和删除动作。"
          >
              <AdminTable
                  headers={["类型", "标题", "内容摘要", "发送范围", "状态", "时间", "操作"]}
                  hasRows={!loading && items.length > 0}
                  colSpan={7}
                  emptyMessage={loading ? "加载中…" : "暂无通知数据"}
                  meta={
                      <>
                          <div>
                              <span className="admin-table-meta-label">Current Result Set</span>
                              <span className="admin-table-meta-value">{items.length}</span>
                  </div>
                          <p className="admin-table-meta-copy">列表内保留查看和删除动作，避免在投放页面重复出现多套局部样式和交互层级。</p>
                      </>
                  }
              >
                  {items.map((notification) => (
                      <tr key={notification.id}>
                          <td>
                              <span className="badge badge-sm badge-outline">{notification.type || "—"}</span>
                          </td>
                          <td>
                      <div className="admin-entity-copy">
                          <Link href={`/notifications/${notification.id}`} className="admin-entity-title text-primary hover:underline">
                              {notification.title || "—"}
                          </Link>
                          <span className="admin-entity-subtitle">Notification ID · {notification.id.slice(0, 8)}</span>
                      </div>
                  </td>
                  <td className="max-w-xs truncate text-base-content/70">{notification.content || "—"}</td>
                  <td className="text-xs">
                      <div className="space-y-1">
                          <p>{getScopeDisplayLabel(notification.scope, notification.scopeDisplay)}</p>
                          <p className="text-[11px] text-base-content/50">
                              <RecipientDisplay
                                  scope={notification.scope}
                                  recipientSummary={notification.recipientSummary}
                                  recipientUserName={notification.recipientUserName}
                                  userId={notification.userId}
                              />
                          </p>
                      </div>
                  </td>
                  <td><StatusBadge status={notification.status} /></td>
                  <td className="text-xs text-base-content/55">{(notification.readAt || notification.createdAt)?.slice(0, 16).replace("T", " ") || "—"}</td>
                  <td>
                      <div className="flex items-center justify-end gap-1">
                          <Link href={`/notifications/${notification.id}`} className="btn btn-ghost btn-xs rounded-xl">详情</Link>
                          <button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(notification.id)}>
                              <TrashIcon className="h-4 w-4" />
                          </button>
                      </div>
                  </td>
              </tr>
          ))}
              </AdminTable>
          </AdminWorkspaceSection>

          {totalPages > 1 ? (
              <div className="admin-pagination-shell">
                  <p className="admin-pagination-copy">第 {page}/{totalPages} 页，共 {total} 条</p>
                  <div className="join">
                      <button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
                      <button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
                  </div>
              </div>
          ) : null}

          <AdminModal
              open={showForm}
              title="新建通知"
              description="创建的是一次运营触达动作，不只是新增数据。请先确认通知类型、范围和文案是否与当前目标一致。"
              onClose={() => setShowForm(false)}
              actions={
                  <>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
                      <button type="button" className="btn btn-primary btn-sm" disabled={saving || !formTitle.trim()} onClick={handleCreate}>
                    {saving ? "发送中…" : "发送通知"}
                </button>
                  </>
              }
          >
              <AdminFormGrid>
                  <AdminField label="通知类型">
                      <select value={formType} onChange={(event) => setFormType(event.target.value)}>
                          {TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </AdminField>
                  <AdminField label="发送范围" hint="当前后端接口固定发送给管理员，暂不支持更细的受众编排。">
                      <select value={formScope} onChange={(event) => setFormScope(event.target.value)}>
                          {SCOPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </AdminField>
                  <div className="lg:col-span-2">
                      <AdminField label="标题">
                          <input value={formTitle} onChange={(event) => setFormTitle(event.target.value)} placeholder="通知标题" />
                      </AdminField>
                  </div>
                  <div className="lg:col-span-2">
                      <AdminField label="内容">
                          <textarea value={formContent} onChange={(event) => setFormContent(event.target.value)} placeholder="通知内容…" />
                      </AdminField>
                  </div>
              </AdminFormGrid>
          </AdminModal>
      </AdminWorkspace>
  );
}