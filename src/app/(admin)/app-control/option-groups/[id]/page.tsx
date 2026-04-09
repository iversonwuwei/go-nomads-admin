import { fetchOptionGroupById, fetchOptionItems } from "@/app/lib/admin-api";
import Link from "next/link";

type OptionGroupDetailPageProps = {
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

export default async function OptionGroupDetailPage({ params }: OptionGroupDetailPageProps) {
  const { id } = await params;
  const [groupRes, itemsRes] = await Promise.all([fetchOptionGroupById(id), fetchOptionItems(id)]);
  const group = groupRes.data;
  const items = itemsRes.data ?? [];

  if (!groupRes.ok || !group) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-base-content/50">
        <p>选项组读取失败: {groupRes.message}</p>
        <Link href="/app-control/option-groups" className="btn btn-sm btn-primary">返回列表</Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Option Group Detail</p>
            <h1 className="mt-2 text-2xl font-bold">{group.groupName || "选项组详情"}</h1>
            <p className="mt-2 text-sm text-base-content/70">聚合展示组选项、状态和子项，方便联调 App 可配置项。</p>
          </div>
          <Link href="/app-control/option-groups" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <Row label="分组 ID" value={group.id} />
          <Row label="Group Code" value={group.groupCode} />
          <Row label="中文名称" value={group.groupName} />
          <Row label="英文名称" value={group.groupNameEn} />
          <Row label="是否系统分组" value={group.isSystem ? "是" : "否"} />
          <Row label="当前状态" value={group.isActive === false ? "禁用" : "启用"} />
          <Row label="选项数量" value={group.itemCount ?? items.length} />
          <Row label="最后更新时间" value={group.updatedAt} />
          <div className="pt-4 text-sm text-base-content/65">{group.description || "当前未填写分组说明，建议补充该组选项在 App 中的适用场景。"}</div>
        </section>

        <section className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">组选项明细</p>
              <h2 className="mt-2 text-lg font-semibold">当前共 {items.length} 项</h2>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300/60 p-8 text-center text-sm text-base-content/45">暂无选项数据</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-base-300/50">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-base-content/50">
                    <th>排序</th>
                    <th>Code</th>
                    <th>中文值</th>
                    <th>英文值</th>
                    <th>图标 / 颜色</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.sortOrder ?? 0}</td>
                      <td className="font-mono text-xs">{item.optionCode || "—"}</td>
                      <td>{item.optionValue || "—"}</td>
                      <td className="text-base-content/60">{item.optionValueEn || "—"}</td>
                      <td>
                        <div className="flex items-center gap-2 text-xs text-base-content/70">
                          <span>{item.icon || "—"}</span>
                          {item.color ? <span className="inline-flex h-3 w-3 rounded-full border" style={{ backgroundColor: item.color }} /> : null}
                          <span>{item.color || "—"}</span>
                        </div>
                      </td>
                      <td>{item.isActive === false ? "禁用" : "启用"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}