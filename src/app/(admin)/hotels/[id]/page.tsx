"use client";
import {
	BuildingOfficeIcon,
	ChevronRightIcon,
	GlobeAltIcon,
	HomeIcon,
	MapPinIcon,
	PhoneIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
	fetchHotelById,
	fetchHotelRoomTypes,
	type HotelAdminDto,
	type RoomTypeDto,
} from "@/app/lib/admin-api";

function AmenityTag({ label, enabled }: { label: string; enabled?: boolean }) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
				enabled
					? "bg-emerald-50 text-emerald-700 border-emerald-100"
					: "bg-base-100 text-base-content/30 border-base-200 line-through"
			}`}
		>
			{label}
		</span>
	);
}

function RoomCard({ room }: { room: RoomTypeDto }) {
	return (
		<div className="rounded-xl border border-base-200 bg-base-100 p-4 space-y-2">
			<div className="flex items-start justify-between">
				<div>
					<h4 className="font-semibold text-sm text-base-content">
						{room.name || "—"}
					</h4>
					<p className="text-xs text-base-content/50 mt-0.5">
						{room.bedType || "—"} · 最多 {room.maxOccupancy || "?"} 人
						{room.size ? ` · ${room.size}m²` : ""}
					</p>
				</div>
				<span
					className={`badge badge-sm ${room.isAvailable ? "badge-success" : "badge-error"}`}
				>
					{room.isAvailable ? "可订" : "不可用"}
				</span>
			</div>
			{room.description && (
				<p className="text-xs text-base-content/60 line-clamp-2">
					{room.description}
				</p>
			)}
			<div className="flex items-center justify-between">
				<span className="text-sm font-bold text-primary">
					{room.currency || "¥"}
					{room.pricePerNight}
					<span className="text-xs font-normal text-base-content/40">/晚</span>
				</span>
				<span className="text-xs text-base-content/50">
					剩余 {room.availableRooms ?? 0} 间
				</span>
			</div>
			{room.amenities && room.amenities.length > 0 && (
				<div className="flex flex-wrap gap-1 pt-1 border-t border-base-100">
					{room.amenities.map((a) => (
						<span key={a} className="badge badge-ghost badge-sm">
							{a}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

export default function HotelDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const decodedId = decodeURIComponent(id);

	const [hotel, setHotel] = useState<HotelAdminDto | null>(null);
	const [rooms, setRooms] = useState<RoomTypeDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<"info" | "rooms" | "reviews" | "stats">("info");

	useEffect(() => {
		if (!decodedId) return;
		setLoading(true);
		Promise.all([
			fetchHotelById(decodedId),
			fetchHotelRoomTypes(decodedId),
		]).then(([hotelRes, roomsRes]) => {
			if (hotelRes.ok && hotelRes.data) setHotel(hotelRes.data);
			if (roomsRes.ok && roomsRes.data) setRooms(roomsRes.data);
			setLoading(false);
		});
	}, [decodedId]);

	if (loading) {
		return (
			<div className="min-h-screen bg-base-100 flex items-center justify-center">
				<span className="loading loading-spinner loading-lg text-primary" />
			</div>
		);
	}

	if (!hotel) {
		return (
			<div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-3">
				<BuildingOfficeIcon className="h-16 w-16 text-base-content/20" />
				<p className="text-base-content/50">酒店不存在或加载失败</p>
				<Link href="/hotels" className="btn btn-primary btn-sm">
					返回列表
				</Link>
			</div>
		);
	}

	const nomadTraits = [
		{ label: "WiFi", enabled: hotel.hasWifi },
		{ label: "工位", enabled: hotel.hasWorkDesk },
		{ label: "共享办公", enabled: hotel.hasCoworkingSpace },
		{ label: "空调", enabled: hotel.hasAirConditioning },
		{ label: "厨房", enabled: hotel.hasKitchen },
		{ label: "洗衣房", enabled: hotel.hasLaundry },
		{ label: "停车场", enabled: hotel.hasParking },
		{ label: "游泳池", enabled: hotel.hasPool },
		{ label: "健身房", enabled: hotel.hasGym },
		{ label: "24h前台", enabled: hotel.has24HReception },
		{ label: "长住折扣", enabled: hotel.hasLongStayDiscount },
		{ label: "宠物友好", enabled: hotel.isPetFriendly },
	];

	const enabledTraits = nomadTraits.filter((t) => t.enabled);

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
					<Link href="/hotels" className="hover:text-base-content">
						酒店管理
					</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<span className="text-base-content truncate max-w-xs">
						{hotel.name || id}
					</span>
				</div>
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-lg font-semibold text-base-content">
							{hotel.name || "—"}
						</h1>
						<div className="flex items-center gap-2 mt-1">
							{hotel.cityName && (
								<span className="flex items-center gap-1 text-sm text-base-content/50">
									<MapPinIcon className="h-3.5 w-3.5" />
									{hotel.cityName}
								</span>
							)}
							{hotel.country && (
								<span className="flex items-center gap-1 text-sm text-base-content/50">
									<GlobeAltIcon className="h-3.5 w-3.5" />
									{hotel.country}
								</span>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						{hotel.rating ? (
							<div className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5">
								<span className="text-lg font-bold text-amber-500">
									{hotel.rating.toFixed(1)}
								</span>
								<div className="text-xs text-amber-600">
									<p>{hotel.reviewCount ?? 0} 条评论</p>
								</div>
							</div>
						) : null}
						<span
							className={`badge ${hotel.source === "booking" ? "badge-info" : "badge-success"} badge-outline`}
						>
							{hotel.source === "booking" ? "Booking.com" : "社区"}
						</span>
					</div>
				</div>
			</div>

			{/* ── Tabs ────────────────────────────── */}
			<div className="border-b border-base-200 px-4 md:px-6 bg-base-100">
				<div className="flex gap-1">
					{(["info", "rooms", "reviews", "stats"] as const).map((t) => (
						<button
							type="button"
							key={t}
							onClick={() => setTab(t)}
							className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
								tab === t
									? "border-primary text-primary"
									: "border-transparent text-base-content/50 hover:text-base-content"
							}`}
						>
							{t === "info"
								? "基本信息"
								: t === "rooms"
									? `房型管理 (${rooms.length})`
									: t === "reviews"
										? "评论管理"
										: "统计数据"}
						</button>
					))}
				</div>
			</div>

			<div className="p-4 md:p-6">
				{/* ── Info Tab ─────────────────────── */}
				{tab === "info" && (
					<div className="grid gap-6 lg:grid-cols-3">
						{/* 基础信息 */}
						<div className="rounded-xl border border-base-200 bg-base-100 p-5 space-y-4">
							<h3 className="text-sm font-semibold text-base-content border-b border-base-100 pb-2">
								基础信息
							</h3>
							<dl className="space-y-3">
								<div className="flex justify-between text-sm">
									<dt className="text-base-content/50">分类</dt>
									<dd className="font-medium capitalize">
										{hotel.category || "—"}
									</dd>
								</div>
								<div className="flex justify-between text-sm">
									<dt className="text-base-content/50">参考价格</dt>
									<dd className="font-medium">
										{hotel.pricePerNight
											? `${hotel.currency || "¥"}${hotel.pricePerNight}/晚`
											: "—"}
									</dd>
								</div>
								<div className="flex justify-between text-sm">
									<dt className="text-base-content/50">数字游民评分</dt>
									<dd className="font-bold text-primary">
										{hotel.nomadScore ?? "—"}
									</dd>
								</div>
								{hotel.wifiSpeed ? (
									<div className="flex justify-between text-sm">
										<dt className="text-base-content/50">WiFi 速度</dt>
										<dd className="font-medium">{hotel.wifiSpeed} Mbps</dd>
									</div>
								) : null}
							</dl>

							{hotel.description && (
								<div className="border-t border-base-100 pt-3">
									<p className="text-sm text-base-content/60 leading-relaxed">
										{hotel.description}
									</p>
								</div>
							)}

							<div className="border-t border-base-100 pt-3 space-y-2">
								{hotel.address && (
									<div className="flex items-start gap-2 text-sm">
										<MapPinIcon className="h-4 w-4 text-base-content/40 mt-0.5 flex-shrink-0" />
										<span className="text-base-content/70">
											{hotel.address}
										</span>
									</div>
								)}
								{hotel.phone && (
									<div className="flex items-center gap-2 text-sm">
										<PhoneIcon className="h-4 w-4 text-base-content/40 flex-shrink-0" />
										<span className="text-base-content/70">{hotel.phone}</span>
									</div>
								)}
								{hotel.email && (
									<div className="flex items-center gap-2 text-sm">
										<span className="text-base-content/40 w-4 text-center">
											@
										</span>
										<span className="text-base-content/70">{hotel.email}</span>
									</div>
								)}
								{hotel.website && (
									<div className="flex items-center gap-2 text-sm">
										<GlobeAltIcon className="h-4 w-4 text-base-content/40 flex-shrink-0" />
										<a
											href={hotel.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline truncate"
										>
											{hotel.website}
										</a>
									</div>
								)}
							</div>

							{hotel.createdAt && (
								<div className="border-t border-base-100 pt-2">
									<p className="text-xs text-base-content/30">
										创建于 {hotel.createdAt.replace("T", " ").substring(0, 19)}
									</p>
								</div>
							)}
						</div>

						{/* 数字游民特性 */}
						<div className="rounded-xl border border-base-200 bg-base-100 p-5 space-y-4">
							<h3 className="text-sm font-semibold text-base-content border-b border-base-100 pb-2">
								数字游民特性
							</h3>
							{enabledTraits.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{enabledTraits.map(({ label, enabled }) => (
										<AmenityTag key={label} label={label} enabled={!!enabled} />
									))}
								</div>
							) : (
								<p className="text-sm text-base-content/40">暂无数字游民特性</p>
							)}

							{hotel.wifiSpeed ? (
								<div className="border-t border-base-100 pt-3">
									<div className="flex justify-between text-sm mb-1">
										<span className="text-base-content/50">WiFi 速度</span>
										<span className="font-medium">{hotel.wifiSpeed} Mbps</span>
									</div>
									<div className="w-full bg-base-200 rounded-full h-2">
										<div
											className="bg-primary h-2 rounded-full transition-all"
											style={{
												width: `${Math.min((hotel.wifiSpeed / 200) * 100, 100)}%`,
											}}
										/>
									</div>
									<p className="text-xs text-base-content/40 mt-1">
										参考：100+ Mbps 为优秀
									</p>
								</div>
							) : null}
						</div>

						{/* 图片 */}
						<div className="rounded-xl border border-base-200 bg-base-100 p-5 space-y-4">
							<h3 className="text-sm font-semibold text-base-content border-b border-base-100 pb-2">
								酒店图片
							</h3>
							{hotel.images && hotel.images.length > 0 ? (
								<div className="grid grid-cols-2 gap-2">
									{hotel.images.map((img: string, i: number) => (
										<div
											key={img}
											className="relative aspect-video rounded-lg overflow-hidden border border-base-200"
										>
											<Image
												src={img}
												alt={`Image ${i + 1}`}
												fill
												className="object-cover"
												sizes="200px"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display = "none";
												}}
											/>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-base-content/40">暂无图片</p>
							)}
						</div>
					</div>
				)}

				{/* ── Rooms Tab ─────────────────────── */}
				{tab === "rooms" && (
					<div>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm font-semibold text-base-content">
								房型列表
							</h3>
							<span className="text-sm text-base-content/50">
								{rooms.length} 个房型
							</span>
						</div>
						{rooms.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-48 rounded-xl border border-base-200 bg-base-50 gap-2">
								<BuildingOfficeIcon className="h-10 w-10 text-base-content/20" />
								<p className="text-base-content/40 text-sm">暂无房型数据</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{rooms.map((room: RoomTypeDto) => (
									<RoomCard key={room.id} room={room} />
								))}
							</div>
						)}
					</div>
				)}

				{/* ── Reviews Tab ─────────────────── */}
				{tab === "reviews" && (
					<div className="flex flex-col items-center justify-center h-48 rounded-xl border border-base-200 bg-base-50 gap-2">
						<p className="text-base-content/50 text-sm">
							评论管理请前往{" "}
							<Link
								href="/hotel-reviews"
								className="text-primary hover:underline font-medium"
							>
								酒店评论审核
							</Link>{" "}
							页面
						</p>
					</div>
				)}

				{/* ── Stats Tab ─────────────────────── */}
				{tab === "stats" && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="rounded-xl border border-base-200 bg-base-100 p-4 text-center">
							<p className="text-2xl font-bold text-primary">{hotel.reviewCount ?? 0}</p>
							<p className="text-xs text-base-content/50 mt-1">总评论数</p>
						</div>
						<div className="rounded-xl border border-base-200 bg-base-100 p-4 text-center">
							<p className="text-2xl font-bold text-emerald-600">
								{hotel.rating?.toFixed(1) ?? "—"}
							</p>
							<p className="text-xs text-base-content/50 mt-1">平均评分</p>
						</div>
						<div className="rounded-xl border border-base-200 bg-base-100 p-4 text-center">
							<p className="text-2xl font-bold text-amber-600">
								{hotel.pricePerNight ?? "—"}
							</p>
							<p className="text-xs text-base-content/50 mt-1">价格 (¥/晚)</p>
						</div>
						<div className="rounded-xl border border-base-200 bg-base-100 p-4 text-center">
							<p className="text-2xl font-bold text-blue-600">
								{hotel.nomadScore?.toFixed(0) ?? "—"}
							</p>
							<p className="text-xs text-base-content/50 mt-1">数字游民评分</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
