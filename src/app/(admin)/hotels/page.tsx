"use client";
import {
	BuildingOfficeIcon,
	ChevronRightIcon,
	FunnelIcon,
	HomeIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	fetchCities,
	fetchHotels,
	type HotelAdminDto,
} from "@/app/lib/admin-api";

const CATEGORY_OPTIONS = [
	{ label: "全部", value: "" },
	{ label: "Luxury", value: "luxury" },
	{ label: "Budget", value: "budget" },
	{ label: "Hostel", value: "hostel" },
	{ label: "Boutique", value: "boutique" },
	{ label: "Resort", value: "resort" },
];

const SOURCE_OPTIONS = [
	{ label: "全部来源", value: "" },
	{ label: "社区用户", value: "community" },
	{ label: "Booking.com", value: "booking" },
];

function StatusBadge({ source }: { source?: string }) {
	if (source === "booking") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-100">
				Booking
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-100">
			社区
		</span>
	);
}

function NomadBadge({ hotel }: { hotel: HotelAdminDto }) {
	const traits: string[] = [];
	if (hotel.hasWifi) traits.push("WiFi");
	if (hotel.wifiSpeed && hotel.wifiSpeed >= 50) traits.push("WiFi≥50M");
	if (hotel.hasWorkDesk) traits.push("工位");
	if (hotel.hasCoworkingSpace) traits.push("共享办公");
	if (hotel.hasAirConditioning) traits.push("空调");
	if (hotel.hasKitchen) traits.push("厨房");
	if (hotel.has24HReception) traits.push("24h前台");
	if (hotel.hasLongStayDiscount) traits.push("长住折扣");
	if (traits.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-1">
			{traits.slice(0, 4).map((t) => (
				<span
					key={t}
					className="inline-flex items-center rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600"
				>
					{t}
				</span>
			))}
		</div>
	);
}

