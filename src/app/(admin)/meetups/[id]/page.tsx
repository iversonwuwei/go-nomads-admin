import { fetchCityById, fetchMeetupById, fetchUserById } from "@/app/lib/admin-api";
import Link from "next/link";

type MeetupDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetupDetailPage({ params }: MeetupDetailPageProps) {
  const { id } = await params;
  const detailRes = await fetchMeetupById(id);
  const row = detailRes.data;

  const [cityRes, organizerRes] = await Promise.all([
    row?.cityId ? fetchCityById(row.cityId) : Promise.resolve(null),
    row?.organizerId ? fetchUserById(row.organizerId) : Promise.resolve(null),
  ]);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Meetup 详情</h1>
            <p className="mt-2 text-sm text-base-content/70">查看活动详情以及组织者/城市关联信息。</p>
          </div>
          <Link href="/meetups" className="btn btn-outline btn-sm">返回列表</Link>
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
            <p><span className="text-base-content/60">状态:</span> {row.status || "-"}</p>
            <p><span className="text-base-content/60">开始时间:</span> {row.startTime || "-"}</p>
            <p><span className="text-base-content/60">结束时间:</span> {row.endTime || "-"}</p>
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
              <span className="text-base-content/60">组织者:</span>{" "}
              {organizerRes?.ok && organizerRes.data
                ? `${organizerRes.data.name || "-"} (${organizerRes.data.email || organizerRes.data.id})`
                : row.organizerName || row.organizerId || "-"}
            </p>
            <p><span className="text-base-content/60">参与人数:</span> {row.participantCount ?? "-"}</p>
            <p><span className="text-base-content/60">更新时间:</span> {row.updatedAt || row.createdAt || "-"}</p>
          </div>
        </article>
      )}
    </section>
  );
}
