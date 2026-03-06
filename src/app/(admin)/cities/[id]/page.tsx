import { fetchCityById } from "@/app/lib/admin-api";
import Link from "next/link";

type CityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CityDetailPage({ params }: CityDetailPageProps) {
  const { id } = await params;
  const detailRes = await fetchCityById(id);
  const city = detailRes.data;

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">城市详情 / City Detail</h1>
            <p className="mt-2 text-sm text-base-content/70">查看城市全量信息与关联资源统计。</p>
          </div>
          <Link href="/cities" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      {!detailRes.ok || !city ? (
        <div className="alert alert-warning">
          <span>城市详情读取失败: {detailRes.message}</span>
        </div>
      ) : (
        <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-base-content/60">ID:</span> <span className="font-mono">{city.id}</span></p>
            <p><span className="text-base-content/60">城市名:</span> {city.name || "-"}</p>
            <p><span className="text-base-content/60">国家/地区:</span> {city.country || city.region || "-"}</p>
            <p><span className="text-base-content/60">时区:</span> {city.timezone || "-"}</p>
            <p><span className="text-base-content/60">平均成本:</span> {city.averageCost ?? "-"}</p>
            <p><span className="text-base-content/60">Meetup 数:</span> {city.meetupCount ?? "-"}</p>
            <p><span className="text-base-content/60">Coworking 数:</span> {city.coworkingCount ?? "-"}</p>
            <p><span className="text-base-content/60">创建时间:</span> {city.createdAt || "-"}</p>
            <p><span className="text-base-content/60">更新时间:</span> {city.updatedAt || "-"}</p>
          </div>
        </article>
      )}
    </section>
  );
}
