import Link UsersCnextalink
} from "@/app/(admin)/dashboard/componentspDashboardClientComponentsmin/system-workspace";
imtype DashboardIconName
  KpiCard,
  UsersChart,
  fetchTravelP(admin) / dashboard / componentssDashboardClientComponents
} from {
  fetchCommunityPosts,
  fetchDashboardOverview,
  fetchMembershipPlans,
  fetchNotifications,
    fetchTravelPlans,
} pp / lib{
  fetchCommunityPosts,
    fetchDashboardOverview,
    fetchMembershipPlans,
    fetchNotifications,
    fetchTravelPlans,
} pp / libn@/app/libnadmin-api";

type DashboardKpiItem = {
  title: string;
  value: string;
  icon: DashboardIconName;
  metric: string;
  metricPrev: string;
};

export default async function DashboardPage() {
  const [overview, notifications, memberships, community, travelPlans] = await Promise.all([
    fetchDashboardOverview(),
    fetchNotifications({ page: 1, pageSize: 5 }),
    fetchMembershipPlans(),
    fetchCommunityPosts({ page: 1, pageSize: 5 }),
    fetchTravelPlans({ page: 1, pageSize: 5 }),
  ]);
  const data = overview.data;
  const users = data?.users;
  const entities = data?.entities;
  const notificationTotal = notifications.data?.totalCount ?? 0;
  const membershipTotal = memberships.data?.length ?? 0;
  const communityTotal = community.data?.totalCount ?? 0;
  const travelPlanTotal = travelPlans.data?.totalCount ?? 0;

  const workflowCards = [
    {
      stage: "Stage 01",
      title: "用户准入与激活",
      description: "先看新增用户与通知触达，判断今天是拉新问题还是召回问题。",
      metric: `${users?.newUsers ?? 0} 新增用户`,
      href: "/users",
      secondaryHref: "/notifications",
      secondaryLabel: "触达策略",
    },
    {
      stage: "Stage 02",
      title: "内容供给与城市面",
      description: "关注城市、空间、活动与旅行计划，确保 App 首页和详情页有持续供给。",
      metric: `${entities?.cities ?? 0} 城市 / ${travelPlanTotal} 行程`,
      href: "/cities",
      secondaryHref: "/travel-plans",
      secondaryLabel: "旅行计划",
    },
    {
      stage: "Stage 03",
      title: "社区治理与风险判断",
      description: "把社区内容、举报与评论治理拉回到同一个风险语境里处理。",
      metric: `${communityTotal} 社区内容`,
      href: "/community",
      secondaryHref: "/moderation/reports",
      secondaryLabel: "举报中心",
    },
    {
      stage: "Stage 04",
      title: "增长与会员转化",
      description: "通知、会员和 AI 会话共同决定了召回、转化与留存效率。",
      metric: `${membershipTotal} 会员计划 / ${notificationTotal} 通知`,
      href: "/membership",
      secondaryHref: "/ai-chat",
      secondaryLabel: "AI 对话",
    },
  ];

  const queuePanels = [
    {
      title: "通知队列",
      eyebrow: "Reach",
      href: "/notifications",
      items: (notifications.data?.items ?? []).slice(0, 3).map((item) => ({
        title: item.title || item.type || "未命名通知",
        meta: item.scopeDisplay || item.recipientSummary || "范围未标注",
        status: item.status || "pending",
      })),
    },
    {
      title: "社区治理",
      eyebrow: "Moderation",
      href: "/community",
      items: (community.data?.items ?? []).slice(0, 3).map((item) => ({
        title: item.content || item.type || "未命名社区内容",
        meta: item.authorName || item.cityName || "来源未标注",
        status: item.status || "active",
      })),
    },
    {
      title: "旅行计划供给",
      eyebrow: "Supply",
      href: "/travel-plans",
      items: (travelPlans.data?.items ?? []).slice(0, 3).map((item) => ({
        title: item.destination || item.cityName || "未命名行程",
        meta: item.userName || item.travelStyle || "用户未标注",
        status: item.status || "planning",
      })),
    },
    {
      title: "会员策略",
      eyebrow: "Growth",
      href: "/membership",
      items: (memberships.data ?? []).slice(0, 3).map((item) => ({
        title: item.name || "未命名计划",
        meta: `${item.subscriberCount ?? 0} 订阅者 / ${item.duration || "周期待定"}`,
        status: item.status || "active",
      })),
    },
  ];

  const riskSignals = [
    {
      label: "社区内容",
      value: communityTotal,
      hint: "需要持续判断可见性与讨论质量",
    },
    {
      label: "通知触达",
      value: notificationTotal,
      hint: "高频触达会直接影响用户召回节奏",
    },
    {
      label: "AI / 计划供给",
      value: travelPlanTotal,
      hint: "反映内容生成与行程消费链路的活跃度",
    },
  ];

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
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb
        items={[
          { label: "Admin", href: "/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      <AdminWorkspaceHero
        eyebrow="Control Plane Overview"
        title="让 Admin 先告诉团队该处理什么，而不是只展示数据"
        description="首页现在围绕工作流、风险和活动队列组织。运营、审核和产品进入后台后，应先看到当前系统处于什么状态、哪个链路需要干预、接下来该进入哪个工作域。"
        actions={
          <>
            <Link href="/app-control" className="btn btn-primary rounded-2xl px-5">进入 App 控制台</Link>
            <Link href="/notifications" className="btn btn-outline rounded-2xl px-5">查看触达队列</Link>
          </>
        }
        stats={[
          {
            label: "用户与准入",
            value: String(users?.totalUsers ?? 0),
            hint: "当前注册用户总量",
          },
          {
            label: "内容供给",
            value: `${entities?.cities ?? 0} 城市`,
            hint: `${travelPlanTotal} 个旅行计划处于后台链路中`,
          },
          {
            label: "治理与触达",
            value: `${communityTotal} / ${notificationTotal}`,
            hint: "社区内容与通知队列共同定义当天风险和增长节奏",
          },
        ]}
      />

      {!overview.ok ? (
        <div className="alert alert-warning">
          <span>数据总览获取异常: {overview.message}</span>
        </div>
      ) : null}

      <AdminWorkspaceSection
        title="Workflow Stages"
        description="按用户生命周期与平台治理链路切分工作域，让首页先承担任务分诊，再进入具体列表页。"
      >
        <div className="dashboard-stage-grid">
          {workflowCards.map((card) => (
            <article key={card.title} className="dashboard-stage-shell">
              <div className="dashboard-stage-head">
                <span className="dashboard-stage-label">{card.stage}</span>
                <span className="dashboard-stage-metric">{card.metric}</span>
              </div>
              <h3 className="dashboard-stage-title">{card.title}</h3>
              <p className="dashboard-stage-description">{card.description}</p>
              <div className="dashboard-stage-actions">
                <Link href={card.href} className="btn btn-primary btn-sm rounded-2xl">进入主工作区</Link>
                <Link href={card.secondaryHref} className="btn btn-ghost btn-sm rounded-2xl">{card.secondaryLabel}</Link>
              </div>
            </article>
          ))}
        </div>
      </AdminWorkspaceSection>

      <div className="dashboard-command-grid">
        <AdminWorkspaceSection
          title="Core Signals"
          description="把总量、变化和趋势留在同一个信号层里，避免首页直接滑向页面级数据明细。"
        >
          <div className="dashboard-kpi-grid">
            {kpiData.map((item) => (
              <KpiCard key={item.title} {...item} />
            ))}
          </div>
          <div className="mt-6">
            <UsersChart />
          </div>
        </AdminWorkspaceSection>

        <AdminWorkspaceSection
          title="Risk Radar"
          description="用内容、触达和 AI 供给的高频信号定义今天的优先干预面。"
        >
          <div className="dashboard-risk-panel">
            <div className="dashboard-risk-visual" aria-hidden="true">
              <div className="dashboard-risk-ring dashboard-risk-ring-outer" />
              <div className="dashboard-risk-ring dashboard-risk-ring-middle" />
              <div className="dashboard-risk-ring dashboard-risk-ring-inner" />
              <span className="dashboard-risk-dot dashboard-risk-dot-primary" />
              <span className="dashboard-risk-dot dashboard-risk-dot-secondary" />
              <span className="dashboard-risk-dot dashboard-risk-dot-tertiary" />
            </div>

            <div className="dashboard-risk-list">
              {riskSignals.map((signal) => (
                <article key={signal.label} className="dashboard-risk-item">
                  <div>
                    <p className="dashboard-risk-item-label">{signal.label}</p>
                    <p className="dashboard-risk-item-hint">{signal.hint}</p>
                  </div>
                  <strong>{signal.value}</strong>
                </article>
              ))}
            </div>

            <div className="dashboard-callout">
              <h3>Operator Note</h3>
              <p>
                如果首页只展示 KPI，管理员仍需要自己猜今天先看哪里。风险雷达的职责是把“供给、社区、触达”压缩成可进入的作业面。
              </p>
            </div>
          </div>
        </AdminWorkspaceSection>
      </div>

      <AdminWorkspaceSection
        title="Active Queues"
        description="首页保留少量真实队列样本，帮助团队从指挥层直接进入当前最活跃的工作台。"
      >
        <div className="dashboard-queue-grid">
          {queuePanels.map((panel) => (
            <article key={panel.title} className="dashboard-queue-panel">
              <div className="dashboard-queue-head">
                <div>
                  <p className="dashboard-queue-eyebrow">{panel.eyebrow}</p>
                  <h3 className="dashboard-queue-title">{panel.title}</h3>
                </div>
                <Link href={panel.href} className="btn btn-ghost btn-xs rounded-xl">查看全部</Link>
              </div>

              <div className="dashboard-queue-list">
                {panel.items.length ? (
                  panel.items.map((item, index) => (
                    <div key={`${panel.title}-${item.title}-${index}`} className="dashboard-queue-item">
                      <div>
                        <p className="dashboard-queue-item-title">{item.title}</p>
                        <p className="dashboard-queue-item-meta">{item.meta}</p>
                      </div>
                      <span className="dashboard-queue-badge">{item.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="dashboard-queue-empty">当前没有可展示的数据样本。</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}
