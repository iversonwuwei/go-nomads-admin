"use client";

import { fetchLegalDocuments, type LegalDocumentDto } from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    DocumentTextIcon,
    EyeIcon,
    HomeIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LegalPage() {
	const [allDocs, setAllDocs] = useState<LegalDocumentDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => {
		let active = true;
		fetchLegalDocuments().then((res) => {
			if (!active) return;
			if (res.ok && res.data) setAllDocs(res.data);
			setLoading(false);
		});
		return () => { active = false; };
	}, []);

	const docs = allDocs.filter((d) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return (d.slug?.toLowerCase().includes(q) || d.title?.toLowerCase().includes(q));
	});
	const total = docs.length;

	const statusBadge = (s: string | null | undefined) => {
		if (s === "published") return "badge-success";
		if (s === "draft") return "badge-warning";
		return "badge-ghost";
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">法律文档</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<DocumentTextIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">法律文档</h1>
					<p className="text-xs text-base-content/50">Legal Documents — 共 {total} 篇</p>
				</div>
			</div>

			<div className="flex items-center gap-2 rounded-2xl border border-base-300/60 bg-base-100 px-4 py-3">
				<MagnifyingGlassIcon className="h-4 w-4 text-base-content/40" />
				<input
					className="w-full bg-transparent text-sm outline-none"
					placeholder="搜索标题 / slug…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="overflow-x-auto rounded-2xl border border-base-300/60 bg-base-100">
				<table className="table table-sm">
					<thead>
						<tr className="border-b border-base-300/50 text-xs uppercase tracking-wider text-base-content/50">
							<th>Slug</th>
							<th>标题</th>
							<th>语言</th>
							<th>版本</th>
							<th>状态</th>
							<th>发布时间</th>
							<th className="text-right">操作</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={7} className="py-12 text-center text-base-content/30">加载中…</td></tr>
						) : docs.length === 0 ? (
							<tr><td colSpan={7} className="py-12 text-center text-base-content/30">暂无数据</td></tr>
						) : (
							docs.map((d) => (
								<tr key={d.id} className="hover:bg-base-200/50">
									<td className="font-mono text-xs">{d.slug}</td>
									<td className="font-medium">{d.title || "—"}</td>
									<td>
										<span className="badge badge-sm badge-outline">{d.language || "—"}</span>
									</td>
									<td className="tabular-nums">{d.version ?? "—"}</td>
									<td>
										<span className={`badge badge-sm ${statusBadge(d.status)}`}>{d.status || "—"}</span>
									</td>
									<td className="text-xs text-base-content/50">{d.publishedAt?.slice(0, 10) || "—"}</td>
									<td className="text-right">
										<button type="button" className="btn btn-ghost btn-xs">
											<EyeIcon className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

		</div>
	);
}
