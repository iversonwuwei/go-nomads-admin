import {
    BuildingOffice2Icon,
    ChartBarSquareIcon,
    ChatBubbleBottomCenterTextIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";

const kpiCards = [
  {
    title: "活跃用户 / Active Users",
    value: "12,486",
    change: "+8.2%",
    trend: "up",
    icon: UsersIcon,
  },
  {
    title: "城市覆盖 / Cities Covered",
    value: "96",
    change: "+4",
    trend: "up",
    icon: MapPinIcon,
  },
  {
    title: "共享空间 / Coworking Spaces",
    value: "1,342",
    change: "+3.1%",
    trend: "up",
    icon: BuildingOffice2Icon,
  },
  {
    title: "待处理工单 / Open Tickets",
    value: "27",
    change: "-5",
    trend: "down",
    icon: ClipboardDocumentListIcon,
  },
];

const moderationQueue = [
  {
    id: "EVT-2319",
    type: "活动 / Event",
    city: "Chiang Mai",
    status: "待审核 / Pending",
    updatedAt: "2026-03-05 18:42",
  },
  {
    id: "CWK-8841",
    type: "空间 / Coworking",
    city: "Bali",
    status: "待补充 / Need Info",
    updatedAt: "2026-03-05 17:15",
  },
  {
    id: "ACC-1207",
    type: "住宿 / Stay",
    city: "Lisbon",
    status: "已通过 / Approved",
    updatedAt: "2026-03-05 16:02",
  },
];

const systemHealth = [
  { name: "Gateway", status: "Healthy", latency: "18ms" },
  { name: "SearchService", status: "Healthy", latency: "34ms" },
  { name: "MessageService", status: "Warning", latency: "146ms" },
  { name: "AIService", status: "Healthy", latency: "52ms" },
];

function statusBadge(status: string) {
  if (status === "Healthy") return "badge badge-success badge-sm";
  if (status === "Warning") return "badge badge-warning badge-sm";
  return "badge badge-neutral badge-sm";
}

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-base-300/60 bg-base-100/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Go Nomads Admin Console
            </p>
            <h1 className="mt-2 text-3xl font-bold">管理控制台 / Admin Dashboard</h1>
            <p className="mt-2 text-sm text-base-content/70">
              统一查看平台核心指标、内容审核与服务状态。 Unified view for KPIs,
              moderation, and service health.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          const trendClass = item.trend === "up" ? "text-success" : "text-warning";

          return (
            <article
              key={item.title}
              className="rounded-2xl border border-base-300/60 bg-base-100/90 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-base-content/70">{item.title}</p>
                <span className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              <p className={`mt-1 text-sm ${trendClass}`}>{item.change}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-base-300/60 bg-base-100/90 p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">审核队列 / Moderation Queue</h2>
            <button type="button" className="btn btn-ghost btn-xs">
              查看全部 / View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>类型 / Type</th>
                  <th>城市 / City</th>
                  <th>状态 / Status</th>
                  <th>更新时间 / Updated</th>
                </tr>
              </thead>
              <tbody>
                {moderationQueue.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.city}</td>
                    <td>
                      <span className="badge badge-outline badge-sm">{row.status}</span>
                    </td>
                    <td>{row.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-base-300/60 bg-base-100/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">服务状态 / Service Health</h2>
            <span className="badge badge-info badge-sm">Real-time</span>
          </div>
          <ul className="space-y-3">
            {systemHealth.map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-base-content/60">延迟 / Latency: {service.latency}</p>
                </div>
                <span className={statusBadge(service.status)}>{service.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
