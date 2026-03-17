import {
  type DashboardIconName,
  KpiCard,
  UsersChart,
} from "@/app/(admin)/dashboard/components/DashboardClientComponents";
import { fetchDashboardOverview } from "@/app/lib/admin-api";
import { Grid, Text, Title } from "@tremor/react";

type DashboardKpiItem = {
  title: string;
  value: string;
  icon: DashboardIconName;
  metric: string;
  metricPrev: string;
};

export default async function DashboardPage() {
  const overview = await fetchDashboardOverview();
  const data = overview.data;
  const users = data?.users;
  const entities = data?.entities;

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
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <Title>数据总览 / Analytics Dashboard</Title>
      <Text>
        数据来自后端聚合接口，当前展示用户统计，后续可扩展更多业务指标。
      </Text>

      {!overview.ok ? (
        <div className="mt-6 alert alert-warning">
          <span>数据总览获取异常: {overview.message}</span>
        </div>
      ) : null}

      <Grid numItemsMd={2} numItemsLg={3} className="mt-6 gap-6">
        {kpiData.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </Grid>

      <Grid numItemsMd={1} numItemsLg={1} className="mt-6 gap-6">
        <UsersChart />
      </Grid>
    </main>
  );
}
