"use client";

import {
    deleteProsConsItem,
    fetchProsCons,
    hideProsConsItem,
    type ProsConsDto,
} from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    EyeSlashIcon,
    FunnelIcon,
    HandThumbUpIcon,
    HomeIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
	{ label: "全部类型", value: "" },
	{ label: "Pros", value: "pro" },
	{ label: "Cons", value: "con" },
];

const STATUS_OPTIONS = [
	{ label: "全部状态", value: "" },
	{ label: "正常", value: "active" },
	{ label: "已隐藏", value: "hidden" },
];

function TypeBadge({ type }: { type?: string }) {
	if (type === "pro") return <span className="badge badge-sm badge-success">Pro</span>;
	if (type === "con") return <span className="badge badge-sm badge-error">Con</span>;
	return <span className="badge badge-sm badge-ghost">{type || "—"}</span>;
}

export default function ProsConsPage() {
	const [items, setItems] = useState<ProsConsDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [type, setType] = useState("");
	const [status, setStatus] = useState("");

	useEffect(() => {
		let active = true;
		fetchProsCons({ page, pageSize, type: type || undefined, status: status || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setItems(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, type, status]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchProsCons({ page, pageSize, type: type || undefined, status: status || undefined });
		if (res.ok && res.data) { setItems(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleHide(id: string) {
		await hideProsConsItem(id);
		await reload();
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除？")) return;
		await deleteProsConsItem(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">优缺点审核</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<HandThumbUpIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">优缺点审核</h1>
					<p className="text-xs text-base-content/50">Pros & Cons — 共 {total} 条</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4">
				<FunnelIcon className="h-4 w-4 text-base-content/40" />
				<select className="select select-sm select-bordered" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
					{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
				<select className="select select-sm select-bordered" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
					{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
				<table className="table table-sm">
					<thead>
						<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
							<th>内容</th>
							<th>类型</th>
							<th>用户</th>
							<th>城市</th>
							<th>👍 / 👎</th>
							<th>状态</th>
							<th>时间</th>
							<th className="text-right">操作</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={8} className="py-12 text-center text-base-content/30">加载中…</td></tr>
						) : items.length === 0 ? (
							<tr><td colSpan={8} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
						) : (
							items.map((item) => (
								<tr key={item.id} className="hover:bg-base-200/50">
									<td className="max-w-xs truncate">{item.content || "—"}</td>
									<td><TypeBadge type={item.type} /></td>
									<td className="text-base-content/70">{item.userName || "—"}</td>
									<td className="text-base-content/70">{item.cityName || "—"}</td>
									<td className="tabular-nums">{item.likes ?? 0} / {item.dislikes ?? 0}</td>
									<td>
										<span className={`badge badge-sm ${item.status === "hidden" ? "badge-warning" : "badge-success"}`}>
											{item.status === "hidden" ? "已隐藏" : "正常"}
										</span>
									</td>
									<td className="text-xs text-base-content/50">{item.createdAt?.slice(0, 10) || "—"}</td>
									<td>
										<div className="flex items-center justify-end gap-1">
											{item.status !== "hidden" && (
												<button type="button" className="btn btn-ghost btn-xs" onClick={() => handleHide(item.id)}>
													<EyeSlashIcon className="h-4 w-4" />
												</button>
											)}
											<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(item.id)}>
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
