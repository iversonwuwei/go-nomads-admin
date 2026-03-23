"use client";
import {
	ArrowLeftIcon,
	BuildingOfficeIcon,
	ChevronRightIcon,
	HomeIcon,
	PhotoIcon,
	StarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useState } from "react";
import { createHotel, fetchCities } from "@/app/lib/admin-api";

const CATEGORY_OPTIONS = [
	{ label: "选择分类", value: "" },
	{ label: "Luxury", value: "luxury" },
	{ label: "Budget", value: "budget" },
	{ label: "Hostel", value: "hostel" },
	{ label: "Boutique", value: "boutique" },
	{ label: "Resort", value: "resort" },
];

const SOURCE_OPTIONS = [
	{ label: "选择来源", value: "" },
	{ label: "社区用户", value: "community" },
	{ label: "Booking.com", value: "booking" },
];

export default function CreateHotelPage() {
	const [loading, setLoading] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [cityId, setCityId] = useState("");
	const [category, setCategory] = useState("");
	const [source, setSource] = useState("");
	const [pricePerNight, setPricePerNight] = useState("");
	const [currency] = useState("CNY");
	const [description, setDescription] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [website, setWebsite] = useState("");

	// Nomad features
	const [hasWifi, setHasWifi] = useState(false);
	const [wifiSpeed, setWifiSpeed] = useState("");
	const [hasWorkDesk, setHasWorkDesk] = useState(false);
	const [hasCoworkingSpace, setHasCoworkingSpace] = useState(false);
	const [hasAirConditioning, setHasAirConditioning] = useState(false);
	const [hasKitchen, setHasKitchen] = useState(false);
	const [hasLaundry, setHasLaundry] = useState(false);
	const [hasParking, setHasParking] = useState(false);
	const [hasPool, setHasPool] = useState(false);
	const [hasGym, setHasGym] = useState(false);
	const [has24HReception, setHas24HReception] = useState(false);
	const [hasLongStayDiscount, setHasLongStayDiscount] = useState(false);
	const [isPetFriendly, setIsPetFriendly] = useState(false);

	const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

	const loadCities = useCallback(async () => {
		const res = await fetchCities({ pageSize: 200 });
		if (res.ok && res.data) {
			setCities(
				res.data.items
					.filter((c) => c.id && c.name)
					.map((c) => ({
						id: String(c.id),
						name: c.name || "",
					})),
			);
		}
	}, []);

	// Load cities on mount
	useState(() => {
		loadCities();
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("请输入酒店名称");
			return;
		}
		setError("");
		setLoading(true);

		const res = await createHotel({
			name: name.trim(),
			address: address.trim() || undefined,
			cityId: cityId || undefined,
			category: category || undefined,
			source: source || undefined,
			pricePerNight: pricePerNight ? Number(pricePerNight) : undefined,
			currency,
			description: description.trim() || undefined,
			phone: phone.trim() || undefined,
			email: email.trim() || undefined,
			website: website.trim() || undefined,
			hasWifi,
			wifiSpeed: wifiSpeed ? Number(wifiSpeed) : undefined,
			hasWorkDesk,
			hasCoworkingSpace,
			hasAirConditioning,
			hasKitchen,
			hasLaundry,
			hasParking,
			hasPool,
			hasGym,
			has24HReception,
			hasLongStayDiscount,
			isPetFriendly,
		});

		setLoading(false);

		if (res.ok) {
			setSaved(true);
		} else {
			setError(res.message || "创建失败");
		}
	};

	if (saved) {
		return (
			<div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-4">
				<div className="text-center">
					<div className="text-5xl mb-3">✅</div>
					<h2 className="text-xl font-semibold text-base-content">酒店创建成功</h2>
					<p className="text-base-content/60 mt-2">是否继续添加房型？</p>
				</div>
				<div className="flex gap-3">
					<Link href="/hotels" className="btn btn-ghost btn-sm">
						返回列表
					</Link>
					{/* @ts-expect-error data is not fully typed */}
					<Link href={`/hotels/${res.data?.id}/edit`} className="btn btn-primary btn-sm">
						编辑酒店
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-100">
			{/* ── Header ────────────────────────────── */}
			<div className="border-b border-base-300 bg-base-100 px-4 pt-4 pb-3 md:px-6">
				<div className="flex items-center gap-1 text-sm text-base-content/50 mb-2">
					<HomeIcon className="h-3.5 w-3.5" />
					<Link href="/dashboard" className="hover:text-base-content transition-colors">首页</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<Link href="/hotels" className="hover:text-base-content transition-colors">酒店管理</Link>
					<ChevronRightIcon className="h-3 w-3" />
					<span className="text-base-content">创建酒店</span>
				</div>
				<div className="flex items-center gap-3">
					<Link href="/hotels" className="btn btn-ghost btn-sm btn-square">
						<ArrowLeftIcon className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="text-lg font-semibold text-base-content">创建酒店</h1>
						<p className="text-sm text-base-content/50 mt-0.5">填写酒店信息</p>
					</div>
				</div>
			</div>

			<div className="p-4 md:p-6 max-w-3xl">
				<form onSubmit={handleSubmit} className="space-y-6">
					{error && (
						<div className="alert alert-error">
							<span>{error}</span>
						</div>
					)}

					{/* ── 基本信息 ───────────────────────────── */}
					<div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-4">
						<h2 className="font-semibold text-base-content flex items-center gap-2">
							<BuildingOfficeIcon className="h-4 w-4" />
							基本信息
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="md:col-span-2">
								<label className="label label-text text-sm">酒店名称 *</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="输入酒店名称"
									className="input input-bordered input-sm w-full"
									required
								/>
							</div>

							<div className="md:col-span-2">
								<label className="label label-text text-sm">地址</label>
								<input
									type="text"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="详细地址"
									className="input input-bordered input-sm w-full"
								/>
							</div>

							<div>
								<label className="label label-text text-sm">城市</label>
								<select
									value={cityId}
									onChange={(e) => setCityId(e.target.value)}
									className="select select-bordered select-sm w-full"
								>
									<option value="">选择城市</option>
									{cities.map((c) => (
										<option key={c.id} value={c.id}>{c.name}</option>
									))}
								</select>
							</div>

							<div>
								<label className="label label-text text-sm">分类</label>
								<select
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									className="select select-bordered select-sm w-full"
								>
									{CATEGORY_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>{o.label}</option>
									))}
								</select>
							</div>

							<div>
								<label className="label label-text text-sm">来源</label>
								<select
									value={source}
									onChange={(e) => setSource(e.target.value)}
									className="select select-bordered select-sm w-full"
								>
									{SOURCE_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>{o.label}</option>
									))}
								</select>
							</div>

							<div>
								<label className="label label-text text-sm">每晚价格</label>
								<div className="flex gap-2">
									<input
										type="number"
										value={pricePerNight}
										onChange={(e) => setPricePerNight(e.target.value)}
										placeholder="0"
										className="input input-bordered input-sm flex-1"
										min="0"
									/>
									<span className="text-base-content/50 text-sm self-center">{currency}</span>
								</div>
							</div>

							<div className="md:col-span-2">
								<label className="label label-text text-sm">简介</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="酒店简介"
									rows={3}
									className="textarea textarea-bordered textarea-sm w-full"
								/>
							</div>
						</div>
					</div>

					{/* ── 联系方式 ───────────────────────────── */}
					<div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-4">
						<h2 className="font-semibold text-base-content flex items-center gap-2">
							<StarIcon className="h-4 w-4" />
							联系方式
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="label label-text text-sm">电话</label>
								<input
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="+86 10 1234 5678"
									className="input input-bordered input-sm w-full"
								/>
							</div>
							<div>
								<label className="label label-text text-sm">邮箱</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="contact@hotel.com"
									className="input input-bordered input-sm w-full"
								/>
							</div>
							<div className="md:col-span-2">
								<label className="label label-text text-sm">官网</label>
								<input
									type="url"
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									placeholder="https://hotel.com"
									className="input input-bordered input-sm w-full"
								/>
							</div>
						</div>
					</div>

					{/* ── 数字游民特性 ────────────────────────── */}
					<div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-4">
						<h2 className="font-semibold text-base-content flex items-center gap-2">
							<PhotoIcon className="h-4 w-4" />
							数字游民特性
						</h2>

						<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasWifi}
									onChange={(e) => setHasWifi(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">WiFi</span>
							</label>
							{hasWifi && (
								<div className="md:col-span-2 flex items-center gap-2">
									<span className="text-sm text-base-content/60">速度 (Mbps)</span>
									<input
										type="number"
										value={wifiSpeed}
										onChange={(e) => setWifiSpeed(e.target.value)}
										placeholder="50"
										className="input input-bordered input-sm w-24"
										min="0"
									/>
								</div>
							)}
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasWorkDesk}
									onChange={(e) => setHasWorkDesk(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">工位</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasCoworkingSpace}
									onChange={(e) => setHasCoworkingSpace(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">共享办公区</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasAirConditioning}
									onChange={(e) => setHasAirConditioning(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">空调</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasKitchen}
									onChange={(e) => setHasKitchen(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">厨房</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasLaundry}
									onChange={(e) => setHasLaundry(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">洗衣房</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasParking}
									onChange={(e) => setHasParking(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">停车场</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasPool}
									onChange={(e) => setHasPool(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">游泳池</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasGym}
									onChange={(e) => setHasGym(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">健身房</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={has24HReception}
									onChange={(e) => setHas24HReception(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">24h 前台</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={hasLongStayDiscount}
									onChange={(e) => setHasLongStayDiscount(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">长住折扣</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={isPetFriendly}
									onChange={(e) => setIsPetFriendly(e.target.checked)}
									className="checkbox checkbox-sm checkbox-primary"
								/>
								<span className="text-sm">宠物友好</span>
							</label>
						</div>
					</div>

					{/* ── Actions ───────────────────────────── */}
					<div className="flex items-center justify-end gap-3 pt-2">
						<Link href="/hotels" className="btn btn-ghost btn-sm">
							取消
						</Link>
						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary btn-sm min-w-24"
						>
							{loading ? (
								<span className="loading loading-spinner loading-xs" />
							) : (
								"创建酒店"
							)}
						</button>
					</div>
				</form>
		 </div>
		</div>
	);
}
