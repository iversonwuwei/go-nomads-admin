"use client";

import { fetchTravelPlanById, type TravelPlanDetailDto } from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    HomeIcon,
    MapIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TabKey = "info" | "itinerary" | "attractions" | "restaurants" | "budget" | "tips";

const TABS: { key: TabKey; label: string }[] = [
	{ key: "info", label: "基本信息" },
	{ key: "itinerary", label: "每日行程" },
	{ key: "attractions", label: "景点推荐" },
	{ key: "restaurants", label: "餐厅推荐" },
	{ key: "budget", label: "预算" },
	{ key: "tips", label: "提示" },
];

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
	return (
		<div className="flex items-center justify-between border-b border-base-300/40 py-3">
			<span className="text-sm text-base-content/60">{label}</span>
			<span className="text-sm font-medium">{value ?? "—"}</span>
		</div>
	);
}

function Placeholder({ text }: { text: string }) {
	return (
		<div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-base-300 text-base-content/30">
			<p className="text-sm">{text}</p>
		</div>
	);
}

export default function TravelPlanDetailPage() {
	const { id } = useParams<{ id: string }>();
	const [plan, setPlan] = useState<TravelPlanDetailDto | null>(null);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<TabKey>("info");

	useEffect(() => {
		if (!id) return;
		let active = true;
		fetchTravelPlanById(id).then((res) => {
			if (!active) return;
			if (res.ok && res.data) setPlan(res.data);
			setLoading(false);
		});
		return () => { active = false; };
	}, [id]);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<span className="loading loading-spinner loading-md" />
			</div>
		);
	}

	if (!plan) {
		return (
			<div className="flex h-64 flex-col items-center justify-center gap-2 text-base-content/40">
				<p>旅行计划未找到</p>
				<Link href="/travel-plans" className="btn btn-sm btn-primary">返回列表</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<Link href="/travel-plans" className="hover:text-primary">旅行计划</Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">{plan.cityName || plan.destination || id}</span>
			</div>

			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<MapIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">{plan.cityName || plan.destination || "旅行计划"}</h1>
					<p className="text-xs text-base-content/50">
						{plan.days ? `${plan.days} 天` : ""} · {plan.budgetLevel || ""} · {plan.travelStyle || ""}
					</p>
				</div>
				<div className="ml-auto">
					<span className={`badge ${plan.status === "completed" ? "badge-success" : plan.status === "confirmed" ? "badge-info" : "badge-warning"}`}>
						{plan.status || "—"}
					</span>
				</div>
			</div>

			{/* Tab Strip */}
			<div className="flex gap-1 overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100 p-1">
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
							tab === t.key ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content/70"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
				{tab === "info" && (
					<div className="max-w-lg">
						<InfoRow label="目的地" value={plan.cityName || plan.destination} />
						<InfoRow label="天数" value={plan.days} />
						<InfoRow label="预算等级" value={plan.budgetLevel} />
						<InfoRow label="旅行风格" value={plan.travelStyle} />
						<InfoRow label="出发城市" value={plan.departureCity} />
						<InfoRow label="出发日期" value={plan.departureDate?.slice(0, 10)} />
						<InfoRow label="状态" value={plan.status} />
						<InfoRow label="用户" value={plan.userName} />
						<InfoRow label="完成度" value={plan.completionRate != null ? `${plan.completionRate}%` : undefined} />
						{plan.interests && plan.interests.length > 0 && (
							<div className="mt-4 flex flex-wrap gap-1.5">
								{plan.interests.map((i) => (
									<span key={i} className="badge badge-sm badge-outline">{i}</span>
								))}
							</div>
						)}
					</div>
				)}
				{tab === "itinerary" && <Placeholder text="每日行程数据（API 返回 dailyItinerary 后渲染）" />}
				{tab === "attractions" && <Placeholder text="景点推荐数据（API 返回 attractions 后渲染）" />}
				{tab === "restaurants" && <Placeholder text="餐厅推荐数据（API 返回 restaurants 后渲染）" />}
				{tab === "budget" && <Placeholder text="预算数据（API 返回 budget 后渲染）" />}
				{tab === "tips" && (
					plan.tips && plan.tips.length > 0 ? (
						<ul className="list-inside list-disc space-y-2 text-sm text-base-content/80">
							{plan.tips.map((t) => <li key={t}>{t}</li>)}
						</ul>
					) : <Placeholder text="暂无提示" />
				)}
			</div>
		</div>
	);
}
