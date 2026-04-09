"use client";

import { UserIdentityInfoRow, UserIdentityLink } from "@/app/components/admin/user-identity-link";
import { type ConversationDetailDto, deleteConversation, fetchConversationById } from "@/app/lib/admin-api";
import { ChatBubbleLeftRightIcon, ChevronRightIcon, HomeIcon, TrashIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ConversationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchConversationById(id).then((res) => {
      if (!active) return;
      if (res.ok && res.data) setDetail(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!detail || deleting || !confirm("确定删除此聊天室？")) return;
    setDeleting(true);
    await deleteConversation(detail.id);
    router.push("/chat");
    router.refresh();
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><span className="loading loading-spinner loading-md" /></div>;
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-base-content/50">
        <p>聊天室不存在</p>
        <Link href="/chat" className="btn btn-sm btn-primary">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-base-content/50">
        <Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
        <ChevronRightIcon className="h-3 w-3" />
        <Link href="/chat" className="hover:text-primary">聊天记录</Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-base-content">{detail.name || detail.id}</span>
      </div>

      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{detail.name || "未命名房间"}</h1>
              <p className="mt-1 text-sm text-base-content/60">{[detail.roomType, detail.city, detail.country].filter(Boolean).join(" / ") || "聊天室详情"}</p>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-error btn-sm" disabled={deleting} onClick={handleDelete}>
            <TrashIcon className="h-4 w-4" /> 删除房间
          </button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">基础信息</h2>
          <div className="mt-4">
            <InfoRow label="房间 ID" value={detail.id} />
            <InfoRow label="类型" value={detail.roomType} />
            <UserIdentityInfoRow label="创建者" userId={detail.createdBy} userName={detail.createdByName} fallback="未命名创建者" />
            <InfoRow label="公开房间" value={detail.isPublic ? "是" : "否"} />
            <InfoRow label="成员数" value={detail.totalMembers} />
            <InfoRow label="最近活跃" value={detail.lastActiveAt} />
            <InfoRow label="创建时间" value={detail.createdAt} />
            <InfoRow label="更新时间" value={detail.updatedAt} />
          </div>
          {detail.description ? <p className="mt-4 rounded-xl bg-base-200/60 p-4 text-sm text-base-content/70">{detail.description}</p> : null}
        </article>

        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">成员</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(detail.members ?? []).length === 0 ? (
              <p className="text-sm text-base-content/40">暂无成员数据</p>
            ) : (
              detail.members?.map((member) => (
                <div key={`${member.userId}-${member.role}`} className="flex items-center justify-between rounded-xl border border-base-300/50 px-4 py-3 text-sm">
                  <div>
                    <UserIdentityLink userId={member.userId} userName={member.userName} fallback="未命名成员" />
                  </div>
                  <div className="text-right">
                    <p className="badge badge-outline badge-sm">{member.role || "member"}</p>
                    <p className="mt-2 text-xs text-base-content/50">{member.isOnline ? "在线" : member.lastSeenAt || "离线"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">最近消息</h2>
        <div className="mt-4 space-y-3">
          {(detail.messages ?? []).length === 0 ? (
            <p className="text-sm text-base-content/40">暂无消息</p>
          ) : (
            detail.messages?.map((message) => (
              <div key={message.id} className="rounded-xl border border-base-300/50 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-base-content/50">
                  <UserIdentityLink userId={message.userId} userName={message.userName} fallback="未命名发送者" className="text-primary hover:underline" plainClassName="font-medium text-base-content/70" />
                  <span>{message.timestamp?.slice(0, 19).replace("T", " ") || "—"}</span>
                </div>
                <p className="mt-2 text-sm text-base-content/80">{message.message || "—"}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}