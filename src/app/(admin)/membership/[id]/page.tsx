import { fetchMembershipPlanById, fetchMembershipPlanSubscribers } from "@/app/lib/admin-api";
import { getDisplayName } from "@/app/lib/user-display";
import Link from "next/link";

type MembershipDetailPageProps = {
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

export default async function MembershipDetailPage({ params }: MembershipDetailPageProps) {
  const { id } = await params;
  const [detailRes, subscribersRes] = await Promise.all([
    fetchMembershipPlanById(id),
    fetchMembershipPlanSubscribers(id),
  ]);
  const plan = detailRes.data;
  const subscribers = subscribersRes.data ?? [];

  if (!detailRes.ok || !plan) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-base-content/50">
        <p>会员计划读取失败: {detailRes.message}</p>
        <Link href="/membership" className="btn btn-sm btn-primary">返回列表</Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">会员计划详情</h1>
            <p className="mt-2 text-sm text-base-content/70">单计划的价格、周期和权益摘要。</p>
          </div>
          <Link href="/membership" className="btn btn-outline btn-sm">返回列表</Link>
        </div>
      </header>

      <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <Row label="计划 ID" value={plan.id} />
        <Row label="Level" value={plan.level} />
        <Row label="名称" value={plan.name} />
        <Row label="状态" value={plan.status === "active" ? "启用" : "停用"} />
        <Row label="币种" value={plan.currency} />
        <Row label="月付价格" value={plan.priceMonthly != null ? `${plan.currency || "¥"} ${plan.priceMonthly}` : undefined} />
        <Row label="年付价格" value={plan.priceYearly != null ? `${plan.currency || "¥"} ${plan.priceYearly}` : undefined} />
        <Row label="默认摘要价格" value={plan.price != null ? `${plan.currency || "¥"} ${plan.price}` : undefined} />
        <Row label="展示周期" value={plan.duration === "yearly" ? "年付" : plan.duration === "monthly" ? "月付" : plan.duration} />
        <Row label="订阅人数" value={plan.subscriberCount} />
        <Row label="AI 配额" value={plan.aiUsageLimit} />
        <Row label="允许 AI" value={plan.canUseAI ? "是" : "否"} />
        <Row label="可申请版主" value={plan.canApplyModerator ? "是" : "否"} />
        <Row label="版主保证金" value={plan.moderatorDeposit != null ? `${plan.currency || "¥"} ${plan.moderatorDeposit}` : undefined} />
        <Row label="排序" value={plan.sortOrder} />
        <Row label="创建时间" value={plan.createdAt} />
        <Row label="更新时间" value={plan.updatedAt} />
        {plan.description ? (
          <div className="mt-4 rounded-xl bg-base-200/40 p-4 text-sm text-base-content/75">{plan.description}</div>
        ) : null}
        {plan.features && plan.features.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.features.map((feature) => (
              <span key={feature} className="badge badge-outline badge-sm">{feature}</span>
            ))}
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">订阅者明细</h2>
            <p className="mt-1 text-sm text-base-content/60">把计划和真实订阅用户打通，避免 detail 页只剩套餐静态信息。</p>
          </div>
          <span className="badge badge-outline">{subscribers.length} 人</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-base-300/60 p-8 text-center text-sm text-base-content/45">暂无订阅者</div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-base-300/50">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>邮箱</th>
                  <th>开始时间</th>
                  <th>到期时间</th>
                  <th>自动续费</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={`${subscriber.userId}-${subscriber.email || "unknown"}`}>
                    <td>
                      <Link href={`/users/${subscriber.userId}`} className="text-primary hover:underline">
                        {getDisplayName(subscriber.userName)}
                      </Link>
                    </td>
                    <td>{subscriber.email || "—"}</td>
                    <td>{subscriber.startDate?.slice(0, 10) || "—"}</td>
                    <td>{subscriber.expiryDate?.slice(0, 10) || "—"}</td>
                    <td>{subscriber.autoRenew ? "是" : "否"}</td>
                    <td>{subscriber.isActive ? `有效 (${subscriber.remainingDays ?? 0} 天)` : "已失效"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}