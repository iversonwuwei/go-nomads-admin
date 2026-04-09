"use client";
import {
	ArrowPathIcon,
	CheckCircleIcon,
	CloudArrowUpIcon,
	DevicePhoneMobileIcon,
	HomeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	type ConfigSnapshotDto,
	fetchConfigSnapshots,
	publishConfig,
	rollbackConfig,
} from "@/app/lib/admin-api";

function formatTime(iso?: string) {
	if (!iso) return "—";
	try {
		return new Date(iso).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
	} catch {
		return iso;
	}
}

export default function ConfigPublishPage() {
	const [snapshots, setSnapshots] = useState<ConfigSnapshotDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [publishing, setPublishing] = useState(false);
	const [rollingBack, setRollingBack] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const res = await fetchConfigSnapshots({ page, pageSize });
		if (res.ok && res.data) {
			setSnapshots(res.data.items);
			setTotal(res.data.totalCount);
		}
		setLoading(false);
	}, [page, pageSize]);

	useEffect(() => { load(); }, [load]);

	async function handlePublish() {
		if (!confirm("确定要发布当前配置快照？发布后 App 端将获取最新配置。")) return;
		setPublishing(true);
		const res = await publishConfig();
		setPublishing(false);
		if (res.ok) {
			await load();
		} else {
			alert(res.message || "发布失败");
		}
	}

	async function handleRollback(id: string) {
		if (!confirm("确定要回滚到此版本？当前已发布的配置将被替换。")) return;
		setRollingBack(id);
		const res = await rollbackConfig(id);
		setRollingBack(null);
		if (res.ok) {
			await load();
		} else {
			alert(res.message || "回滚失败");
		}
	}

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="space-y-6">
			{/* 面包屑 */}
			<div className="text-sm breadcrumbs">
				<ul>
					<li>
						<Link href="/dashboard" className="gap-1 inline-flex items-center">
							<HomeIcon className="h-4 w-4" /> 首页
						</Link>
					</li>
					<li>
						<Link href="/app-control" className="gap-1 inline-flex items-center">
							<DevicePhoneMobileIcon className="h-4 w-4" /> App 控制台
						</Link>
					</li>
					<li>配置发布</li>
				</ul>
			</div>

			{/* 标题 + 发布按钮 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
						<CloudArrowUpIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-bold">配置发布</h1>
						<p className="text-xs text-base-content/50">Config Publish · 快照历史 {total} 条</p>
					</div>
				</div>
				<button
					type="button"
					className="btn btn-primary btn-sm gap-1"
					disabled={publishing}
					onClick={handlePublish}
				>
					{publishing ? <span className="loading loading-spinner loading-xs" /> : <CloudArrowUpIcon className="h-4 w-4" />}
					发布新版本
				</button>
			</div>

			{/* 说明卡片 */}
			<div className="alert">
				<div>
					<p className="text-sm">点击「发布新版本」将把当前所有静态文本和选项组打包为一个快照。App 端通过公开接口获取已发布配置。</p>
				</div>
			</div>

			{/* 快照列表 */}
			{loading ? (
				<div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>
			) : snapshots.length === 0 ? (
				<div className="text-center text-base-content/40 py-12">暂无快照记录，请先发布第一个版本</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-base-200">
					<table className="table table-sm">
						<thead>
							<tr className="bg-base-200/40">
								<th>版本</th>
								<th>状态</th>
								<th>发布者</th>
								<th>发布时间</th>
								<th>创建时间</th>
								<th className="text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{snapshots.map((s) => (
								<tr key={s.id} className={s.isPublished ? "bg-success/5" : ""}>
									<td className="font-mono text-sm font-semibold">{s.version || "—"}</td>
									<td>
										{s.isPublished ? (
											<span className="badge badge-success gap-1 badge-sm">
												<CheckCircleIcon className="h-3 w-3" /> 已发布
											</span>
										) : (
											<span className="badge badge-ghost badge-sm">历史</span>
										)}
									</td>
									<td className="text-xs">{s.publishedBy || "—"}</td>
									<td className="text-xs">{formatTime(s.publishedAt)}</td>
									<td className="text-xs">{formatTime(s.createdAt)}</td>
									<td className="text-right">
										{!s.isPublished && (
											<button
												type="button"
												className="btn btn-outline btn-xs gap-1"
												disabled={rollingBack === s.id}
												onClick={() => handleRollback(s.id)}
											>
												{rollingBack === s.id
													? <span className="loading loading-spinner loading-xs" />
													: <ArrowPathIcon className="h-3 w-3" />}
												回滚到此版本
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* 分页 */}
			{totalPages > 1 && (
				<div className="flex justify-center">
					<div className="join">
						<button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>«</button>
						<button type="button" className="join-item btn btn-sm">第 {page} / {totalPages} 页</button>
						<button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>»</button>
					</div>
				</div>
			)}
		</div>
	);
}
