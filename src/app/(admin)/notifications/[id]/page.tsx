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
import { UserIdentityLink } from "@/app/components/admin/user-identity-link";
import {
    deleteNotification,
    fetchNotificationById,
    type NotificationDetailDto,
    updateNotification,
} from "@/app/lib/admin-api";
import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<NotificationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("system");
  const [content, setContent] = useState("");
  const [metadata, setMetadata] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchNotificationById(id).then((res) => {
      if (!active) return;
      if (res.ok && res.data) {
        setDetail(res.data);
        setTitle(res.data.title || "");
        setType(res.data.type || "system");
        setContent(res.data.content || "");
        setMetadata(res.data.metadata || "");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSave() {
    if (!detail || saving) return;
    setSaving(true);
    const res = await updateNotification(detail.id, { title, type, message: content, metadata });
    if (res.ok && res.data) setDetail(res.data);
    setSaving(false);
  }

  async function handleDelete() {
    if (!detail || saving || !confirm("确定删除此通知？")) return;
    setSaving(true);
    await deleteNotification(detail.id);
    router.push("/notifications");
    router.refresh();
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><span className="loading loading-spinner loading-md" /></div>;
  }

  if (!detail) {
    return (
      <AdminWorkspace>
        <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "通知推送", href: "/notifications" }, { label: "通知不存在" }]} />
        <AdminWorkspaceHero
          eyebrow="Notification Integrity"
          title="通知不存在"
          description="当前通知记录已经不可用，请返回列表重新确认数据源或筛选条件。"
          actions={<Link href="/notifications" className="btn btn-primary rounded-2xl">返回列表</Link>}
        />
      </AdminWorkspace>
    );
  }

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "通知推送", href: "/notifications" }, { label: detail.title || detail.id }]} />
      <AdminWorkspaceHero
        eyebrow="Notification Operations"
        title={detail.title || "通知详情"}
        description="在详情页完成文案调整、投放信息确认和删除动作，列表页只保留结果浏览与轻量治理。"
        actions={
          <>
            <Link href="/notifications" className="btn btn-outline rounded-2xl">返回列表</Link>
            <button type="button" className="btn btn-outline btn-error rounded-2xl" disabled={saving} onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" /> 删除通知
            </button>
          </>
        }
        stats={[
          { label: "Status", value: detail.status || (detail.isRead ? "read" : "unread"), hint: "当前通知读取状态" },
          { label: "Delivered / Read", value: `${detail.deliveredCount ?? 1} / ${detail.readCount ?? 0}`, hint: "送达与已读数量" },
          { label: "Audience", value: getScopeDisplayLabel(detail.scope, detail.scopeDisplay), hint: "当前通知发送范围" },
        ]}
      />

      <AdminWorkspaceSection
        title="通知内容与投放配置"
        description="将可编辑字段与实际投放信息分栏呈现，避免把状态说明和编辑表单混在一起。"
        actions={
          <button type="button" className="btn btn-primary btn-sm rounded-2xl" disabled={saving} onClick={handleSave}>
            {saving ? "保存中…" : "保存修改"}
          </button>
        }
      >
        <AdminDetailGrid variant="split">
          <AdminDetailCard title="编辑通知" description="调整标题、类型、正文和 metadata，不改变投放受众语义。">
            <AdminFormGrid>
              <AdminField label="标题">
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </AdminField>
              <AdminField label="类型">
                <input value={type} onChange={(event) => setType(event.target.value)} />
              </AdminField>
              <div className="lg:col-span-2">
                <AdminField label="内容">
                  <textarea value={content} onChange={(event) => setContent(event.target.value)} />
                </AdminField>
              </div>
              <div className="lg:col-span-2">
                <AdminField label="Metadata" hint="保留原始附加信息，便于调试客户端路由或行为。">
                  <textarea value={metadata} onChange={(event) => setMetadata(event.target.value)} placeholder='{"key":"value"}' />
                </AdminField>
              </div>
            </AdminFormGrid>
          </AdminDetailCard>

          <AdminDetailCard title="投放信息" description="展示通知实际作用的受众、读数与调度上下文。">
            <div>
              <InfoRow label="发送范围" value={getScopeDisplayLabel(detail.scope, detail.scopeDisplay)} />
              <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
                <span className="text-base-content/60">接收对象</span>
                <span className="font-medium text-right">
                  <RecipientDisplay
                    scope={detail.scope}
                    recipientSummary={detail.recipientSummary}
                    recipientUserName={detail.recipientUserName}
                    userId={detail.userId}
                  />
                </span>
              </div>
              <InfoRow label="送达数" value={detail.deliveredCount ?? 1} />
              <InfoRow label="已读数" value={detail.readCount ?? 0} />
              <InfoRow label="调度时间" value={detail.scheduledAt || "即时发送"} />
              <InfoRow label="关联资源" value={detail.relatedResourceName || "—"} />
              <InfoRow label="创建时间" value={detail.createdAt} />
            </div>
          </AdminDetailCard>
        </AdminDetailGrid>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}