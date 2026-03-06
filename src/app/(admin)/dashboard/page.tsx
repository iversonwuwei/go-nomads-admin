import { fetchDashboardOverview } from "@/app/lib/admin-api";
import {
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarSquareIcon,
    ChatBubbleBottomCenterTextIcon,
    LightBulbIcon,
    MapPinIcon,
    UserPlusIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";

type BusinessGroup = "用户类" | "内容类" | "活动类";

type KpiCard = {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  group: BusinessGroup;
  tone: string;
  iconTone: string;
};

export default async function DashboardPage() {
  const overview = await fetchDashboardOverview();
  const data = overview.data;
  const users = data?.users;
  const entities = data?.entities;

  const groupMeta: Record<BusinessGroup, { tone: string; dot: string; desc: string }> = {
    用户类: {
      tone: "text-sky-700 bg-sky-50 border-sky-200",
      dot: "bg-sky-500",
      desc: "用户规模与增长",
    },
    内容类: {
      tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
      dot: "bg-indigo-500",
      desc: "城市与空间内容",
    },
    活动类: {
      tone: "text-amber-700 bg-amber-50 border-amber-200",
      dot: "bg-amber-500",
      desc: "活动与创新项目",
    },
  };

  const kpiCards: KpiCard[] = [
    {
      title: "用户总数",
      value: String(users?.totalUsers ?? 0),
      icon: UsersIcon,
      group: "用户类",
      tone: "border-sky-200 bg-sky-50/70 text-sky-700",
      iconTone: "bg-sky-100 text-sky-700",
    },
    {
      title: "新增用户数",
      value: String(users?.newUsers ?? 0),
      icon: UserPlusIcon,
      group: "用户类",
      tone: "border-sky-200 bg-sky-50/70 text-sky-700",
      iconTone: "bg-sky-100 text-sky-700",
    },
    {
      title: "城市总数",
      value: String(entities?.cities ?? 0),
      icon: MapPinIcon,
      group: "内容类",
      tone: "border-indigo-200 bg-indigo-50/70 text-indigo-700",
      iconTone: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Coworking 总数",
      value: String(entities?.coworkings ?? 0),
      icon: BuildingOffice2Icon,
      group: "内容类",
      tone: "border-indigo-200 bg-indigo-50/70 text-indigo-700",
      iconTone: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Meetup 总数",
      value: String(entities?.meetups ?? 0),
      icon: CalendarDaysIcon,
      group: "活动类",
      tone: "border-amber-200 bg-amber-50/70 text-amber-700",
      iconTone: "bg-amber-100 text-amber-700",
    },
    {
      title: "Innovation 总数",
      value: String(entities?.innovations ?? 0),
      icon: LightBulbIcon,
      group: "活动类",
      tone: "border-amber-200 bg-amber-50/70 text-amber-700",
      iconTone: "bg-amber-100 text-amber-700",
    },
  ];

  const groupOrder: BusinessGroup[] = ["用户类", "内容类", "活动类"];

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-base-300/60 bg-base-100/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Go Nomads Admin Console
            </p>
            <h1 className="mt-2 text-3xl font-bold">数据总览 / Analytics Dashboard</h1>
            <p className="mt-2 text-sm text-base-content/70">
              数据来自后端聚合接口，当前展示用户统计，后续可扩展更多业务指标。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-outline btn-sm">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
              公告 / Broadcast
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <ChartBarSquareIcon className="h-4 w-4" />
              导出报表 / Export
            </button>
          </div>
        </div>
      </header>

      {!overview.ok ? (
        <div className="alert alert-warning">
          <span>数据总览获取异常: {overview.message}</span>
        </div>
      ) : null}

      <section className="rounded-2xl border border-base-300/60 bg-base-100/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-base-content/70">数据概览</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {groupOrder.map((group) => (
              <span
                key={group}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${groupMeta[group].tone}`}
                title={groupMeta[group].desc}
              >
                <span className={`h-2 w-2 rounded-full ${groupMeta[group].dot}`} />
                {group}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-base-content/60">计算日期: {data?.calculatedDate ?? "-"}</p>
      </section>

      <section className="space-y-6">
        {groupOrder.map((group) => {
          const cards = kpiCards.filter((card) => card.group === group);

          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${groupMeta[group].dot}`} />
                <h2 className="text-sm font-semibold text-base-content">{group}</h2>
                <p className="text-xs text-base-content/60">{groupMeta[group].desc}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className={`rounded-2xl border p-5 shadow-sm ${item.tone}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-current/80">{item.title}</p>
                        <span className={`rounded-xl p-2 ${item.iconTone}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold text-current">{item.value}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}
