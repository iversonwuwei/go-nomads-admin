import Link from "next/link";

const entries = [
  {
    href: "/dashboard",
    title: "数据总览 / Analytics Dashboard",
    desc: "统一展示平台核心统计指标，支持后续扩展更多维度。",
  },
  {
    href: "/moderation/reports",
    title: "举报中心 / Reports",
    desc: "举报工单分配、处置、SLA 跟踪。",
  },
  {
    href: "/moderation/city-photos",
    title: "城市图片审核 / City Photos",
    desc: "UGC 图片审核、批量操作、风控标记。",
  },
  {
    href: "/iam/roles",
    title: "角色权限 / Roles",
    desc: "RBAC 管理和作用域控制。",
  },
  {
    href: "/users",
    title: "用户中心 / Users",
    desc: "用户查询、角色筛选与状态治理。",
  },
  {
    href: "/cities",
    title: "城市列表 / Cities",
    desc: "城市列表与详情查看，支持关联资源分析。",
  },
  {
    href: "/coworking",
    title: "联合办公 / Coworking",
    desc: "联合办公空间列表与详情，关联城市与创建人信息。",
  },
  {
    href: "/innovation",
    title: "创新项目 / Innovation",
    desc: "创新项目列表与详情，展示创建人和热度指标。",
  },
  {
    href: "/meetups",
    title: "活动列表 / Meetups",
    desc: "Meetup(Event) 列表与详情，展示组织者与城市关联。",
  },
];

export default function OperationsPage() {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm">
        <h1 className="text-2xl font-bold">运营模块入口 / Operations Index</h1>
        <p className="mt-2 text-sm text-base-content/70">
          快速进入当前已落地的中台与管理模块页面。
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="rounded-2xl border border-base-300/60 bg-base-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="font-semibold">{entry.title}</h2>
            <p className="mt-2 text-sm text-base-content/70">{entry.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
