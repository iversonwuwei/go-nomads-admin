"use client";

import AdminTable from "@/app/components/admin/admin-table";
import {
	AdminToolbarSlot,
	AdminWorkspace,
	AdminWorkspaceBreadcrumb,
	AdminWorkspaceHero,
	AdminWorkspaceSection,
	AdminWorkspaceToolbar,
} from "@/app/components/admin/system-workspace";
import { UserIdentityLink } from "@/app/components/admin/user-identity-link";
import { deleteTravelPlan, fetchTravelPlans, type TravelPlanDto, updateTravelPlanStatus } from "@/app/lib/admin-api";
import {
    EyeIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
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
	const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
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

	async function handleStatusChange(id: string, nextStatus: "planning" | "confirmed" | "completed") {
		setUpdatingStatusId(id);
		await updateTravelPlanStatus(id, nextStatus);
		await reload();
		setUpdatingStatusId(null);
	}

	return (
		<AdminWorkspace>
			<AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "旅行计划" }]} />
			<AdminWorkspaceHero
				eyebrow="Supply Planning"
				title="旅行计划"
				description="把目的地、用户、预算与状态调整放进同一张运营视图里，保证治理动作和内容供给是连贯的。"
				actions={
					<Link href="/app-control" className="btn btn-primary rounded-2xl">
						返回 App 控制台
					</Link>
				}
				stats={[
					{ label: "Total Plans", value: String(total), hint: "当前筛选范围内的总计划量" },
					{ label: "Current Page", value: `${page}/${totalPages}`, hint: "当前浏览的分页位置" },
					{ label: "Statuses", value: status || "全部", hint: "当前状态过滤条件" },
				]}
			/>

			<AdminWorkspaceSection
				title="筛选与节奏"
				description="先确定检索范围，再进入表格做状态和详情治理，避免把筛选与结果混在一起。"
			>
				<AdminWorkspaceToolbar>
					<AdminToolbarSlot label="搜索" grow>
						<MagnifyingGlassIcon className="admin-toolbar-search-icon h-4 w-4" />
						<input
							placeholder="搜索目的地、城市或用户..."
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</AdminToolbarSlot>
					<AdminToolbarSlot label="状态过滤">
						<FunnelIcon className="admin-toolbar-search-icon h-4 w-4" />
						<select
							value={status}
							onChange={(e) => { setStatus(e.target.value); setPage(1); }}
						>
							{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
					</AdminToolbarSlot>
				</AdminWorkspaceToolbar>
			</AdminWorkspaceSection>

			<AdminWorkspaceSection
				title="计划明细"
				description="统一查看用户、预算、风格与完成度，并直接进行状态流转与详情跳转。"
			>
				<AdminTable
					headers={["目的地", "用户", "天数", "预算", "风格", "完成度", "状态", "创建时间", "操作"]}
					hasRows={!loading && plans.length > 0}
					colSpan={9}
					emptyMessage={loading ? "加载中…" : "暂无旅行计划"}
					meta={
						<>
							<div>
								<span className="admin-table-meta-label">Current Result Set</span>
								<span className="admin-table-meta-value">{plans.length}</span>
							</div>
							<p className="admin-table-meta-copy">列表里的每一行都保留治理动作，不再依赖详情页才能做基础状态调整。</p>
						</>
					}
				>
					{plans.map((p) => (
						<tr key={p.id}>
							<td>
								<div className="admin-entity-copy">
									<span className="admin-entity-title">{p.cityName || p.destination || "—"}</span>
									<span className="admin-entity-subtitle">Plan ID · {p.id.slice(0, 8)}</span>
								</div>
							</td>
							<td>
								<UserIdentityLink userId={p.userId} userName={p.userName} />
							</td>
							<td>{p.days ?? "—"}</td>
							<td>{p.budgetLevel ? <span className="badge badge-sm badge-outline">{p.budgetLevel}</span> : "—"}</td>
							<td>{p.travelStyle ? <span className="badge badge-sm badge-ghost">{p.travelStyle}</span> : "—"}</td>
							<td>
								{p.completionRate != null ? (
									<div className="flex items-center gap-2">
										<progress className="progress progress-primary w-20" value={p.completionRate} max={100} />
										<span className="text-xs tabular-nums">{p.completionRate}%</span>
									</div>
								) : "—"}
							</td>
							<td>
								<div className="space-y-2">
									<StatusBadge status={p.status} />
									<select
										className="select select-bordered select-xs w-full max-w-32"
										value={p.status || "planning"}
										disabled={updatingStatusId === p.id}
										onChange={(event) => handleStatusChange(p.id, event.target.value as "planning" | "confirmed" | "completed")}
									>
										<option value="planning">规划中</option>
										<option value="confirmed">已确认</option>
										<option value="completed">已完成</option>
									</select>
								</div>
							</td>
							<td className="text-xs text-base-content/55">{p.createdAt?.slice(0, 10) || "—"}</td>
							<td>
								<div className="flex items-center justify-end gap-1">
									<Link href={`/travel-plans/${p.id}`} className="btn btn-ghost btn-xs rounded-xl">
										<EyeIcon className="h-4 w-4" />
									</Link>
									<button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(p.id)}>
										<TrashIcon className="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</AdminTable>
			</AdminWorkspaceSection>

			{totalPages > 1 ? (
				<div className="admin-pagination-shell">
					<p className="admin-pagination-copy">第 {page}/{totalPages} 页，共 {total} 条</p>
					<div className="join">
						<button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
						<button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
					</div>
				</div>
			) : null}
		</AdminWorkspace>
	);
}
