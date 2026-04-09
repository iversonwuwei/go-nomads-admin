import { fetchStaticTextById } from "@/app/lib/admin-api";
import Link from "next/link";

type StaticTextDetailPageProps = {
  params: Promise<{ id: string }>;
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-base-300/40 py-3 text-sm">
      <span className="text-base-content/60">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function StaticTextDetailPage({ params }: StaticTextDetailPageProps) {
  const { id } = await params;
  const detailRes = await fetchStaticTextById(id);
  const item = detailRes.data;

  if (!detailRes.ok || !item) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-base-content/50">
        <p>静态文本读取失败: {detailRes.message}</p>
        <Link href="/app-control/static-texts" className="btn btn-sm btn-primary">返回列表</Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Static Text Detail</p>
            <h1 className="mt-2 text-2xl font-bold">{item.textKey || "静态文本"}</h1>
            <p className="mt-2 text-sm text-base-content/70">查看文案键、语言、分类和当前正文，方便在治理页确认影响面。</p>
          </div>
          <Link href="/app-control/static-texts" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      <article className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <Row label="记录 ID" value={item.id} />
          <Row label="文案 Key" value={item.textKey} />
          <Row label="语言" value={item.locale} />
          <Row label="分类" value={item.category} />
          <Row label="版本" value={item.version} />
          <Row label="状态" value={item.isActive === false ? "禁用" : "启用"} />
          <Row label="最后更新时间" value={item.updatedAt} />
          <Row label="最近修改人" value={item.updatedBy} />
        </section>

        <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">文案正文</p>
              <div className="mt-3 rounded-2xl border border-base-300/50 bg-base-200/30 p-4 text-sm leading-6 text-base-content/85 whitespace-pre-wrap">
                {item.textValue || "—"}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">影响说明</p>
              <div className="mt-3 rounded-2xl border border-dashed border-base-300/60 bg-base-100 p-4 text-sm text-base-content/65">
                {item.description || "当前未填写描述，建议补充该文案在 App 中的使用位置与回退策略。"}
              </div>
            </div>
          </div>
        </section>
      </article>
    </section>
  );
}