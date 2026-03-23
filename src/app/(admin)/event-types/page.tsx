"use client";
import {
	CalendarDaysIcon,
	ChevronRightIcon,
	HomeIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	createEventType,
	deleteEventType,
	type EventTypeDto,
	fetchEventTypes,
	updateEventType,
} from "@/app/lib/admin-api";

const ICON_OPTIONS = [
	{ label: "🎨 艺术", value: "🎨" },
	{ label: "💼 商务", value: "💼" },
	{ label: "🍷 社交", value: "🍷" },
	{ label: "🎮 游戏", value: "🎮" },
	{ label: "🏃 运动", value: "🏃" },
	{ label: "📚 学习", value: "📚" },
	{ label: "🎵 音乐", value: "🎵" },
	{ label: "🍕 美食", value: "🍕" },
	{ label: "🌴 旅行", value: "🌴" },
	{ label: "💡 创业", value: "💡" },
	{ label: "🎬 电影", value: "🎬" },
	{ label: "🏠 家居", value: "🏠" },
];

const COLOR_OPTIONS = [
	{
		label: "红色",
		value: "red",
		class: "bg-red-100 text-red-700 border-red-200",
	},
	{
		label: "蓝色",
		value: "blue",
		class: "bg-blue-100 text-blue-700 border-blue-200",
	},
	{
		label: "绿色",
		value: "green",
		class: "bg-emerald-100 text-emerald-700 border-emerald-200",
	},
	{
		label: "紫色",
		value: "purple",
		class: "bg-purple-100 text-purple-700 border-purple-200",
	},
	{
		label: "橙色",
		value: "orange",
		class: "bg-orange-100 text-orange-700 border-orange-200",
	},
	{
		label: "青色",
		value: "cyan",
		class: "bg-cyan-100 text-cyan-700 border-cyan-200",
	},
];

function TypeCard({
	type,
	onEdit,
	onDelete,
}: {
	type: EventTypeDto;
	onEdit: (t: EventTypeDto) => void;
	onDelete: (id: string) => void;
}) {
	const colorClass =
		COLOR_OPTIONS.find((c) => c.value === type.color)?.class ||
		"bg-base-100 text-base-content border-base-200";

	return (
		<div className="rounded-xl border border-base-200 bg-base-100 p-4 space-y-3 hover:shadow-sm transition-shadow">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div
						className={`flex items-center justify-center h-10 w-10 rounded-lg border ${colorClass} text-lg font-bold`}
					>
						{type.icon || "?"}
					</div>
					<div>
						<p className="font-semibold text-sm text-base-content">
							{type.name || "—"}
						</p>
						{type.nameEn && (
							<p className="text-xs text-base-content/40">{type.nameEn}</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1">
					<span
						className={`badge badge-sm ${type.isActive !== false ? "badge-success" : "badge-error"}`}
					>
						{type.isActive !== false ? "启用" : "禁用"}
					</span>
				</div>
			</div>

			{type.description && (
				<p className="text-xs text-base-content/60 leading-relaxed line-clamp-2">
					{type.description}
				</p>
			)}

			<div className="flex items-center justify-between pt-1 border-t border-base-100">
				<span className="text-xs text-base-content/40">
					{type.eventCount ?? 0} 个活动
				</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => onEdit(type)}
						className="btn btn-ghost btn-xs text-primary gap-1"
					>
						<PencilSquareIcon className="h-3.5 w-3.5" />
						编辑
					</button>
					<button
						type="button"
						onClick={() => {
							if (confirm(`确定删除「${type.name}」吗？`)) {
								onDelete(type.id);
							}
						}}
						className="btn btn-ghost btn-xs text-error gap-1"
					>
						<TrashIcon className="h-3.5 w-3.5" />
						删除
					</button>
				</div>
			</div>
		</div>
	);
}

function TypeFormModal({
	initial,
	onClose,
	onSave,
}: {
	initial?: EventTypeDto;
	onClose: () => void;
	onSave: (data: {
		name: string;
		nameEn?: string;
		icon?: string;
		color?: string;
		description?: string;
		isActive?: boolean;
	}) => void;
}) {
	const [name, setName] = useState(initial?.name || "");
	const [nameEn, setNameEn] = useState(initial?.nameEn || "");
	const [icon, setIcon] = useState(initial?.icon || "🎨");
	const [color, setColor] = useState(initial?.color || "blue");
	const [description, setDescription] = useState(initial?.description || "");
	const [isActive, setIsActive] = useState(initial?.isActive !== false);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!name.trim()) return;
		setSaving(true);
		const data = {
			name: name.trim(),
			nameEn: nameEn.trim() || undefined,
			icon,
			color,
			description: description.trim() || undefined,
			isActive,
		};
		onSave(data);
		setSaving(false);
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-md">
				<h3 className="font-bold text-lg mb-4">
					{initial ? "编辑活动类型" : "新建活动类型"}
				</h3>
				<div className="space-y-4">
					<div className="form-control">
						<label className="label" htmlFor="type-name">
							<span className="label-text font-medium">类型名称 *</span>
						</label>
						<input
							id="type-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="如：技术交流"
							className="input input-bordered input-sm w-full"
						/>
					</div>
					<div className="form-control">
						<label className="label" htmlFor="type-name-en">
							<span className="label-text font-medium">英文名称</span>
						</label>
						<input
							id="type-name-en"
							type="text"
							value={nameEn}
							onChange={(e) => setNameEn(e.target.value)}
							placeholder="如：Tech Meetup"
							className="input input-bordered input-sm w-full"
						/>
					</div>
					<div className="form-control">
						<label className="label" htmlFor="type-icon">
							<span className="label-text font-medium">图标</span>
						</label>
						<div id="type-icon" className="flex flex-wrap gap-2">
							{ICON_OPTIONS.map((o) => (
								<button
									type="button"
									key={o.value}
									onClick={() => setIcon(o.value)}
									className={`btn btn-sm h-9 w-12 text-lg ${icon === o.value ? "btn-primary" : "btn-ghost"}`}
								>
									{o.value}
								</button>
							))}
						</div>
					</div>
					<div className="form-control">
						<label className="label" htmlFor="type-color">
							<span className="label-text font-medium">颜色</span>
						</label>
						<div id="type-color" className="flex flex-wrap gap-2">
							{COLOR_OPTIONS.map((o) => (
								<button
									type="button"
									key={o.value}
									onClick={() => setColor(o.value)}
									className={`btn btn-sm h-9 ${color === o.value ? "ring-2 ring-primary ring-offset-1" : ""}`}
								>
									<span
										className={`inline-block w-3 h-3 rounded-full border ${o.class}`}
									/>
								</button>
							))}
						</div>
					</div>
					<div className="form-control">
						<label className="label" htmlFor="type-desc">
							<span className="label-text font-medium">描述</span>
						</label>
						<textarea
							id="type-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="可选，简要描述该类型的活动..."
							className="textarea textarea-bordered textarea-sm w-full h-20"
						/>
					</div>
					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-2">
							<input
								type="checkbox"
								checked={isActive}
								onChange={(e) => setIsActive(e.target.checked)}
								className="checkbox checkbox-sm checkbox-primary"
							/>
							<span className="label-text">启用状态</span>
						</label>
					</div>
				</div>
				<div className="modal-action">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost btn-sm"
					>
						取消
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={!name.trim() || saving}
						className="btn btn-primary btn-sm"
					>
						{saving ? "保存中..." : "保存"}
					</button>
				</div>
			</div>
			<button
				type="button"
				className="modal-backdrop cursor-default"
				onClick={onClose}
				aria-label="关闭"
			/>
		</div>
	);
}

