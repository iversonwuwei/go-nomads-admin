"use client";

import {
    BuildingOffice2Icon,
    CalendarDaysIcon,
    LightBulbIcon,
    MapPinIcon,
    UserPlusIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import {
    AreaChart,
    Card,
    Flex,
    Icon,
    Metric,
    Text,
    Title,
} from "@tremor/react";
import type { SVGProps } from "react";

export type DashboardIconName =
  | "buildingOffice"
  | "calendarDays"
  | "lightBulb"
  | "mapPin"
  | "userPlus"
  | "users";

const iconMap: Record<
  DashboardIconName,
  React.ComponentType<SVGProps<SVGSVGElement>>
> = {
  buildingOffice: BuildingOffice2Icon,
  calendarDays: CalendarDaysIcon,
  lightBulb: LightBulbIcon,
  mapPin: MapPinIcon,
  userPlus: UserPlusIcon,
  users: UsersIcon,
};

type KpiCardProps = {
  title: string;
  value: string;
  icon: DashboardIconName;
  metric: string;
  metricPrev: string;
};

export function KpiCard({
  title,
  value,
  icon,
  metric,
  metricPrev,
}: KpiCardProps) {
  const IconComponent = iconMap[icon];
  const valueNum = parseFloat(value);
  const metricNum = parseFloat(metric);
  const metricPrevNum = parseFloat(metricPrev);
  const percentageChange =
    metricPrevNum !== 0
      ? ((metricNum - metricPrevNum) / metricPrevNum) * 100
      : 0;
  const isPositive = percentageChange >= 0;

  return (
    <Card className="dashboard-kpi-card ring-0 p-5">
      <Flex alignItems="start">
        <div className="truncate">
          <Text className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</Text>
          <Metric className="mt-2 truncate text-slate-950">{valueNum.toLocaleString()}</Metric>
        </div>
        <div className="dashboard-kpi-icon rounded-2xl p-2.5 text-primary">
          <Icon icon={IconComponent} size="lg" variant="simple" tooltip={title} />
        </div>
      </Flex>
      <Flex className="mt-5 items-center justify-between gap-3">
        <Text className="truncate text-slate-600">
          <span
            className={`dashboard-kpi-delta rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isPositive ? "▲" : "▼"} {percentageChange.toFixed(1)}%
          </span>{" "}
          过去 30 天
        </Text>
        <Text className="truncate font-semibold text-slate-900">{metricNum.toLocaleString()}</Text>
      </Flex>
    </Card>
  );
}

const chartdata = [
  { date: "Jan 23", "New Users": 167, "Active Users": 140 },
  { date: "Feb 23", "New Users": 172, "Active Users": 145 },
  { date: "Mar 23", "New Users": 181, "Active Users": 150 },
  { date: "Apr 23", "New Users": 185, "Active Users": 155 },
  { date: "May 23", "New Users": 190, "Active Users": 160 },
  { date: "Jun 23", "New Users": 201, "Active Users": 165 },
  { date: "Jul 23", "New Users": 210, "Active Users": 170 },
  { date: "Aug 23", "New Users": 225, "Active Users": 180 },
  { date: "Sep 23", "New Users": 230, "Active Users": 185 },
  { date: "Oct 23", "New Users": 245, "Active Users": 190 },
  { date: "Nov 23", "New Users": 250, "Active Users": 195 },
  { date: "Dec 23", "New Users": 261, "Active Users": 205 },
];

const valueFormatter = (number: number) => {
  return new Intl.NumberFormat("us").format(number).toString();
};

export function UsersChart() {
  return (
    <Card className="dashboard-chart-card ring-0 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Title>User Growth Signal</Title>
          <Text className="mt-1">用增长趋势区分拉新和留存，避免把总量误判成健康度。</Text>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="control-chip"><strong>New Users</strong> Acquisition</span>
          <span className="control-chip"><strong>Active Users</strong> Retention</span>
        </div>
      </div>
      <AreaChart
        className="mt-4 h-72"
        data={chartdata}
        index="date"
        categories={["New Users", "Active Users"]}
        colors={["indigo", "cyan"]}
        valueFormatter={valueFormatter}
      />
    </Card>
  );
}
