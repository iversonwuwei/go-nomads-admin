import Link AdminWnextrlink
dmin / sys
AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
  temworkspacesystemworkspace
import { UserIdentityLink     fetchUserscomponents/user-identitylink
}pp / lib{
    fetchAiSessions,
    fetchCities,
    fetchCommunityPosts,
    fetchDashboardOverview,
    fetchMeetups,
    fetchMembershipPlans,
    fetchNotifications,
    fetchTravelPlans,
    fetchUsers,
} pp / libn@/app/libnadmin-api";

type StageCard = {
  eyebrow: string;
  title: string;
  description: string;
  focus: string;
  metrics: Array<{ label: string; value: string }>;
  links: Array<{ label: string; href: string }>;
};

function formatCount(value: number | undefined) {
  return new Intl.NumberFormat("zh-CN").format(value ?? 0);
}

function formatNullable(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

export default async function AppControlPage() {
  const [overview, usersRes, citiesRes, meetupsRes, communityRes, notificationsRes, membershipsRes, travelPlansRes, aiSessionsRes] = await Promise.all([
    fetchDashboardOverview(),
    fetchUsers({ page: 1, pageSize: 5 }),
    fetchCities({ page: 1, pageSize: 5 }),
    fetchMeetups({ page: 1, pageSize: 5 }),
    fetchCommunityPosts({ page: 1, pageSize: 5 }),
    fetchNotifications({ page: 1, pageSize: 5 }),
    fetchMembershipPlans(),
    fetchTravelPlans({ page: 1, pageSize: 5 }),
    fetchAiSessions({ page: 1, pageSize: 5 }),
  ]);

  const users = overview.data?.users;
  const entities = overview.data?.entities;

  const stages: StageCard[] = [
    {
      eyebrow: "Stage 01",
      title: "准入与激活",
      description: "围绕注册、登录、基础用户状态和触达入口，确保用户能进入 App 并保持活跃。",
      focus: "先保障进得来，再谈增长。",
      metrics: [
        { label: "总用户", value: formatCount(users?.totalUsers) },
        { label: "30d 新增", value: formatCount(users?.newUsers) },
        { label: "通知数", value: formatCount(notificationsRes.data?.totalCount) },
      ],
      links: [
        { label: "用户中心", href: "/users" },
        { label: "通知推送", href: "/notifications" },
        { label: "法律文档", href: "/legal" },
      ],
    },
    {
      eyebrow: "Stage 02",
      title: "内容供给",
      description: "围绕城市、联合办公、活动、创新项目与旅行计划，决定 App 首页和详情页能展示什么。",
      focus: "先控制供给质量，再放大流量分发。",
      metrics: [
        { label: "城市", value: formatCount(entities?.cities) },
        { label: "Coworking", value: formatCount(entities?.coworkings) },
        { label: "Meetups", value: formatCount(entities?.meetups) },
      ],
      links: [
        { label: "城市资源", href: "/cities" },
        { label: "联合办公", href: "/coworking" },
        { label: "活动管理", href: "/meetups" },
        { label: "旅行计划", href: "/travel-plans" },
      ],
    },
    {
      eyebrow: "Stage 03",
      title: "社区与安全",
      description: "围绕社区帖子、举报、图片和评论，把 App 的互动风险控制在可治理范围内。",
      focus: "先压住风险，再释放互动。",
      metrics: [
        { label: "社区帖子", value: formatCount(communityRes.data?.totalCount) },
        { label: "最近活动", value: formatCount(meetupsRes.data?.totalCount) },
        { label: "最新城市", value: formatCount(citiesRes.data?.totalCount) },
      ],
      links: [
        { label: "举报中心", href: "/moderation/reports" },
        { label: "图片审核", href: "/moderation/city-photos" },
        { label: "社区内容", href: "/community" },
        { label: "城市评论", href: "/city-reviews" },
      ],
    },
    {
      eyebrow: "Stage 04",
      title: "增长与留存",
      description: "围绕会员、AI、推送、旅行计划和会话数据，支撑 App 的召回、转化和长期留存。",
      focus: "先识别高价值动作，再优化运营投入。",
      metrics: [
        { label: "会员计划", value: formatCount(membershipsRes.data?.length) },
        { label: "AI 会话", value: formatCount(aiSessionsRes.data?.totalCount) },
        { label: "旅行计划", value: formatCount(travelPlansRes.data?.totalCount) },
      ],
      links: [
        { label: "会员管理", href: "/membership" },
        { label: "AI 对话", href: "/ai-chat" },
        { label: "通知推送", href: "/notifications" },
        { label: "聊天记录", href: "/chat" },
      ],
    },
  ];

  const warnings = [usersRes, citiesRes, meetupsRes, communityRes, notificationsRes, membershipsRes, travelPlansRes, aiSessionsRes]
    .filter((result) => !result.ok)
    .map((result) => result.message);

  const signalCards = [
    { label: "活跃入口", value: formatCount(users?.newUsers), hint: "最近 30d 新增用户" },
    { label: "内容库存", value: formatCount((entities?.cities ?? 0) + (entities?.meetups ?? 0)), hint: "城市 + 活动供给" },
    { label: "社区面", value: formatCount(communityRes.data?.totalCount), hint: "需要治理的帖子与互动" },
    { label: "增长面", value: formatCount((notificationsRes.data?.totalCount ?? 0) + (membershipsRes.data?.length ?? 0)), hint: "通知与会员动作" },
  ];

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb
        items={[
          { label: "数据中心", href: "/dashboard" },
          { label: "App Control" },
        ]}
      />

      <AdminWorkspaceHero
        eyebrow="App Oriented Control Plane"
        title="面向 App 的管理控制台"
        description="这个页面不是再列一次后台模块，而是把 Admin 和 App 的依赖关系转成真实的运营流程。管理员在这里应优先思考哪些数据会进入 App、哪些内容会影响用户体验、哪些动作能带来增长或降低风险。"
        actions={
          <>
            <Link href="/dashboard" className="btn btn-outline rounded-2xl px-5">返回总览</Link>
            <Link href="/operations" className="btn btn-primary rounded-2xl px-5">查看全部运营入口</Link>
          </>
        }
        stats={signalCards}
      />

      {warnings.length > 0 ? (
        <div className="alert alert-warning">
          <span>部分工作台数据读取失败，当前页面已回退为可浏览模式：{warnings[0]}</span>
        </div>
      ) : null}

      <AdminWorkspaceSection
        title="生命周期阶段区"
        description="这一块只回答一个问题：当前 App 管理动作被切成哪几段生命周期。它是导航与认知分区，不是具体明细列表。"
      >
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>先识别阶段，再进入模块</strong>
            </div>
            <div className="control-focus-item">
              <span>Boundary</span>
              <strong>这里展示任务分段，不展示具体业务记录</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stages.map((stage) => (
              <div key={stage.title} className="control-stage-zone">
                <article className="control-stage-card p-5 md:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-base-content/45">{stage.eyebrow}</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{stage.title}</h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{stage.focus}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-base-content/65">{stage.description}</p>
                  <div className="mt-4 grid gap-2">
                    {stage.metrics.map((metric) => (
                      <div key={metric.label} className="control-mini-stat flex items-center justify-between text-sm">
                        <span className="text-base-content/60">{metric.label}</span>
                        <span className="font-semibold tabular-nums">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stage.links.map((link) => (
                      <Link key={link.href} href={link.href} className="btn btn-ghost btn-sm rounded-2xl border border-base-300/70 bg-base-100/90">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </article>
              </div>
            ))}
          </div>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection
        title="供给与增长执行区"
        description="这个区域只处理会直接进入 App 的供给数据，以及影响召回和转化的增长动作。和社区治理区保持明确边界。"
      >
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Left Area</span>
              <strong>内容供给明细</strong>
            </div>
            <div className="control-focus-item">
              <span>Right Area</span>
              <strong>增长触达动作</strong>
            </div>
          </div>

          <div className="control-area-grid mt-5">
            <section className="admin-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">最近进入 App 的核心供给</h2>
                  <p className="mt-1 text-sm text-base-content/60">优先检查会直接影响首页、详情页和推荐流的数据。</p>
                </div>
                <Link href="/cities" className="btn btn-outline btn-sm">管理资源</Link>
              </div>
              <div className="mt-4 space-y-3">
                {(citiesRes.data?.items ?? []).slice(0, 3).map((city) => (
                  <div key={city.id} className="control-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{city.name || "未命名城市"}</p>
                        <p className="mt-1 text-xs text-base-content/55">{formatNullable(city.country || city.region, "未知区域")} · Coworking {city.coworkingCount ?? 0} · Meetup {city.meetupCount ?? 0}</p>
                      </div>
                      <Link href={`/cities/${encodeURIComponent(city.id)}`} className="btn btn-xs rounded-xl">查看</Link>
                    </div>
                  </div>
                ))}
                {(meetupsRes.data?.items ?? []).slice(0, 2).map((meetup) => (
                  <div key={meetup.id} className="control-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{meetup.title || "未命名活动"}</p>
                        <p className="mt-1 text-xs text-base-content/55">{formatNullable(meetup.cityName, "未知城市")} · {formatNullable(meetup.category, "未分类")} · 参与 {meetup.participantCount ?? 0}</p>
                      </div>
                      <Link href={`/meetups/${encodeURIComponent(meetup.id)}`} className="btn btn-xs rounded-xl">查看</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">增长与互动动作</h2>
                  <p className="mt-1 text-sm text-base-content/60">聚焦通知、会员、AI 和旅行计划，这些模块最直接影响召回和留存。</p>
                </div>
                <Link href="/membership" className="btn btn-outline btn-sm">管理增长</Link>
              </div>
              <div className="mt-4 space-y-3">
                {(notificationsRes.data?.items ?? []).slice(0, 3).map((notification) => (
                  <div key={notification.id} className="control-list-row">
                    <p className="font-semibold">{notification.title || "未命名通知"}</p>
                    <p className="mt-1 text-xs text-base-content/55">{formatNullable(notification.type, "system")} · {formatNullable(notification.scope, "all")} · 状态 {formatNullable(notification.status, "draft")}</p>
                  </div>
                ))}
                {(membershipsRes.data ?? []).slice(0, 2).map((plan) => (
                  <div key={plan.id} className="control-list-row">
                    <p className="font-semibold">{plan.name || "未命名计划"}</p>
                    <p className="mt-1 text-xs text-base-content/55">¥{plan.price ?? 0} · {formatNullable(plan.duration, "monthly")} · 订阅 {plan.subscriberCount ?? 0}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection
        title="治理与深度行为区"
        description="将社区安全与 AI / 行程深度行为单独分区，明确告诉用户这不是供给数据，也不是增长活动，而是风险与高价值使用行为的观察区。"
      >
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Left Area</span>
              <strong>社区治理与内容风险</strong>
            </div>
            <div className="control-focus-item">
              <span>Right Area</span>
              <strong>AI 与旅行计划深度行为</strong>
            </div>
          </div>

          <div className="control-area-grid mt-5">
            <section className="admin-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold">社区与安全样本</h2>
              <p className="mt-1 text-sm text-base-content/60">这里展示最近的帖子内容，帮助运营快速判断 App 社区面的质量。</p>
              <div className="mt-4 space-y-3">
                {(communityRes.data?.items ?? []).slice(0, 4).map((post) => (
                  <div key={post.id} className="control-list-row">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <UserIdentityLink userId={post.authorId} userName={post.authorName} fallback="匿名用户" className="font-semibold text-primary hover:underline" plainClassName="font-semibold" />
                        <p className="mt-1 line-clamp-2 text-sm text-base-content/70">{post.content || "无正文"}</p>
                        <p className="mt-2 text-xs text-base-content/50">{formatNullable(post.cityName, "未绑定城市")} · Like {post.likeCount ?? 0} · Comment {post.commentCount ?? 0}</p>
                      </div>
                      <Link href="/community" className="btn btn-xs rounded-xl">进入</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel rounded-3xl p-6">
              <h2 className="text-lg font-bold">智能与规划信号</h2>
              <p className="mt-1 text-sm text-base-content/60">AI 和旅行计划既是功能深度，也是留存信号，应被纳入同一控制视角。</p>
              <div className="mt-4 space-y-3">
                {(aiSessionsRes.data?.items ?? []).slice(0, 2).map((session) => (
                  <div key={session.id} className="control-list-row">
                    <UserIdentityLink userId={session.userId} userName={session.userName} fallback="未知用户" className="font-semibold text-primary hover:underline" plainClassName="font-semibold" />
                    <p className="mt-1 text-xs text-base-content/55">模型 {formatNullable(session.model, "default")} · Token {session.tokenUsage ?? 0}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-base-content/70">{session.lastMessage || "暂无上下文"}</p>
                  </div>
                ))}
                {(travelPlansRes.data?.items ?? []).slice(0, 3).map((plan) => (
                  <div key={plan.id} className="control-list-row">
                    <p className="font-semibold">{formatNullable(plan.destination || plan.cityName, "未命名行程")}</p>
                    <p className="mt-1 text-xs text-base-content/55"><UserIdentityLink userId={plan.userId} userName={plan.userName} fallback="未知用户" className="text-primary hover:underline" plainClassName="font-medium" /> · {formatNullable(plan.travelStyle, "未知风格")} · 完成度 {plan.completionRate ?? 0}%</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
      </AdminWorkspaceSection>
    </AdminWorkspace>
  );
}