"use client";

import {
    AdminDetailCard,
    AdminDetailGrid,
    AdminWorkspace,
    AdminWorkspaceBreadcrumb,
    AdminWorkspaceHero,
    AdminWorkspaceSection,
} from "@/app/components/admin/system-workspace";
import {
    UserIdentityInfoRow,
} from "@/app/components/admin/user-identity-link";
import {
    type CommunityPostDetailDto,
    deleteCommunityPost,
    fetchCommunityPostById,
    updateCommunityPostStatus,
} from "@/app/lib/admin-api";
import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<CommunityPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchCommunityPostById(id).then((res) => {
      if (!active) return;
      if (res.ok && res.data) setDetail(res.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleStatus(nextStatus: "active" | "hidden") {
    if (!detail || saving) return;
    setSaving(true);
    const res = await updateCommunityPostStatus(detail.id, nextStatus);
    if (res.ok && res.data) setDetail(res.data);
    setSaving(false);
  }

  async function handleDelete() {
    if (!detail || saving || !confirm("确定删除此社区内容？")) return;
    setSaving(true);
    await deleteCommunityPost(detail.id);
    router.push("/community");
    router.refresh();
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><span className="loading loading-spinner loading-md" /></div>;
  }

  if (!detail) {
    return (
      <AdminWorkspace>
        <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "社区内容", href: "/community" }, { label: "内容不存在" }]} />
        <AdminWorkspaceHero
          eyebrow="Community Integrity"
          title="社区内容不存在"
          description="当前帖子或评论记录已经不可用，请返回社区列表重新确认筛选条件或数据状态。"
          actions={<Link href="/community" className="btn btn-primary rounded-2xl">返回列表</Link>}
        />
      </AdminWorkspace>
    );
  }

  const nextStatus = detail.status === "hidden" ? "active" : "hidden";
  const statusLabel = detail.status === "hidden" ? "已隐藏" : "正常显示";

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "社区内容", href: "/community" }, { label: detail.title || detail.id }]} />
      <AdminWorkspaceHero
        eyebrow="Community Moderation"
        title={detail.title || "社区内容详情"}
        description="详情页负责解释正文上下文、作者归属和治理信号，列表页只承担结果浏览与入口。"
        actions={
          <>
            <Link href="/community" className="btn btn-outline rounded-2xl">返回列表</Link>
            <button type="button" className="btn btn-outline rounded-2xl" disabled={saving} onClick={() => handleStatus(nextStatus)}>
              {detail.status === "hidden" ? "恢复显示" : "隐藏内容"}
            </button>
            <button type="button" className="btn btn-outline btn-error rounded-2xl" disabled={saving} onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" /> 删除
            </button>
          </>
        }
        stats={[
          { label: "Status", value: statusLabel, hint: "当前治理状态" },
          { label: "Likes / Comments", value: `${detail.likeCount ?? 0} / ${detail.commentCount ?? 0}`, hint: "互动信号" },
          { label: "Author", value: detail.authorName || "未命名作者", hint: "内容归属" },
        ]}
      />

      <AdminWorkspaceSection
        title="正文与治理信息"
        description="把正文内容和治理元数据拆成两个稳定的信息块，降低运营在长文与结构化字段之间切换的认知成本。"
      >
        <AdminDetailGrid variant="split">
          <AdminDetailCard title="正文" description="原始内容按阅读优先级展示，便于快速判断违规、质量或上下文问题。">
            <div className="rounded-2xl bg-base-200/60 p-4 text-sm leading-7 text-base-content/80">
              {detail.content || "—"}
            </div>
          </AdminDetailCard>

          <AdminDetailCard title="治理信息" description="保留作者、城市、时间和状态等字段，支持快速做审核或删除决策。">
            <div>
              <InfoRow label="内容 ID" value={detail.id} />
              <UserIdentityInfoRow label="作者" userId={detail.authorId} userName={detail.authorName} fallback="未命名作者" />
              <InfoRow label="城市" value={detail.cityName || "—"} />
              <InfoRow label="状态" value={statusLabel} />
              <InfoRow label="点赞数" value={detail.likeCount} />
              <InfoRow label="评论数" value={detail.commentCount} />
              <InfoRow label="创建时间" value={detail.createdAt} />
              <InfoRow label="更新时间" value={detail.updatedAt} />
              <InfoRow label="采纳回答" value={detail.acceptedAnswerSummary || "未采纳"} />
            </div>
            {detail.tags && detail.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span key={tag} className="badge badge-outline badge-sm">{tag}</span>
                ))}
              </div>
            ) : null}
          </AdminDetailCard>
        </AdminDetailGrid>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}