export default function EventTypesPage() {
	const [types, setTypes] = useState<EventTypeDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingType, setEditingType] = useState<EventTypeDto | undefined>();

	const loadData = useCallback(async () => {
		setLoading(true);
		const res = await fetchEventTypes();
		if (res.ok && res.data) setTypes(res.data);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleEdit = (type: EventTypeDto) => {
		setEditingType(type);
		setModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		const res = await deleteEventType(id);
		if (res.ok) {
			setTypes((prev) => prev.filter((t) => t.id !== id));
		}
	};

	const handleSave = async (data: Parameters<typeof createEventType>[0]) => {
		if (editingType) {
			const res = await updateEventType(editingType.id, data);
			if (res.ok && res.data) {
				const updated = res.data;
				setTypes((prev) =>
					prev.map((t) => (t.id === editingType.id ? updated : t)),
				);
			}
		} else {
			const res = await createEventType(data);
			if (res.ok && res.data) {
				setTypes((prev) => [...prev, res.data as EventTypeDto]);
			}
		}
		setModalOpen(false);
		setEditingType(undefined);
	};

	const activeTypes = types.filter((t) => t.isActive !== false);
	const inactiveTypes = types.filter((t) => t.isActive === false);

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
					<span className="text-base-content">活动类型管理</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-semibold text-base-content">
							活动类型管理
						</h1>
						<p className="text-sm text-base-content/50 mt-0.5">
							共 {types.length} 个类型（启用 {activeTypes.length}，禁用{" "}
							{inactiveTypes.length}）
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setEditingType(undefined);
							setModalOpen(true);
						}}
						className="btn btn-primary btn-sm gap-1"
					>
						<PlusIcon className="h-4 w-4" />
						新建类型
					</button>
				</div>
			</div>

			<div className="p-4 md:p-6 space-y-6">
				{loading ? (
					<div className="flex items-center justify-center h-48">
						<span className="loading loading-spinner loading-lg text-primary" />
					</div>
				) : types.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-48 rounded-xl border border-base-200 bg-base-50 gap-2">
						<CalendarDaysIcon className="h-12 w-12 text-base-content/20" />
						<p className="text-base-content/40 text-sm">暂无活动类型</p>
						<button
							type="button"
							onClick={() => {
								setEditingType(undefined);
								setModalOpen(true);
							}}
							className="btn btn-primary btn-sm gap-1"
						>
							<PlusIcon className="h-4 w-4" />
							新建第一个类型
						</button>
					</div>
				) : (
					<>
						{activeTypes.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-base-content/60 mb-3">
									已启用 ({activeTypes.length})
								</h3>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{activeTypes.map((t) => (
										<TypeCard
											key={t.id}
											type={t}
											onEdit={handleEdit}
											onDelete={handleDelete}
										/>
									))}
								</div>
							</div>
						)}
						{inactiveTypes.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-base-content/40 mb-3">
									已禁用 ({inactiveTypes.length})
								</h3>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 opacity-60">
									{inactiveTypes.map((t) => (
										<TypeCard
											key={t.id}
											type={t}
											onEdit={handleEdit}
											onDelete={handleDelete}
										/>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{modalOpen && (
				<TypeFormModal
					initial={editingType}
					onClose={() => {
						setModalOpen(false);
						setEditingType(undefined);
					}}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
