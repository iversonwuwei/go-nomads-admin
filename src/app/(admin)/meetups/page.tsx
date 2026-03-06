import AdminTable from "@/app/components/admin/admin-table";
import { fetchMeetups } from "@/app/lib/admin-api";
import Link from "next/link";

type MeetupsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MeetupsPage({ searchParams }: MeetupsPageProps) {
  const params = (await searchParams) ?? {};
  const cityId = asSingle(params.cityId).trim();
  const category = asSingle(params.category).trim();
  const status = asSingle(params.status).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const listRes = await fetchMeetups({ cityId, category, status, page, pageSize });
  const payload = listRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Meetup 列表</h1>
        <p className="mt-2 text-sm text-base-content/70">活动（Event/Meetup）列表与详情入口。</p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm md:grid-cols-6">
        <label className="form-control md:col-span-2">
          <span className="label-text text-xs">城市 ID</span>
          <input name="cityId" defaultValue={cityId} className="input input-bordered input-sm" placeholder="city id" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">分类</span>
          <input name="category" defaultValue={category} className="input input-bordered input-sm" placeholder="tech" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">状态</span>
          <input name="status" defaultValue={status} className="input input-bordered input-sm" placeholder="upcoming" />
        </label>
        <label className="form-control md:col-span-1">
          <span className="label-text text-xs">每页</span>
          <select name="pageSize" defaultValue={String(pageSize)} className="select select-bordered select-sm">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="flex items-end gap-2 md:col-span-1">
          <button type="submit" className="btn btn-primary btn-sm">查询</button>
          <Link href="/meetups" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <AdminTable headers={["活动", "城市", "分类/状态", "组织者", "时间", "操作"]} hasRows={rows.length > 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.title || "-"}</p>
              <p className="text-xs font-mono text-base-content/60">{row.id}</p>
            </td>
            <td>{row.cityName || row.cityId || "-"}</td>
            <td>
              <p>{row.category || "-"}</p>
              <p className="text-xs text-base-content/60">{row.status || "-"}</p>
            </td>
            <td>{row.organizerName || row.organizerId || "-"}</td>
            <td>
              <p className="text-xs">开始: {row.startTime || "-"}</p>
              <p className="text-xs">结束: {row.endTime || "-"}</p>
            </td>
            <td><Link href={`/meetups/${encodeURIComponent(row.id)}`} className="btn btn-xs">查看详情</Link></td>
          </tr>
        ))}
      </AdminTable>

      <div className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/meetups?cityId=${encodeURIComponent(cityId)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/meetups?cityId=${encodeURIComponent(cityId)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&page=${nextPage}&pageSize=${pageSize}`}
          >
            下一页
          </Link>
        </div>
      </div>
    </section>
  );
}
