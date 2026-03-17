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
    <Card className="ring-0">
      <Flex alignItems="start">
        <div className="truncate">
          <Text>{title}</Text>
          <Metric className="truncate">{valueNum.toLocaleString()}</Metric>
        </div>
        <Icon icon={IconComponent} size="lg" variant="light" tooltip={title} />
      </Flex>
      <Flex className="mt-4 space-x-2">
        <Text className="truncate">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isPositive ? "▲" : "▼"} {percentageChange.toFixed(1)}%
          </span>{" "}
          vs last 30 days
        </Text>
        <Text className="truncate">{metricNum.toLocaleString()}</Text>
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
    <Card className="ring-0">
      <Title>User Growth (2023)</Title>
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
