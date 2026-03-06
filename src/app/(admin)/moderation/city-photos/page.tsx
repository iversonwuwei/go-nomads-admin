import CityPhotoTable from "@/app/components/admin/city-photo-table";
import { fetchCityPhotos } from "@/app/lib/admin-api";

type CityPhotosPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function asSingle(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CityPhotosPage({ searchParams }: CityPhotosPageProps) {
  const params = (await searchParams) ?? {};
  const cityId = asSingle(params.cityId).trim();
  const photosRes = cityId ? await fetchCityPhotos(cityId) : null;
  const photoRows = photosRes?.data ?? [];

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm">
        <h1 className="text-2xl font-bold">城市图片审核 / City Photo Workbench</h1>
        <p className="mt-2 text-sm text-base-content/70">
          面向 UGC 图片的审核台，支持批量通过/拒绝、相似图检索、引用关系追踪。
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-5">
        <form className="contents">
          <label className="form-control md:col-span-3">
            <span className="label-text text-xs">城市 ID (必填，用于调用 /cities/{'{cityId}'}/user-content/photos)</span>
            <input
              name="cityId"
              defaultValue={cityId}
              className="input input-bordered input-sm"
              placeholder="e.g. 3f11f802-..."
            />
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button type="submit" className="btn btn-primary btn-sm">加载图片</button>
            <a href="/moderation/city-photos" className="btn btn-outline btn-sm">重置</a>
          </div>
        </form>
      </div>

      {!cityId ? (
        <div className="alert alert-info">
          <span>请输入城市 ID 后加载图片数据。</span>
        </div>
      ) : null}

      {cityId && photosRes && !photosRes.ok ? (
        <div className="alert alert-warning">
          <span>图片数据读取失败: {photosRes.message}</span>
        </div>
      ) : null}

      <CityPhotoTable key={`photos-${cityId || "empty"}`} rows={photoRows} cityId={cityId} />
    </section>
  );
}
