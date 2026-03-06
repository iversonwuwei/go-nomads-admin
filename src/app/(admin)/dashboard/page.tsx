import { fetchDashboardOverview } from "@/app/lib/admin-api";
import {
    BuildingOffice2Icon,
    ChartBarSquareIcon,
    ChatBubbleBottomCenterTextIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";

function statusBadge(status: string) {
  if (status === "Healthy") return "badge badge-success badge-sm";
  if (status === "Warning") return "badge badge-warning badge-sm";
  return "badge badge-neutral badge-sm";
}

export default async function DashboardPage() {
  const overview = await fetchDashboardOverview();
  const data = overview.data;

  const kpiCards = [
    {
      title: "活跃用户 / Active Users",
      value: String(data.kpi.activeUsers),
      icon: UsersIcon,
    },
    {
      title: "城市覆盖 / Cities Covered",
      value: String(data.kpi.citiesCovered),
      icon: MapPinIcon,
    },
    {
      title: "共享空间 / Coworking Spaces",
      value: String(data.kpi.coworkingSpaces),
      icon: BuildingOffice2Icon,
    },
    {
      title: "待处理工单 / Open Tickets",
      value: String(data.kpi.openTickets),
      icon: ClipboardDocumentListIcon,
    },
  ];

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
              全部卡片与列表均来自后端服务实时数据。
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
          <span>部分后端服务异常: {overview.message}</span>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;

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
                  <th>对象 / Target</th>
                  <th>状态 / Status</th>
                  <th>更新时间 / Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-base-content/60">
                      暂无后端返回的队列数据
                    </td>
                  </tr>
                ) : (
                  data.queue.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-xs">{row.id}</td>
                      <td>{row.type}</td>
                      <td>{row.city}</td>
                      <td>
                        <span className="badge badge-outline badge-sm">{row.status}</span>
                      </td>
                      <td>{row.updatedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-base-300/60 bg-base-100/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">服务状态 / Service Health</h2>
            <span className="badge badge-info badge-sm">Back-end Linked</span>
          </div>
          <ul className="space-y-3">
            {data.serviceHealth.map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-base-300/60 bg-base-100 p-3"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-base-content/60">状态来源: 后端 API 可达性</p>
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
