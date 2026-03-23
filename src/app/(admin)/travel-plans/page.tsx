"use client";

import { deleteTravelPlan, fetchTravelPlans, type TravelPlanDto } from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    EyeIcon,
    FunnelIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    MapIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
	{ label: "全部状态", value: "" },
	{ label: "Planning", value: "planning" },
	{ label: "Confirmed", value: "confirmed" },
	{ label: "Completed", value: "completed" },
];

function StatusBadge({ status }: { status?: string }) {
	const map: Record<string, string> = {
		planning: "badge-warning",
		confirmed: "badge-info",
		completed: "badge-success",
	};
	return (
		<span className={`badge badge-sm ${map[status ?? ""] ?? "badge-ghost"}`}>
			{status || "—"}
		</span>
	);
}

export default function TravelPlansPage() {
	const [plans, setPlans] = useState<TravelPlanDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");

	useEffect(() => {
		let active = true;
		fetchTravelPlans({ page, pageSize, search: search || undefined, status: status || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setPlans(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, search, status]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchTravelPlans({ page, pageSize, search: search || undefined, status: status || undefined });
		if (res.ok && res.data) { setPlans(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此旅行计划？")) return;
		await deleteTravelPlan(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">旅行计划</span>
			</div>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<MapIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold">旅行计划</h1>
						<p className="text-xs text-base-content/50">Travel Plans — 共 {total} 条</p>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4">
				<FunnelIcon className="h-4 w-4 text-base-content/40" />
				<div className="flex flex-1 items-center gap-2 rounded-xl border border-base-300/50 bg-base-100 px-3 py-1.5">
					<MagnifyingGlassIcon className="h-4 w-4 text-base-content/40" />
					<input
						className="w-full bg-transparent text-sm outline-none"
						placeholder="搜索目的地/用户..."
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
					/>
				</div>
				<select
					className="select select-sm select-bordered"
					value={status}
					onChange={(e) => { setStatus(e.target.value); setPage(1); }}
				>
					{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
				<table className="table table-sm">
					<thead>
						<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
							<th>目的地</th>
							<th>用户</th>
							<th>天数</th>
							<th>预算</th>
							<th>风格</th>
							<th>完成度</th>
							<th>状态</th>
							<th>创建时间</th>
							<th className="text-right">操作</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={9} className="py-12 text-center text-base-content/30">加载中…</td></tr>
						) : plans.length === 0 ? (
							<tr><td colSpan={9} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
						) : (
							plans.map((p) => (
								<tr key={p.id} className="hover:bg-base-200/50">
									<td className="font-medium">{p.cityName || p.destination || "—"}</td>
									<td className="text-base-content/70">{p.userName || "—"}</td>
									<td>{p.days ?? "—"}</td>
									<td>
										{p.budgetLevel ? (
											<span className="badge badge-sm badge-outline">{p.budgetLevel}</span>
										) : "—"}
									</td>
									<td>
										{p.travelStyle ? (
											<span className="badge badge-sm badge-ghost">{p.travelStyle}</span>
										) : "—"}
									</td>
									<td>
										{p.completionRate != null ? (
											<div className="flex items-center gap-2">
												<progress className="progress progress-primary w-16" value={p.completionRate} max={100} />
												<span className="text-xs tabular-nums">{p.completionRate}%</span>
											</div>
										) : "—"}
									</td>
									<td><StatusBadge status={p.status} /></td>
									<td className="text-xs text-base-content/50">{p.createdAt?.slice(0, 10) || "—"}</td>
									<td>
										<div className="flex items-center justify-end gap-1">
											<Link href={`/travel-plans/${p.id}`} className="btn btn-ghost btn-xs">
												<EyeIcon className="h-4 w-4" />
											</Link>
											<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(p.id)}>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-base-content/50">第 {page}/{totalPages} 页，共 {total} 条</p>
					<div className="join">
						<button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
						<button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
					</div>
				</div>
			)}
		</div>
	);
}
