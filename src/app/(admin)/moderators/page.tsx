"use client";

import {
    approveModeratorApplication,
    fetchModeratorApplications,
    fetchModerators,
    type ModeratorApplicationDto,
    type ModeratorDto,
    rejectModeratorApplication,
    removeModerator,
} from "@/app/lib/admin-api";
import {
    CheckCircleIcon,
    ChevronRightIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

type TabKey = "moderators" | "applications";

function StatusBadge({ status }: { status?: string }) {
	const map: Record<string, string> = {
		pending: "badge-warning",
		approved: "badge-success",
		rejected: "badge-error",
	};
	return (
		<span className={`badge badge-sm ${map[status ?? ""] ?? "badge-ghost"}`}>
			{status || "—"}
		</span>
	);
}

export default function ModeratorsPage() {
	const [tab, setTab] = useState<TabKey>("moderators");
	const [moderators, setModerators] = useState<ModeratorDto[]>([]);
	const [applications, setApplications] = useState<ModeratorApplicationDto[]>([]);
	const [modTotal, setModTotal] = useState(0);
	const [appTotal, setAppTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [appStatus, setAppStatus] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		const promise = tab === "moderators"
			? fetchModerators({ page, pageSize, search: search || undefined })
			: fetchModeratorApplications({ page, pageSize, status: appStatus || undefined });
		promise.then((res) => {
			if (!active) return;
			if (res.ok && res.data) {
				if (tab === "moderators") { setModerators(res.data.items); setModTotal(res.data.totalCount); }
				else { setApplications(res.data.items); setAppTotal(res.data.totalCount); }
			}
			setLoading(false);
		});
		return () => { active = false; };
	}, [tab, page, pageSize, search, appStatus]);

	const total = tab === "moderators" ? modTotal : appTotal;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const promise = tab === "moderators"
			? fetchModerators({ page, pageSize, search: search || undefined })
			: fetchModeratorApplications({ page, pageSize, status: appStatus || undefined });
		const res = await promise;
		if (res.ok && res.data) {
			if (tab === "moderators") { setModerators(res.data.items); setModTotal(res.data.totalCount); }
			else { setApplications(res.data.items); setAppTotal(res.data.totalCount); }
		}
		setLoading(false);
	}

	async function handleRemove(cityId: string) {
		if (!confirm("确定移除此版主？")) return;
		await removeModerator(cityId);
		await reload();
	}

	async function handleApprove(id: string) {
		await approveModeratorApplication(id);
		await reload();
	}

	async function handleReject(id: string) {
		if (!confirm("确定拒绝此申请？")) return;
		await rejectModeratorApplication(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">版主管理</span>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<UsersIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold">版主管理</h1>
						<p className="text-xs text-base-content/50">Moderators</p>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-2xl border border-base-300/60 bg-base-100 p-1">
				<button
					type="button"
					onClick={() => { setTab("moderators"); setPage(1); }}
					className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === "moderators" ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content/70"}`}
				>
					版主列表 ({modTotal})
				</button>
				<button
					type="button"
					onClick={() => { setTab("applications"); setPage(1); }}
					className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === "applications" ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content/70"}`}
				>
					申请审批 ({appTotal})
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4">
				{tab === "moderators" ? (
					<div className="flex flex-1 items-center gap-2 rounded-xl border border-base-300/50 bg-base-100 px-3 py-1.5">
						<MagnifyingGlassIcon className="h-4 w-4 text-base-content/40" />
						<input
							className="w-full bg-transparent text-sm outline-none"
							placeholder="搜索版主…"
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</div>
				) : (
					<select
						className="select select-sm select-bordered"
						value={appStatus}
						onChange={(e) => { setAppStatus(e.target.value); setPage(1); }}
					>
						<option value="">全部状态</option>
						<option value="pending">待审核</option>
						<option value="approved">已通过</option>
						<option value="rejected">已拒绝</option>
					</select>
				)}
			</div>

			{/* Moderators Table */}
			{tab === "moderators" && (
				<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
					<table className="table table-sm">
						<thead>
							<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
								<th>用户</th>
								<th>城市</th>
								<th>国家</th>
								<th>访问国家/城市</th>
								<th>最近旅行</th>
								<th>加入时间</th>
								<th className="text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={7} className="py-12 text-center text-base-content/30">加载中…</td></tr>
							) : moderators.length === 0 ? (
								<tr><td colSpan={7} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
							) : (
								moderators.map((m) => (
									<tr key={m.id} className="hover:bg-base-200/50">
										<td>
											<div className="flex items-center gap-2">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
													{(m.userName || "?")[0]}
												</div>
												<span className="font-medium">{m.userName || "—"}</span>
											</div>
										</td>
										<td>{m.cityName || "—"}</td>
										<td>{m.country || "—"}</td>
										<td className="tabular-nums">
											{m.visitedCountries ?? 0} / {m.visitedCities ?? 0}
										</td>
										<td className="text-base-content/70">{m.latestTravel || "—"}</td>
										<td className="text-xs text-base-content/50">{m.joinedAt?.slice(0, 10) || "—"}</td>
										<td className="text-right">
											<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => m.cityId && handleRemove(m.cityId)}>
												移除
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Applications Table */}
			{tab === "applications" && (
				<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
					<table className="table table-sm">
						<thead>
							<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
								<th>申请人</th>
								<th>城市</th>
								<th>理由</th>
								<th>旅行统计</th>
								<th>最近旅行</th>
								<th>状态</th>
								<th>时间</th>
								<th className="text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={8} className="py-12 text-center text-base-content/30">加载中…</td></tr>
							) : applications.length === 0 ? (
								<tr><td colSpan={8} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
							) : (
								applications.map((a) => (
									<tr key={a.id} className="hover:bg-base-200/50">
										<td className="font-medium">{a.userName || "—"}</td>
										<td>{a.cityName || "—"}</td>
										<td className="max-w-48 truncate text-base-content/70">{a.reason || "—"}</td>
										<td className="tabular-nums text-xs">
											{a.visitedCountries ?? 0} 国 / {a.visitedCities ?? 0} 城 / {a.travelDays ?? 0} 天
										</td>
										<td className="text-base-content/70">{a.latestTravel || "—"}</td>
										<td><StatusBadge status={a.status} /></td>
										<td className="text-xs text-base-content/50">{a.createdAt?.slice(0, 10) || "—"}</td>
										<td>
											<div className="flex items-center justify-end gap-1">
												{a.status === "pending" && (
													<>
														<button type="button" className="btn btn-ghost btn-xs text-success" onClick={() => handleApprove(a.id)}>
															<CheckCircleIcon className="h-4 w-4" />
														</button>
														<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleReject(a.id)}>
															<XCircleIcon className="h-4 w-4" />
														</button>
													</>
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}

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
