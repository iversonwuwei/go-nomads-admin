import AdminTable from "@/app/components/admin/admin-table";
import { fetchCoworkings } from "@/app/lib/admin-api";
import Link from "next/link";

type CoworkingPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CoworkingPage({ searchParams }: CoworkingPageProps) {
  const params = (await searchParams) ?? {};
  const cityId = asSingle(params.cityId).trim();
  const page = Number(asSingle(params.page) || "1") || 1;
  const pageSize = Number(asSingle(params.pageSize) || "10") || 10;

  const listRes = await fetchCoworkings({ cityId, page, pageSize });
  const payload = listRes.data;
  const rows = payload?.items ?? [];
  const totalCount = payload?.totalCount ?? 0;
  const nextPage = (payload?.page ?? page) + 1;
  const prevPage = Math.max(1, (payload?.page ?? page) - 1);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Coworking 列表</h1>
        <p className="mt-2 text-sm text-base-content/70">查看共享办公资源并进入详情页查看完整信息。</p>
      </header>

      <form className="grid gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4 shadow-sm md:grid-cols-5">
        <label className="form-control md:col-span-3">
          <span className="label-text text-xs">城市 ID (可选)</span>
          <input name="cityId" defaultValue={cityId} className="input input-bordered input-sm" placeholder="filter by city id" />
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
          <Link href="/coworking" className="btn btn-outline btn-sm">重置</Link>
        </div>
      </form>

      {!listRes.ok ? (
        <div className="alert alert-warning"><span>数据读取失败: {listRes.message}</span></div>
      ) : null}

      <AdminTable headers={["名称", "城市", "地址", "评分/价格", "状态", "操作"]} hasRows={rows.length > 0}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <p className="font-semibold">{row.name || "-"}</p>
              <p className="text-xs font-mono text-base-content/60">{row.id}</p>
            </td>
            <td>{row.cityName || row.cityId || "-"}</td>
            <td>{row.address || "-"}</td>
            <td>
              <div className="text-xs">
                <p>评分: {row.rating ?? "-"}</p>
                <p>日均: {row.pricePerDay ?? "-"}</p>
              </div>
            </td>
            <td>{row.status || "-"}</td>
            <td><Link href={`/coworking/${encodeURIComponent(row.id)}`} className="btn btn-xs">查看详情</Link></td>
          </tr>
        ))}
      </AdminTable>

      <div className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3 text-sm">
        <span>总数: {totalCount}</span>
        <div className="join">
          <Link
            className={`join-item btn btn-sm ${page <= 1 ? "btn-disabled" : ""}`}
            href={`/coworking?cityId=${encodeURIComponent(cityId)}&page=${prevPage}&pageSize=${pageSize}`}
          >
            上一页
          </Link>
          <button type="button" className="join-item btn btn-sm btn-disabled">第 {page} 页</button>
          <Link
            className={`join-item btn btn-sm ${rows.length < pageSize ? "btn-disabled" : ""}`}
            href={`/coworking?cityId=${encodeURIComponent(cityId)}&page=${nextPage}&pageSize=${pageSize}`}
          >
            下一页
          </Link>
        </div>
      </div>
    </section>
  );
}
