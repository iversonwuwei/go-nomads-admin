import AdminTable from "@/app/components/admin/admin-table";
import { fetchCities } from "@/app/lib/admin-api";
import Link from "next/link";

type CitiesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CitiesPage({ searchParams }: CitiesPageProps) {
  const params = (await searchParams) ?? {};
  const search = asSingle(params.search).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const citiesRes = await fetchCities({ search, page, pageSize });
  const payload = citiesRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h1 className="text-2xl font-bold">城市列表 / Cities</h1>
        <p className="mt-2 text-sm text-base-content/70">
          浏览城市资源并进入详情页查看完整信息，不再只看冷冰冰的 ID。
        </p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm md:grid-cols-5">
        <label className="form-control md:col-span-3">
          <span className="label-text text-xs">搜索 (城市名/国家)</span>
          <input name="search" defaultValue={search} className="input input-bordered input-sm" placeholder="e.g. Beijing" />
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
          <Link href="/cities" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>

      {!citiesRes.ok ? (
        <div className="alert alert-warning">
          <span>城市数据读取失败: {citiesRes.message}</span>
        </div>
      ) : null}

      <AdminTable
        headers={["城市", "国家/地区", "时区", "平均成本", "关联资源", "操作"]}
        hasRows={rows.length > 0}
        emptyMessage="暂无城市数据 / No city data"
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.name || "-"}</p>
              <p className="text-xs text-base-content/60 font-mono">{row.id}</p>
            </td>
            <td>{row.country || row.region || "-"}</td>
            <td>{row.timezone || "-"}</td>
            <td>{row.averageCost ?? "-"}</td>
            <td>
              <div className="text-xs">
                <p>Meetup: {row.meetupCount ?? "-"}</p>
                <p>Coworking: {row.coworkingCount ?? "-"}</p>
              </div>
            </td>
            <td>
              <Link href={`/cities/${encodeURIComponent(row.id)}`} className="btn btn-xs">
                查看详情
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>

      <div className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/cities?search=${encodeURIComponent(search)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/cities?search=${encodeURIComponent(search)}&page=${nextPage}&pageSize=${pageSize}`}
          >
            下一页
          </Link>
        </div>
      </div>
    </section>
  );
}
