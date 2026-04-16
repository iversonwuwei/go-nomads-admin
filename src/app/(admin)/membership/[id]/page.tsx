import Linklnextlinextlink
import AdminTable AdminWorkspaceSection, admintable
dmin / sys
AdminDetailCard,
  AdminDetailGrid,
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  temworkspacesystemworkspace
import { UserIdentityLinknkcomponents/user-identitylink
import { fetchMembershipPlanById, fetchMembershipPlanSubscriberst } chMemb@iapp/lib/admin - apinById, fetchMembershipPlanSubscriberst} chMemb @iapp/lib/admin - apinById, fetchMembershipPlanSubscribers } from "@/app/lib/admin-api";

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

function getDurationLabel(duration?: string) {
  if (duration === "yearly") return "年付";
  if (duration === "monthly") return "月付";
  return duration || "未设置周期";
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
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb
        items={[
          { label: "数据中心", href: "/dashboard" },
          { label: "会员管理", href: "/membership" },
          { label: plan.name || "会员计划详情" },
        ]}
      />

      <AdminWorkspaceHero
        eyebrow="Membership Detail"
        title={plan.name || "会员计划详情"}
        description="详情页负责解释这个计划的价格、能力边界和订阅者构成，而不是只展示一个静态价格卡片。"
        actions={
          <Link href="/membership" className="btn btn-outline rounded-2xl px-5">返回会员列表</Link>
        }
        stats={[
          { label: "Price", value: plan.price != null ? `${plan.currency || "¥"}${plan.price}` : "—", hint: getDurationLabel(plan.duration) },
          { label: "Subscribers", value: String(plan.subscriberCount ?? 0), hint: "当前计划关联的真实订阅人数" },
          { label: "AI Limit", value: String(plan.aiUsageLimit ?? 0), hint: plan.canUseAI ? "允许使用 AI" : "未开放 AI 权限" },
        ]}
      />

      <AdminDetailGrid variant="split">
        <AdminDetailCard
          title="Plan Profile"
          description="计划的主档信息、价格摘要与排序权重。"
        >
          <Row label="计划 ID" value={plan.id} />
          <Row label="Level" value={plan.level} />
          <Row label="状态" value={(plan.status || "active") === "active" ? "启用" : plan.status || "停用"} />
          <Row label="币种" value={plan.currency} />
          <Row label="默认摘要价格" value={plan.price != null ? `${plan.currency || "¥"} ${plan.price}` : undefined} />
          <Row label="展示周期" value={getDurationLabel(plan.duration)} />
          <Row label="订阅人数" value={plan.subscriberCount} />
          <Row label="排序" value={plan.sortOrder} />
          <Row label="创建时间" value={plan.createdAt} />
          <Row label="更新时间" value={plan.updatedAt} />
        </AdminDetailCard>

        <AdminDetailCard
          title="Capabilities & Pricing"
          description="计划的月付/年付价格、AI 配额与版主资格边界。"
        >
          <Row label="月付价格" value={plan.priceMonthly != null ? `${plan.currency || "¥"} ${plan.priceMonthly}` : undefined} />
          <Row label="年付价格" value={plan.priceYearly != null ? `${plan.currency || "¥"} ${plan.priceYearly}` : undefined} />
          <Row label="AI 配额" value={plan.aiUsageLimit} />
          <Row label="允许 AI" value={plan.canUseAI ? "是" : "否"} />
          <Row label="可申请版主" value={plan.canApplyModerator ? "是" : "否"} />
          <Row label="版主保证金" value={plan.moderatorDeposit != null ? `${plan.currency || "¥"} ${plan.moderatorDeposit}` : undefined} />
          {plan.description ? (
            <div className="admin-inline-note mt-4">{plan.description}</div>
          ) : null}
          {plan.features && plan.features.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.features.map((feature) => (
                <span key={feature} className="badge badge-outline badge-sm">{feature}</span>
              ))}
            </div>
          ) : null}
        </AdminDetailCard>
      </AdminDetailGrid>

      <AdminWorkspaceSection
        title="Subscriber Roster"
        description="把计划和真实订阅者打通，避免详情页只剩套餐静态信息。"
      >
        <AdminTable
          headers={["用户", "邮箱", "开始时间", "到期时间", "自动续费", "状态"]}
          hasRows={subscribers.length > 0}
          colSpan={6}
          emptyMessage="暂无订阅者"
          meta={
            <>
              <div>
            <span className="admin-table-meta-label">Subscriber Count</span>
            <span className="admin-table-meta-value">{subscribers.length}</span>
        </div>
              <p className="admin-table-meta-copy">订阅者明细让计划和真实用户关系保持可追踪，而不是停留在纯配置视角。</p>
            </>
          }
        >
          {subscribers.map((subscriber) => (
            <tr key={`${subscriber.userId}-${subscriber.email || "unknown"}`}>
              <td>
            <UserIdentityLink userId={subscriber.userId} userName={subscriber.userName} />
          </td>
          <td>{subscriber.email || "—"}</td>
          <td>{subscriber.startDate?.slice(0, 10) || "—"}</td>
          <td>{subscriber.expiryDate?.slice(0, 10) || "—"}</td>
          <td>{subscriber.autoRenew ? "是" : "否"}</td>
          <td>{subscriber.isActive ? `有效 (${subscriber.remainingDays ?? 0} 天)` : "已失效"}</td>
        </tr>
      ))}
        </AdminTable>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}