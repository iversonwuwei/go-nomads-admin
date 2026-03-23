"use client";

import { type CommunityPostDto, deleteCommunityPost, fetchCommunityPosts } from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    FunnelIcon,
    GlobeAltIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
	{ label: "全部类型", value: "" },
	{ label: "帖子", value: "post" },
	{ label: "评论", value: "comment" },
];

export default function CommunityPage() {
	const [posts, setPosts] = useState<CommunityPostDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [type, setType] = useState("");

	useEffect(() => {
		let active = true;
		fetchCommunityPosts({ page, pageSize, search: search || undefined, type: type || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setPosts(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, search, type]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchCommunityPosts({ page, pageSize, search: search || undefined, type: type || undefined });
		if (res.ok && res.data) { setPosts(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此内容？")) return;
		await deleteCommunityPost(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">社区内容</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<GlobeAltIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">社区内容</h1>
					<p className="text-xs text-base-content/50">Community — 共 {total} 条</p>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100 p-4">
				<FunnelIcon className="h-4 w-4 text-base-content/40" />
				<div className="flex flex-1 items-center gap-2 rounded-xl border border-base-300/50 bg-base-100 px-3 py-1.5">
					<MagnifyingGlassIcon className="h-4 w-4 text-base-content/40" />
					<input
						className="w-full bg-transparent text-sm outline-none"
						placeholder="搜索内容/作者…"
						value={search}
						onChange={(e) => { setSearch(e.target.value); setPage(1); }}
					/>
				</div>
				<select className="select select-sm select-bordered" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
					{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
				</select>
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
				<table className="table table-sm">
					<thead>
						<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
							<th>类型</th>
							<th>作者</th>
							<th>内容摘要</th>
							<th>👍</th>
							<th>💬</th>
							<th>城市</th>
							<th>状态</th>
							<th>时间</th>
							<th className="text-right">操作</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={9} className="py-12 text-center text-base-content/30">加载中…</td></tr>
						) : posts.length === 0 ? (
							<tr><td colSpan={9} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
						) : (
							posts.map((p) => (
								<tr key={p.id} className="hover:bg-base-200/50">
									<td>
										<span className={`badge badge-sm ${p.type === "post" ? "badge-primary" : "badge-ghost"}`}>
											{p.type === "post" ? "帖子" : p.type === "comment" ? "评论" : p.type || "—"}
										</span>
									</td>
									<td className="font-medium">{p.authorName || "—"}</td>
									<td className="max-w-xs truncate text-base-content/70">{p.content || "—"}</td>
									<td className="tabular-nums">{p.likeCount ?? 0}</td>
									<td className="tabular-nums">{p.commentCount ?? 0}</td>
									<td className="text-base-content/70">{p.cityName || "—"}</td>
									<td>
										<span className={`badge badge-sm ${p.status === "hidden" ? "badge-warning" : "badge-success"}`}>
											{p.status === "hidden" ? "已隐藏" : "正常"}
										</span>
									</td>
									<td className="text-xs text-base-content/50">{p.createdAt?.slice(0, 10) || "—"}</td>
									<td>
										<div className="flex items-center justify-end gap-1">
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
