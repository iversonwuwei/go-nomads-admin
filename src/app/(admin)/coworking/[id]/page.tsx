import { fetchCityById, fetchCoworkingById, fetchUserById } from "@/app/lib/admin-api";
import Link from "next/link";

type CoworkingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoworkingDetailPage({ params }: CoworkingDetailPageProps) {
  const { id } = await params;
  const detailRes = await fetchCoworkingById(id);
  const row = detailRes.data;

  const [cityRes, ownerRes] = await Promise.all([
    row?.cityId ? fetchCityById(row.cityId) : Promise.resolve(null),
    row?.createdBy ? fetchUserById(row.createdBy) : Promise.resolve(null),
  ]);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Coworking 详情</h1>
            <p className="mt-2 text-sm text-base-content/70">展示空间详情及关联城市/创建人信息。</p>
          </div>
          <Link href="/coworking" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      {!detailRes.ok || !row ? (
        <div className="alert alert-warning"><span>详情读取失败: {detailRes.message}</span></div>
      ) : (
        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-base-content/60">ID:</span> <span className="font-mono">{row.id}</span></p>
            <p><span className="text-base-content/60">名称:</span> {row.name || "-"}</p>
            <p><span className="text-base-content/60">状态:</span> {row.status || "-"}</p>
            <p><span className="text-base-content/60">地址:</span> {row.address || "-"}</p>
            <p><span className="text-base-content/60">评分:</span> {row.rating ?? "-"}</p>
            <p><span className="text-base-content/60">日均价格:</span> {row.pricePerDay ?? "-"}</p>
            <p>
              <span className="text-base-content/60">城市:</span>{" "}
              {cityRes?.ok && cityRes.data ? (
                <Link className="link link-primary" href={`/cities/${encodeURIComponent(cityRes.data.id)}`}>
                  {cityRes.data.name || cityRes.data.id}
                </Link>
              ) : (
                row.cityName || row.cityId || "-"
              )}
            </p>
            <p>
              <span className="text-base-content/60">创建人:</span>{" "}
              {ownerRes?.ok && ownerRes.data ? `${ownerRes.data.name || "-"} (${ownerRes.data.email || ownerRes.data.id})` : row.createdBy || "-"}
            </p>
            <p><span className="text-base-content/60">创建时间:</span> {row.createdAt || "-"}</p>
            <p><span className="text-base-content/60">更新时间:</span> {row.updatedAt || "-"}</p>
          </div>
        </article>
      )}
    </section>
  );
}
