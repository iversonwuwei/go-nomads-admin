"use client";

import {
    createNotification,
    deleteNotification,
    fetchNotifications,
    type NotificationDto,
} from "@/app/lib/admin-api";
import {
    BellIcon,
    ChevronRightIcon,
    FunnelIcon,
    HomeIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_OPTIONS = [
	{ label: "全部状态", value: "" },
	{ label: "已发送", value: "sent" },
	{ label: "待发送", value: "pending" },
	{ label: "草稿", value: "draft" },
];

const TYPE_OPTIONS = [
	{ label: "系统通知", value: "system" },
	{ label: "活动提醒", value: "event" },
	{ label: "系统公告", value: "announcement" },
];

const SCOPE_OPTIONS = [
	{ label: "全部用户", value: "all" },
	{ label: "指定用户", value: "specific_users" },
	{ label: "指定城市用户", value: "city_users" },
];

function StatusBadge({ status }: { status?: string }) {
	const map: Record<string, string> = {
		sent: "badge-success",
		pending: "badge-warning",
		draft: "badge-ghost",
	};
	const labels: Record<string, string> = {
		sent: "已发送",
		pending: "待发送",
		draft: "草稿",
	};
	return (
		<span className={`badge badge-sm ${map[status ?? ""] ?? "badge-ghost"}`}>
			{labels[status ?? ""] ?? status ?? "—"}
		</span>
	);
}

export default function NotificationsPage() {
	const [items, setItems] = useState<NotificationDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [statusFilter, setStatusFilter] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [formType, setFormType] = useState("system");
	const [formTitle, setFormTitle] = useState("");
	const [formContent, setFormContent] = useState("");
	const [formScope, setFormScope] = useState("all");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let active = true;
		fetchNotifications({ page, pageSize, status: statusFilter || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setItems(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchNotifications({ page, pageSize, status: statusFilter || undefined });
		if (res.ok && res.data) { setItems(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleCreate() {
		if (!formTitle.trim()) return;
		setSaving(true);
		await createNotification({
			type: formType,
			title: formTitle,
			content: formContent,
			scope: formScope,
		});
		setSaving(false);
		setShowForm(false);
		setFormTitle("");
		setFormContent("");
		await reload();
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此通知？")) return;
		await deleteNotification(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">通知推送</span>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<BellIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold">通知推送</h1>
						<p className="text-xs text-base-content/50">Notifications — 共 {total} 条</p>
					</div>
				</div>
				<button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
					<PlusIcon className="h-4 w-4" /> 新建通知
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4">
				<FunnelIcon className="h-4 w-4 text-base-content/40" />
				<select className="select select-sm select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
					{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
				<table className="table table-sm">
					<thead>
						<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
							<th>类型</th>
							<th>标题</th>
							<th>内容摘要</th>
							<th>发送范围</th>
							<th>送达/阅读</th>
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
							items.map((n) => (
								<tr key={n.id} className="hover:bg-base-200/50">
									<td>
										<span className="badge badge-sm badge-outline">{n.type || "—"}</span>
									</td>
									<td className="font-medium">{n.title || "—"}</td>
									<td className="max-w-xs truncate text-base-content/70">{n.content || "—"}</td>
									<td className="text-xs">{n.scope || "—"}</td>
									<td className="tabular-nums text-xs">{n.deliveredCount ?? 0} / {n.readCount ?? 0}</td>
									<td><StatusBadge status={n.status} /></td>
									<td className="text-xs text-base-content/50">{(n.sentAt || n.createdAt)?.slice(0, 10) || "—"}</td>
									<td className="text-right">
										<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(n.id)}>
											<TrashIcon className="h-4 w-4" />
										</button>
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

			{/* Create Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
					<div className="w-full max-w-lg rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-xl">
						<h3 className="text-lg font-bold">新建通知</h3>
						<div className="mt-4 space-y-3">
							<label className="form-control w-full">
								<div className="label"><span className="label-text">通知类型</span></div>
								<select className="select select-bordered w-full" value={formType} onChange={(e) => setFormType(e.target.value)}>
									{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
								</select>
							</label>
							<label className="form-control w-full">
								<div className="label"><span className="label-text">标题</span></div>
								<input className="input input-bordered w-full" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="通知标题" />
							</label>
							<label className="form-control w-full">
								<div className="label"><span className="label-text">内容</span></div>
								<textarea className="textarea textarea-bordered w-full" rows={4} value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="通知内容…" />
							</label>
							<label className="form-control w-full">
								<div className="label"><span className="label-text">发送范围</span></div>
								<select className="select select-bordered w-full" value={formScope} onChange={(e) => setFormScope(e.target.value)}>
									{SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
								</select>
							</label>
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
							<button type="button" className="btn btn-primary btn-sm" disabled={saving || !formTitle.trim()} onClick={handleCreate}>
								{saving ? "发送中…" : "发送"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
