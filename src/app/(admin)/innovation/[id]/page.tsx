import { fetchInnovationById, fetchUserById } from "@/app/lib/admin-api";
import Link from "next/link";

type InnovationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InnovationDetailPage({ params }: InnovationDetailPageProps) {
  const { id } = await params;
  const detailRes = await fetchInnovationById(id);
  const row = detailRes.data;

  const creatorRes = row?.creatorId ? await fetchUserById(row.creatorId) : null;

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Innovation 详情</h1>
            <p className="mt-2 text-sm text-base-content/70">查看创新项目详情与创建者关联信息。</p>
          </div>
          <Link href="/innovation" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      {!detailRes.ok || !row ? (
        <div className="alert alert-warning"><span>详情读取失败: {detailRes.message}</span></div>
      ) : (
        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-base-content/60">ID:</span> <span className="font-mono">{row.id}</span></p>
            <p><span className="text-base-content/60">标题:</span> {row.title || "-"}</p>
            <p><span className="text-base-content/60">分类:</span> {row.category || "-"}</p>
            <p><span className="text-base-content/60">阶段:</span> {row.stage || "-"}</p>
            <p><span className="text-base-content/60">浏览:</span> {row.viewCount ?? "-"}</p>
            <p><span className="text-base-content/60">点赞:</span> {row.likeCount ?? "-"}</p>
            <p>
              <span className="text-base-content/60">创建者:</span>{" "}
              {creatorRes?.ok && creatorRes.data
                ? `${creatorRes.data.name || "-"} (${creatorRes.data.email || creatorRes.data.id})`
                : row.creatorName || row.creatorId || "-"}
            </p>
            <p><span className="text-base-content/60">创建时间:</span> {row.createdAt || "-"}</p>
            <p><span className="text-base-content/60">更新时间:</span> {row.updatedAt || "-"}</p>
          </div>
        </article>
      )}
    </section>
  );
}
