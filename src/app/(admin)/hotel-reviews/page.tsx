"use client";
import {
	ChevronRightIcon,
	FunnelIcon,
	HomeIcon,
	StarIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchHotelReviews, type HotelReviewDto } from "@/app/lib/admin-api";

const SORT_OPTIONS = [
	{ label: "最新", value: "newest" },
	{ label: "最早", value: "oldest" },
	{ label: "评分最高", value: "highest" },
	{ label: "评分最低", value: "lowest" },
	{ label: "最有帮助", value: "helpful" },
];

function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((s) => (
				<StarIcon
					key={s}
					className={`h-3.5 w-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-base-content/20"}`}
				/>
			))}
			<span className="ml-1 text-xs font-semibold text-base-content">
				{rating}
			</span>
		</div>
	);
}

function ReviewCard({ review }: { review: HotelReviewDto }) {
	return (
		<div className="rounded-xl border border-base-200 bg-base-100 p-4 space-y-3 hover:shadow-sm transition-shadow">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-2">
					{review.userAvatar ? (
						<div className="relative h-8 w-8 rounded-full overflow-hidden border border-base-200">
							<Image
								src={review.userAvatar}
								alt={review.userName || ""}
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<UserCircleIcon className="h-8 w-8 text-base-content/30" />
					)}
					<div>
						<p className="text-sm font-medium text-base-content">
							{review.userName || "匿名用户"}
						</p>
						{review.hotelName && (
							<Link
								href={`/hotels/${review.hotelId}`}
								className="text-xs text-primary hover:underline"
							>
								{review.hotelName}
							</Link>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{review.isVerified && (
						<span className="badge badge-success badge-sm">已验证</span>
					)}
					{review.helpfulCount !== undefined && review.helpfulCount > 0 && (
						<span className="text-xs text-base-content/40">
							{review.helpfulCount} 有用
						</span>
					)}
				</div>
			</div>

			{/* Rating */}
			{review.rating && <StarRating rating={review.rating} />}

			{/* Title */}
			{review.title && (
				<p className="text-sm font-semibold text-base-content">
					{review.title}
				</p>
			)}

			{/* Content */}
			<p className="text-sm text-base-content/70 leading-relaxed">
				{review.content || "—"}
			</p>

			{/* Photos */}
			{review.photoUrls && review.photoUrls.length > 0 && (
				<div className="flex gap-2 overflow-x-auto">
					{review.photoUrls.map((url, i) => (
						<div
							key={url}
							className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border border-base-200"
						>
							<Image
								src={url}
								alt={`Photo ${i + 1}`}
								fill
								className="object-cover"
							/>
						</div>
					))}
				</div>
			)}

			{/* Footer */}
			<div className="flex items-center justify-between pt-1 border-t border-base-100">
				<div className="flex items-center gap-2 text-xs text-base-content/40">
					{review.visitDate && <span>入住: {review.visitDate}</span>}
				</div>
				<span className="text-xs text-base-content/30">
					{review.createdAt
						? review.createdAt.replace("T", " ").substring(0, 16)
						: ""}
				</span>
			</div>
		</div>
	);
}

export default function HotelReviewsPage() {
	const [reviews, setReviews] = useState<HotelReviewDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [sortBy, setSortBy] = useState("newest");
	const [minRating, setMinRating] = useState("");

	const loadData = useCallback(async () => {
		setLoading(true);
		const res = await fetchHotelReviews({
			page,
			pageSize,
			sortBy,
			minRating: minRating ? Number(minRating) : undefined,
		});
		if (res.ok && res.data) {
			setReviews(res.data.items);
			setTotal(res.data.totalCount);
		}
		setLoading(false);
	}, [page, pageSize, sortBy, minRating]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="min-h-screen bg-base-100">
			{/* ── Header ────────────────────────────── */}
			<div className="border-b border-base-300 bg-base-100 px-4 pt-4 pb-3 md:px-6">
				<div className="flex items-center gap-1 text-sm text-base-content/50 mb-2">
					<HomeIcon className="h-3.5 w-3.5" />
					<Link href="/dashboard" className="hover:text-base-content">
						首页
					</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<span className="text-base-content">酒店评论审核</span>
				</div>
				<div>
					<h1 className="text-lg font-semibold text-base-content">
						酒店评论审核
					</h1>
					<p className="text-sm text-base-content/50 mt-0.5">
						共 {total} 条评论
					</p>
				</div>
			</div>

			<div className="p-4 md:p-6 space-y-4">
				{/* ── Filter Bar ─────────────────────── */}
				<div className="rounded-xl border border-base-300 bg-base-100 p-4">
					<div className="flex items-center gap-2 mb-3">
						<FunnelIcon className="h-4 w-4 text-base-content/40" />
						<span className="text-sm font-medium text-base-content/60">
							筛选条件
						</span>
					</div>
					<div className="flex flex-wrap items-end gap-2">
						<select
							value={sortBy}
							onChange={(e) => {
								setSortBy(e.target.value);
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-32"
						>
							{SORT_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						<select
							value={minRating}
							onChange={(e) => {
								setMinRating(e.target.value);
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-28"
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
								setSortBy("newest");
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

				{/* ── Review List ──────────────────── */}
				{loading ? (
					<div className="flex items-center justify-center h-48">
						<span className="loading loading-spinner loading-lg text-primary" />
					</div>
				) : reviews.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-48 rounded-xl border border-base-200 bg-base-50 gap-2">
						<StarIcon className="h-12 w-12 text-base-content/20" />
						<p className="text-base-content/40 text-sm">暂无评论数据</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
						{reviews.map((review) => (
							<ReviewCard key={review.id} review={review} />
						))}
					</div>
				)}

				{/* ── Pagination ──────────────────── */}
				{!loading && reviews.length > 0 && (
					<div className="flex items-center justify-between px-4 py-3 rounded-xl border border-base-200 bg-base-100">
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
	);
}
