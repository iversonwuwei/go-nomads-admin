"use client";

import { type DashboardOverview, fetchDashboardOverview } from "@/app/lib/admin-api";
import {
    ChartBarIcon,
    ChevronRightIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    HomeIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

type TabKey = "users" | "business" | "content" | "revenue";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
	{ key: "users", label: "用户分析", icon: UsersIcon },
	{ key: "business", label: "业务分析", icon: GlobeAltIcon },
	{ key: "content", label: "内容分析", icon: DocumentTextIcon },
	{ key: "revenue", label: "收入分析", icon: CurrencyDollarIcon },
];

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
	return (
		<div className="rounded-2xl border border-base-300/60 bg-base-100 p-5">
			<p className="text-xs uppercase tracking-widest text-base-content/50">{label}</p>
			<p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
			{sub && <p className="mt-1 text-xs text-base-content/50">{sub}</p>}
		</div>
	);
}

function Placeholder({ text }: { text: string }) {
	return (
		<div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-base-300 text-base-content/30">
			<p className="text-sm">{text}</p>
		</div>
	);
}

export default function AnalyticsPage() {
	const [tab, setTab] = useState<TabKey>("users");
	const [overview, setOverview] = useState<DashboardOverview | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		fetchDashboardOverview().then((res) => {
			if (!active) return;
			if (res.ok && res.data) setOverview(res.data);
			setLoading(false);
		});
		return () => { active = false; };
	}, []);

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">数据分析</span>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<ChartBarIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold">数据分析</h1>
						<p className="text-xs text-base-content/50">Analytics — 深度数据洞察</p>
					</div>
				</div>
			</div>

			{/* Overview KPIs */}
			{loading ? (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="h-28 animate-pulse rounded-2xl bg-base-200" />
					))}
				</div>
			) : overview ? (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<KpiCard label="总用户" value={overview.users.totalUsers.toLocaleString()} sub={`新增 ${overview.users.newUsers}`} />
					<KpiCard label="城市" value={overview.entities.cities} />
					<KpiCard label="共享空间" value={overview.entities.coworkings} />
					<KpiCard label="活动" value={overview.entities.meetups} />
				</div>
			) : null}

			{/* Tab Strip */}
			<div className="flex gap-1 rounded-2xl border border-base-300/60 bg-base-100 p-1">
				{TABS.map((t) => {
					const Icon = t.icon;
					return (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
								tab === t.key ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content/70"
							}`}
						>
							<Icon className="h-4 w-4" />
							{t.label}
						</button>
					);
				})}
			</div>

			{/* Tab Content */}
			{tab === "users" && (
				<div className="grid gap-4 md:grid-cols-2">
					<Placeholder text="用户增长趋势图（日/周/月）" />
					<Placeholder text="用户留存曲线" />
					<Placeholder text="用户画像 — 地理分布" />
					<Placeholder text="付费漏斗" />
				</div>
			)}

			{tab === "business" && (
				<div className="grid gap-4 md:grid-cols-2">
					<Placeholder text="城市热度 Top 20" />
					<Placeholder text="酒店浏览/预订转化" />
					<Placeholder text="活动参与率" />
					<Placeholder text="旅行计划生成/完成率" />
				</div>
			)}

			{tab === "content" && (
				<div className="grid gap-4 md:grid-cols-2">
					<Placeholder text="评论增长趋势" />
					<Placeholder text="优缺点贡献排行" />
					<Placeholder text="照片上传量" />
					<Placeholder text="举报分类饼图" />
				</div>
			)}

			{tab === "revenue" && (
				<div className="grid gap-4 md:grid-cols-2">
					<Placeholder text="会员收入趋势" />
					<Placeholder text="付费转化率" />
					<Placeholder text="ARPU 趋势" />
					<Placeholder text="收入构成" />
				</div>
			)}
		</div>
	);
}
