import {
  type DashboardIconName,
  KpiCard,
  UsersChart,
} from "@/app/(admin)/dashboard/components/DashboardClientComponents";
import {
  fetchCommunityPosts,
  fetchDashboardOverview,
  fetchMembershipPlans,
  fetchNotifications,
} from "@/app/lib/admin-api";
import { Grid, Text, Title } from "@tremor/react";
import Link from "next/link";

type DashboardKpiItem = {
  title: string;
  value: string;
  icon: DashboardIconName;
  metric: string;
  metricPrev: string;
};

export default async function DashboardPage() {
  const [overview, notifications, memberships, community] = await Promise.all([
    fetchDashboardOverview(),
    fetchNotifications({ page: 1, pageSize: 5 }),
    fetchMembershipPlans(),
    fetchCommunityPosts({ page: 1, pageSize: 5 }),
  ]);
  const data = overview.data;
  const users = data?.users;
  const entities = data?.entities;
  const notificationTotal = notifications.data?.totalCount ?? 0;
  const membershipTotal = memberships.data?.length ?? 0;
  const communityTotal = community.data?.totalCount ?? 0;

  const kpiData: DashboardKpiItem[] = [
    {
      title: "用户总数",
      value: String(users?.totalUsers ?? 0),
      icon: "users",
      metric: String(users?.totalUsers ?? 0),
      metricPrev: String((users?.totalUsers ?? 0) * 0.95), // Mock previous data
    },
    {
      title: "新增用户 (30d)",
      value: String(users?.newUsers ?? 0),
      icon: "userPlus",
      metric: String(users?.newUsers ?? 0),
      metricPrev: String((users?.newUsers ?? 0) * 1.1), // Mock previous data
    },
    {
      title: "城市总数",
      value: String(entities?.cities ?? 0),
      icon: "mapPin",
      metric: String(entities?.cities ?? 0),
      metricPrev: String((entities?.cities ?? 0) - 1), // Mock previous data
    },
    {
      title: "Coworking 总数",
      value: String(entities?.coworkings ?? 0),
      icon: "buildingOffice",
      metric: String(entities?.coworkings ?? 0),
      metricPrev: String((entities?.coworkings ?? 0) - 5), // Mock previous data
    },
    {
      title: "Meetup 总数",
      value: String(entities?.meetups ?? 0),
      icon: "calendarDays",
      metric: String(entities?.meetups ?? 0),
      metricPrev: String((entities?.meetups ?? 0) - 2), // Mock previous data
    },
    {
      title: "Innovation 总数",
      value: String(entities?.innovations ?? 0),
      icon: "lightBulb",
      metric: String(entities?.innovations ?? 0),
      metricPrev: String((entities?.innovations ?? 0) - 1), // Mock previous data
    },
  ];

  return (
    <main className="mx-auto w-full p-4 md:p-8 xl:p-10">
      <div className="control-hero p-6 md:p-8">
        <div className="dashboard-hero-grid">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Control Plane Overview</p>
              <Title>让 Admin 真正服务 App 生命周期</Title>
              <Text className="max-w-3xl leading-7">
                专业的后台不该只是罗列模块。它应该先告诉运营、产品和研发，哪些动作会改变 App 的数据供给、社区安全、增长节奏和用户体验。
              </Text>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge badge-outline">用户与准入 {users?.totalUsers ?? 0}</span>
              <span className="badge badge-outline">内容供给 {entities?.cities ?? 0} 城市</span>
              <span className="badge badge-outline">社区治理 {communityTotal} 帖子</span>
              <span className="badge badge-outline">增长触达 {notificationTotal} 通知</span>
              <span className="badge badge-outline">会员计划 {membershipTotal}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/app-control" className="btn btn-primary rounded-2xl px-5">进入 App 控制台</Link>
              <Link href="/operations" className="btn btn-outline rounded-2xl px-5">查看全部运营入口</Link>
            </div>
          </div>

          <div className="admin-panel rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">Mission Board</p>
            <div className="mt-4 space-y-3">
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">今日主任务</span>
                  <span className="font-semibold">App 内容与触达</span>
                </div>
              </div>
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">优先关注</span>
                  <span className="font-semibold">通知、社区、会员</span>
                </div>
              </div>
              <div className="control-mini-stat">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">数据节奏</span>
                  <span className="font-semibold">增长 / 供给 / 风险</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="control-area mt-6">
        <div className="control-area-header">
          <p className="control-area-label">Area 01</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">运营阶段导航区</h2>
              <p className="control-area-muted">先告诉用户现在看的是哪一段业务链路，再进入对应模块，避免首页的数据和入口混在一起。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>这是任务入口区，不是数据明细区</strong>
            </div>
            <div className="control-focus-item">
              <span>Purpose</span>
              <strong>按生命周期切分用户、内容、治理、增长</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/users" className="control-stage-card p-5 transition hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Stage 01</p>
              <h2 className="mt-2 font-semibold">准入与激活</h2>
              <p className="mt-2 text-sm text-base-content/65">围绕用户、法律文档、通知触达，保证用户能正常进入 App。</p>
            </Link>
            <Link href="/cities" className="control-stage-card p-5 transition hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Stage 02</p>
              <h2 className="mt-2 font-semibold">内容供给</h2>
              <p className="mt-2 text-sm text-base-content/65">围绕城市、联合办公、活动、创新项目，控制 App 首页和详情页的内容质量。</p>
            </Link>
            <Link href="/moderation/reports" className="control-stage-card p-5 transition hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Stage 03</p>
              <h2 className="mt-2 font-semibold">社区与安全</h2>
              <p className="mt-2 text-sm text-base-content/65">围绕举报、评论、图片和社区内容，保证 App 的互动体验不会被破坏。</p>
            </Link>
            <Link href="/membership" className="control-stage-card p-5 transition hover:-translate-y-0.5">
              <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">Stage 04</p>
              <h2 className="mt-2 font-semibold">增长与留存</h2>
              <p className="mt-2 text-sm text-base-content/65">围绕通知、会员、AI 与旅行计划，支撑召回、转化和长期留存。</p>
            </Link>
          </div>
        </div>
      </section>

      {!overview.ok ? (
        <div className="mt-6 alert alert-warning">
          <span>数据总览获取异常: {overview.message}</span>
        </div>
      ) : null}

      <section className="control-area mt-6">
        <div className="control-area-header">
          <p className="control-area-label">Area 02</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">核心指标观察区</h2>
              <p className="control-area-muted">这里只放总览 KPI，用户可以明确知道这里是在看跨模块的整体运行信号，不是具体业务列表。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>总量、变化、趋势</strong>
            </div>
            <div className="control-focus-item">
              <span>Boundary</span>
              <strong>不展示具体记录，只展示聚合信号</strong>
            </div>
          </div>

          <Grid numItemsMd={2} numItemsLg={3} className="control-area-kpi-grid mt-5 gap-6">
            {kpiData.map((item) => (
              <KpiCard key={item.title} {...item} />
            ))}
          </Grid>
        </div>
      </section>

      <section className="control-area mt-6">
        <div className="control-area-header">
          <p className="control-area-label">Area 03</p>
          <div className="control-area-title-row">
            <div>
              <h2 className="control-area-title">趋势分析区</h2>
              <p className="control-area-muted">将趋势图单独隔离出来，和 KPI 数字区分开，帮助用户把“当前状态”和“变化轨迹”分开理解。</p>
            </div>
          </div>
        </div>
        <div className="control-area-body">
          <Grid numItemsMd={1} numItemsLg={1} className="gap-6">
            <UsersChart />
          </Grid>
        </div>
      </section>
    </main>
  );
}
