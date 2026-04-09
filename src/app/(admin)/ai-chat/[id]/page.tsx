"use client";

import { UserIdentityInfoRow, UserIdentityLink } from "@/app/components/admin/user-identity-link";
import { type AiSessionDetailDto, deleteAiSession, fetchAiSessionById } from "@/app/lib/admin-api";
import { ChevronRightIcon, HomeIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
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

export default function AiChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<AiSessionDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchAiSessionById(id).then((res) => {
      if (!active) return;
      if (res.ok && res.data) setDetail(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!detail || deleting || !confirm("确定删除此 AI 会话？")) return;
    setDeleting(true);
    await deleteAiSession(detail.id);
    router.push("/ai-chat");
    router.refresh();
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><span className="loading loading-spinner loading-md" /></div>;
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-base-content/50">
        <p>AI 会话不存在</p>
        <Link href="/ai-chat" className="btn btn-sm btn-primary">返回列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-base-content/50">
        <Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
        <ChevronRightIcon className="h-3 w-3" />
        <Link href="/ai-chat" className="hover:text-primary">AI 对话</Link>
        <ChevronRightIcon className="h-3 w-3" />
        <span className="text-base-content">{detail.title || detail.id}</span>
      </div>

      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <SparklesIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{detail.title || "未命名 AI 会话"}</h1>
              <p className="mt-1 text-sm text-base-content/60">
                <UserIdentityLink userId={detail.userId} userName={detail.userName} />
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-error btn-sm" disabled={deleting} onClick={handleDelete}>
            <TrashIcon className="h-4 w-4" /> 删除会话
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">会话信息</h2>
        <div className="mt-4 max-w-2xl">
          <InfoRow label="会话 ID" value={detail.id} />
          <UserIdentityInfoRow label="用户" userId={detail.userId} userName={detail.userName} />
          <InfoRow label="状态" value={detail.status} />
          <InfoRow label="模型" value={detail.model} />
          <InfoRow label="Token" value={detail.tokenUsage} />
          <InfoRow label="最近消息时间" value={detail.lastMessageAt} />
          <InfoRow label="创建时间" value={detail.createdAt} />
          <InfoRow label="更新时间" value={detail.updatedAt} />
        </div>
      </section>

      <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">消息历史</h2>
        <div className="mt-4 space-y-3">
          {(detail.messages ?? []).length === 0 ? (
            <p className="text-sm text-base-content/40">暂无消息</p>
          ) : (
            detail.messages?.map((message) => (
              <div key={message.id} className="rounded-xl border border-base-300/50 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-base-content/50">
                  <span className="badge badge-outline badge-sm">{message.role || "unknown"}</span>
                  <span>{message.createdAt?.slice(0, 19).replace("T", " ") || "—"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-base-content/80">{message.content || "—"}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-base-content/50">
                  <span>模型: {message.modelName || "—"}</span>
                  <span>Token: {message.totalTokens ?? message.tokenCount ?? "—"}</span>
                  {message.isError ? <span className="text-error">错误: {message.errorMessage || "未知异常"}</span> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}