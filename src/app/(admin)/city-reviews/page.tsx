"use client";
import {
	ArrowUpTrayIcon,
	ChevronRightIcon,
	FunnelIcon,
	HomeIcon,
	MapPinIcon,
	StarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { type CityReviewDto, fetchCityReviews } from "@/app/lib/admin-api";

function StarRow({ score }: { score?: number }) {
	if (!score) return <span className="text-base-content/30">—</span>;
	return (
		<div className="flex items-center gap-1">
			{[1, 2, 3, 4, 5].map((s) => (
				<StarIcon
					key={s}
					className={`h-3 w-3 ${s <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-base-content/20"}`}
				/>
			))}
			<span className="ml-1 text-xs font-semibold text-base-content">
				{score.toFixed(1)}
			</span>
		</div>
	);
}

export default function CityReviewsPage() {
	const [reviews, setReviews] = useState<CityReviewDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [minRating, setMinRating] = useState("");

	const loadData = useCallback(async () => {
		setLoading(true);
		const res = await fetchCityReviews({
			page,
			pageSize,
			minRating: minRating ? Number(minRating) : undefined,
		});
		if (res.ok && res.data) {
			setReviews(res.data.items);
			setTotal(res.data.totalCount);
		}
		setLoading(false);
	}, [page, pageSize, minRating]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="min-h-screen bg-base-100">
			{/* Header */}
			<div className="border-b border-base-300 bg-base-100 px-4 pt-4 pb-3 md:px-6">
				<div className="flex items-center gap-1 text-sm text-base-content/50 mb-2">
					<HomeIcon className="h-3.5 w-3.5" />
					<Link href="/dashboard" className="hover:text-base-content">
						首页
					</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<span className="text-base-content">城市评论审核</span>
				</div>
				<h1 className="text-lg font-semibold text-base-content">
					城市评论审核
				</h1>
				<p className="text-sm text-base-content/50 mt-0.5">共 {total} 条评论</p>
			</div>

			<div className="p-4 md:p-6 space-y-4">
				{/* Filter */}
				<div className="rounded-xl border border-base-300 bg-base-100 p-4">
					<div className="flex items-center gap-2 mb-3">
						<FunnelIcon className="h-4 w-4 text-base-content/40" />
						<span className="text-sm font-medium text-base-content/60">
							筛选条件
						</span>
					</div>
					<div className="flex flex-wrap items-end gap-2">
						<select
							value={minRating}
							onChange={(e) => {
								setMinRating(e.target.value);
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-32"
						>
							<option value="">评分不限</option>
							{[5, 4, 3, 2, 1].map((r) => (
								<option key={r} value={String(r)}>
									{r}星及以上
								</option>
							))}
						</select>
						<button
							type="button"
							onClick={() => {
								setPage(1);
								loadData();
							}}
							className="btn btn-primary btn-sm h-9 px-4"
						>
							应用筛选
						</button>
						<button
							type="button"
							onClick={() => {
								setMinRating("");
								setPage(1);
								loadData();
							}}
							className="btn btn-ghost btn-sm h-9"
						>
							重置
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="rounded-xl border border-base-200 bg-base-100 overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center h-48">
							<span className="loading loading-spinner loading-lg text-primary" />
						</div>
					) : reviews.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-48 gap-2">
							<MapPinIcon className="h-12 w-12 text-base-content/20" />
							<p className="text-base-content/40 text-sm">暂无城市评论数据</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr className="border-b border-base-200 bg-base-50 text-xs text-base-content/60 uppercase tracking-wide">
										<th className="w-8 font-semibold">#</th>
										<th>用户</th>
										<th>城市</th>
										<th>评分</th>
										<th>标题</th>
										<th>内容摘要</th>
										<th>旅行类型</th>
										<th>停留时长</th>
										<th className="text-center">
											<ArrowUpTrayIcon className="h-3.5 w-3.5 mx-auto" />
										</th>
										<th>时间</th>
									</tr>
								</thead>
								<tbody>
									{reviews.map((review, idx) => (
										<tr
											key={review.id}
											className="border-b border-base-100 hover:bg-base-50 transition-colors"
										>
											<td className="text-base-content/40 text-xs">
												{(page - 1) * pageSize + idx + 1}
											</td>
											<td>
												<div className="flex items-center gap-2">
													{review.userAvatar ? (
														<div className="relative h-7 w-7 rounded-full overflow-hidden border border-base-200 flex-shrink-0">
															<Image
																src={review.userAvatar}
																alt=""
																fill
																className="object-cover"
															/>
														</div>
													) : (
														<div className="h-7 w-7 rounded-full bg-base-200 flex-shrink-0" />
													)}
													<span className="text-sm font-medium text-base-content truncate max-w-24">
														{review.userName || "匿名用户"}
													</span>
												</div>
											</td>
											<td>
												<span className="text-sm text-base-content flex items-center gap-1">
													<MapPinIcon className="h-3 w-3 text-base-content/40 flex-shrink-0" />
													{review.cityName || "—"}
												</span>
											</td>
											<td>
												<StarRow score={review.overallScore} />
											</td>
											<td>
												<span className="text-sm text-base-content truncate max-w-32 block">
													{review.title || "—"}
												</span>
											</td>
											<td>
												<span className="text-sm text-base-content/60 truncate max-w-48 block">
													{review.content || "—"}
												</span>
											</td>
											<td>
												<span className="badge badge-ghost badge-sm">
													{review.travelType || "—"}
												</span>
											</td>
											<td>
												<span className="text-sm text-base-content/60">
													{review.stayDuration || "—"}
												</span>
											</td>
											<td className="text-center">
												<span className="text-sm text-base-content/40">
													{review.helpfulCount ?? 0}
												</span>
											</td>
											<td>
												<span className="text-xs text-base-content/30 whitespace-nowrap">
													{review.createdAt
														? review.createdAt
																.replace("T", " ")
																.substring(0, 16)
														: "—"}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{!loading && reviews.length > 0 && (
						<div className="flex items-center justify-between px-4 py-3 border-t border-base-200">
							<p className="text-sm text-base-content/50">
								显示 {(page - 1) * pageSize + 1}–
								{Math.min(page * pageSize, total)}，共 {total} 条
							</p>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="btn btn-ghost btn-sm"
								>
									上一页
								</button>
								{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
									const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
									return (
										<button
											type="button"
											key={p}
											onClick={() => setPage(p)}
											className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
										>
											{p}
										</button>
									);
								})}
								<button
									type="button"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages || totalPages === 0}
									className="btn btn-ghost btn-sm"
								>
									下一页
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
