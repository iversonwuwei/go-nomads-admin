import {
  AdminWorkspace,
  AdminWorkspaceBreadcrumb,
  AdminWorkspaceHero,
  AdminWorkspaceSection,
} from "@/app/components/admin/system-workspace";
import Link from "next/link";

type OperationGroup = {
  area: string;
  title: string;
  desc: string;
  focus: string;
  entries: Array<{
    href: string;
    title: string;
    desc: string;
  }>;
};

const groups: OperationGroup[] = [
  {
    area: "Area 01",
    title: "控制总览区",
    desc: "这是总览与策略入口，适合先判断今天该从哪个方向切入 App 运营。",
    focus: "先确定主战场，再进入具体模块。",
    entries: [
      {
        href: "/app-control",
        title: "App 控制台 / App Control Plane",
        desc: "围绕 App 生命周期组织内容供给、审核治理、增长与会员运营的工作台。",
      },
      {
        href: "/dashboard",
        title: "数据总览 / Analytics Dashboard",
        desc: "展示平台核心统计指标，并作为 App Control 的总览入口。",
      },
    ],
  },
  {
    area: "Area 02",
    title: "治理与权限区",
    desc: "这一块只处理用户、举报、审核和权限，不和内容供给数据混放。",
    focus: "风险、身份、审计在同一区域完成判断。",
    entries: [
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
    ],
  },
  {
    area: "Area 03",
    title: "内容供给区",
    desc: "这一块集中管理进入 App 首页、详情页和发现流的资源数据。",
    focus: "只看供给，不混入治理和权限任务。",
    entries: [
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
    ],
  },
];

export default function OperationsPage() {
  const totalModules = groups.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <AdminWorkspace>
      <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "运营入口" }]} />
      <AdminWorkspaceHero
        eyebrow="Operations Routing"
        title="运营模块入口 / Operations Index"
        description="这个页面的目标不是堆所有链接，而是帮运营先分清当前要进入的是总览区、治理区还是内容供给区。"
        actions={
          <Link href="/dashboard" className="btn btn-outline rounded-2xl">
            返回数据总览
          </Link>
        }
        stats={[
          { label: "Areas", value: String(groups.length), hint: "当前按问题类型拆分的入口区域" },
          { label: "Modules", value: String(totalModules), hint: "当前纳入编排的运营模块数" },
          { label: "Routing Principle", value: "总览 / 治理 / 供给", hint: "先判断问题类型，再进入具体模块" },
        ]}
      />

      {groups.map((group) => (
        <AdminWorkspaceSection
          key={group.area}
          title={group.title}
          description={group.desc}
        >
          <div className="control-focus-bar">
            <div className="control-focus-item">
              <span>Focus</span>
              <strong>{group.focus}</strong>
            </div>
            <div className="control-focus-item">
              <span>Modules</span>
              <strong>{group.entries.length} 个入口</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {group.entries.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="control-stage-card p-5 transition hover:-translate-y-0.5"
              >
                <h3 className="font-semibold">{entry.title}</h3>
                <p className="mt-2 text-sm text-base-content/70">{entry.desc}</p>
              </Link>
            ))}
          </div>
        </AdminWorkspaceSection>
      ))}
    </AdminWorkspace>
  );
}