export default function HotelsPage() {
	const [hotels, setHotels] = useState<HotelAdminDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [source, setSource] = useState("");
	const [hasWifi, setHasWifi] = useState<"" | "true" | "false">("");
	const [_cityOptions, setCityOptions] = useState<
		{ label: string; value: string }[]
	>([]);

	const loadData = useCallback(async () => {
		setLoading(true);
		const res = await fetchHotels({
			page,
			pageSize,
			search: search || undefined,
			category: category || undefined,
			hasWifi:
				hasWifi === "true" ? true : hasWifi === "false" ? false : undefined,
		});
		if (res.ok && res.data) {
			setHotels(res.data.items);
			setTotal(res.data.totalCount);
			// Filter by source client-side since backend may not support it
			if (source) {
				setHotels(
					(res.data.items as HotelAdminDto[]).filter(
						(h) => h.source === source,
					),
				);
			}
		}
		setLoading(false);
	}, [page, pageSize, search, category, hasWifi, source]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Load city options
	useEffect(() => {
		fetchCities({ page: 1, pageSize: 100 }).then((res) => {
			if (res.ok && res.data) {
				setCityOptions([
					{ label: "全部城市", value: "" },
					...res.data.items.map((c) => ({
						label: c.name || c.id,
						value: c.id,
					})),
				]);
			}
		});
	}, []);

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="min-h-screen bg-base-100">
			{/* ── Header ────────────────────────────── */}
			<div className="border-b border-base-300 bg-base-100 px-4 pt-4 pb-3 md:px-6">
				<div className="flex items-center gap-1 text-sm text-base-content/50 mb-2">
					<HomeIcon className="h-3.5 w-3.5" />
					<Link
						href="/dashboard"
						className="hover:text-base-content transition-colors"
					>
						首页
					</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<span className="text-base-content">酒店管理</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-base-content">
							酒店管理
						</h1>
						<p className="text-sm text-base-content/50 mt-0.5">
							共 {total} 家酒店
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href="/hotels/create"
							className="btn btn-primary btn-sm gap-1"
						>
							<PlusIcon className="h-4 w-4" />
							创建酒店
						</Link>
					</div>
				</div>
			</div>

			<div className="p-4 md:p-6 space-y-4">
				{/* ── Filter Bar ───────────────────────── */}
				<div className="rounded-xl border border-base-300 bg-base-100 p-4">
					<div className="flex items-center gap-2 mb-3">
						<FunnelIcon className="h-4 w-4 text-base-content/40" />
						<span className="text-sm font-medium text-base-content/60">
							筛选条件
						</span>
					</div>
					<div className="flex flex-wrap items-end gap-2">
						{/* 搜索 */}
						<div className="flex-1 min-w-40">
							<input
								type="text"
								placeholder="搜索酒店名称..."
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="input input-bordered input-sm h-9 w-full max-w-xs"
							/>
						</div>
						{/* 分类 */}
						<select
							value={category}
							onChange={(e) => {
								setCategory(e.target.value);
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-32"
						>
							{CATEGORY_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						{/* 来源 */}
						<select
							value={source}
							onChange={(e) => {
								setSource(e.target.value);
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-32"
						>
							{SOURCE_OPTIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
						{/* WiFi 筛选 */}
						<select
							value={hasWifi}
							onChange={(e) => {
								setHasWifi(e.target.value as "" | "true" | "false");
								setPage(1);
							}}
							className="select select-bordered select-sm h-9 w-28"
						>
							<option value="">WiFi 不限</option>
							<option value="true">有 WiFi</option>
							<option value="false">无 WiFi</option>
						</select>
						{/* 搜索按钮 */}
						<button
							type="button"
							onClick={() => {
								setPage(1);
								loadData();
							}}
							className="btn btn-primary btn-sm h-9 px-4"
						>
							搜索
						</button>
						{/* 重置 */}
						<button
							type="button"
							onClick={() => {
								setSearch("");
								setCategory("");
								setSource("");
								setHasWifi("");
								setPage(1);
								loadData();
							}}
							className="btn btn-ghost btn-sm h-9"
						>
							重置
						</button>
					</div>
				</div>

				{/* ── Table ────────────────────────────── */}
				<div className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center h-64">
							<span className="loading loading-spinner loading-lg text-primary" />
						</div>
					) : hotels.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-64 gap-2 text-base-content/40">
							<BuildingOfficeIcon className="h-12 w-12" />
							<p>暂无酒店数据</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr className="border-b border-base-200 bg-base-50 text-xs text-base-content/60 uppercase tracking-wide">
										<th className="w-10 font-semibold">#</th>
										<th>酒店名称</th>
										<th>城市</th>
										<th>分类</th>
										<th>评分</th>
										<th>数字游民特性</th>
										<th className="text-right">价格/晚</th>
										<th>来源</th>
										<th className="w-20 text-center">操作</th>
									</tr>
								</thead>
								<tbody>
									{hotels.map((hotel, idx) => (
										<tr
											key={hotel.id}
											className="border-b border-base-100 hover:bg-base-50 transition-colors"
										>
											<td className="text-base-content/40 text-xs">
												{(page - 1) * pageSize + idx + 1}
											</td>
											<td>
												<div className="flex flex-col">
													<span className="font-medium text-sm text-base-content">
														{hotel.name || "—"}
													</span>
													{hotel.address && (
														<span className="text-xs text-base-content/40 truncate max-w-40">
															{hotel.address}
														</span>
													)}
												</div>
											</td>
											<td>
												<span className="text-sm text-base-content">
													{hotel.cityName || "—"}
												</span>
											</td>
											<td>
												<span className="text-sm text-base-content capitalize">
													{hotel.category || "—"}
												</span>
											</td>
											<td>
												{hotel.rating ? (
													<div className="flex items-center gap-1">
														<span className="text-sm font-semibold text-amber-500">
															{hotel.rating.toFixed(1)}
														</span>
														<span className="text-xs text-base-content/40">
															({hotel.reviewCount ?? 0})
														</span>
													</div>
												) : (
													<span className="text-base-content/30 text-sm">
														—
													</span>
												)}
											</td>
											<td>
												<NomadBadge hotel={hotel} />
											</td>
											<td className="text-right">
												{hotel.pricePerNight ? (
													<span className="text-sm font-medium text-base-content">
														{hotel.currency || "¥"}
														{hotel.pricePerNight}
													</span>
												) : (
													<span className="text-base-content/30 text-sm">
														—
													</span>
												)}
											</td>
											<td>
												<StatusBadge source={hotel.source} />
											</td>
											<td>
												<div className="flex items-center justify-center gap-1">
													<Link
														href={`/hotels/${encodeURIComponent(hotel.id)}`}
														className="btn btn-ghost btn-xs text-primary"
													>
														查看
													</Link>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* ── Pagination ─────────────────────── */}
					{!loading && hotels.length > 0 && (
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
