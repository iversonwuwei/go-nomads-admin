"use client";
import {
    createOptionGroup,
    createOptionItem,
    deleteOptionGroup,
    deleteOptionItem,
    fetchOptionGroups,
    fetchOptionItems,
    type OptionGroupDto,
    type OptionItemDto,
    toggleOptionGroup,
    updateOptionGroup,
    updateOptionItem,
} from "@/app/lib/admin-api";
import {
    ChevronDownIcon,
    ChevronRightIcon,
    DevicePhoneMobileIcon,
    EyeIcon,
    HomeIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type GroupForm = {
	groupCode: string;
	groupName: string;
	groupNameEn: string;
	description: string;
};

type ItemForm = {
	optionCode: string;
	optionValue: string;
	optionValueEn: string;
	icon: string;
	color: string;
};

const emptyGroupForm: GroupForm = { groupCode: "", groupName: "", groupNameEn: "", description: "" };
const emptyItemForm: ItemForm = { optionCode: "", optionValue: "", optionValueEn: "", icon: "", color: "" };

export default function OptionGroupsPage() {
	const [groups, setGroups] = useState<OptionGroupDto[]>([]);
	const [loading, setLoading] = useState(true);

	// 展开的分组 → 加载其 items
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [itemsMap, setItemsMap] = useState<Record<string, OptionItemDto[]>>({});
	const [itemsLoading, setItemsLoading] = useState(false);

	// group modal
	const [showGroupModal, setShowGroupModal] = useState(false);
	const [editingGroup, setEditingGroup] = useState<OptionGroupDto | null>(null);
	const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
	const [savingGroup, setSavingGroup] = useState(false);

	// item modal
	const [showItemModal, setShowItemModal] = useState(false);
	const [editingItem, setEditingItem] = useState<OptionItemDto | null>(null);
	const [itemGroupId, setItemGroupId] = useState("");
	const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
	const [savingItem, setSavingItem] = useState(false);

	const loadGroups = useCallback(async () => {
		setLoading(true);
		const res = await fetchOptionGroups();
		if (res.ok && res.data) setGroups(res.data.items);
		setLoading(false);
	}, []);

	useEffect(() => { loadGroups(); }, [loadGroups]);

	async function toggleExpand(groupId: string) {
		if (expandedId === groupId) {
			setExpandedId(null);
			return;
		}
		setExpandedId(groupId);
		if (!itemsMap[groupId]) {
			setItemsLoading(true);
			const res = await fetchOptionItems(groupId);
			if (res.ok && res.data) setItemsMap((prev) => ({ ...prev, [groupId]: res.data ?? [] }));
			setItemsLoading(false);
		}
	}

	// ── Group CRUD ──
	function openCreateGroup() {
		setEditingGroup(null);
		setGroupForm(emptyGroupForm);
		setShowGroupModal(true);
	}

	function openEditGroup(g: OptionGroupDto) {
		setEditingGroup(g);
		setGroupForm({
			groupCode: g.groupCode || "",
			groupName: g.groupName || "",
			groupNameEn: g.groupNameEn || "",
			description: g.description || "",
		});
		setShowGroupModal(true);
	}

	async function handleSaveGroup() {
		setSavingGroup(true);
		if (editingGroup) {
			await updateOptionGroup(editingGroup.id, {
				groupName: groupForm.groupName,
				groupNameEn: groupForm.groupNameEn || undefined,
				description: groupForm.description || undefined,
			});
		} else {
			await createOptionGroup({
				groupCode: groupForm.groupCode,
				groupName: groupForm.groupName,
				groupNameEn: groupForm.groupNameEn || undefined,
				description: groupForm.description || undefined,
			});
		}
		setSavingGroup(false);
		setShowGroupModal(false);
		await loadGroups();
	}

	async function handleDeleteGroup(id: string) {
		if (!confirm("确定删除该选项组？组内所有选项将一并删除。")) return;
		await deleteOptionGroup(id);
		if (expandedId === id) setExpandedId(null);
		await loadGroups();
	}

	async function handleToggle(id: string) {
		await toggleOptionGroup(id);
		await loadGroups();
	}

	// ── Item CRUD ──
	function openCreateItem(groupId: string) {
		setItemGroupId(groupId);
		setEditingItem(null);
		setItemForm(emptyItemForm);
		setShowItemModal(true);
	}

	function openEditItem(groupId: string, item: OptionItemDto) {
		setItemGroupId(groupId);
		setEditingItem(item);
		setItemForm({
			optionCode: item.optionCode || "",
			optionValue: item.optionValue || "",
			optionValueEn: item.optionValueEn || "",
			icon: item.icon || "",
			color: item.color || "",
		});
		setShowItemModal(true);
	}

	async function handleSaveItem() {
		setSavingItem(true);
		if (editingItem) {
			await updateOptionItem(itemGroupId, editingItem.id, {
				optionValue: itemForm.optionValue,
				optionValueEn: itemForm.optionValueEn || undefined,
				icon: itemForm.icon || undefined,
				color: itemForm.color || undefined,
			});
		} else {
			await createOptionItem(itemGroupId, {
				optionCode: itemForm.optionCode,
				optionValue: itemForm.optionValue,
				optionValueEn: itemForm.optionValueEn || undefined,
				icon: itemForm.icon || undefined,
				color: itemForm.color || undefined,
			});
		}
		setSavingItem(false);
		setShowItemModal(false);
		// reload items for this group
		const res = await fetchOptionItems(itemGroupId);
		if (res.ok && res.data) setItemsMap((prev) => ({ ...prev, [itemGroupId]: res.data ?? [] }));
	}

	async function handleDeleteItem(groupId: string, itemId: string) {
		if (!confirm("确定删除该选项？")) return;
		await deleteOptionItem(groupId, itemId);
		const res = await fetchOptionItems(groupId);
		if (res.ok && res.data) setItemsMap((prev) => ({ ...prev, [groupId]: res.data ?? [] }));
	}

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
					<li>选项管理</li>
				</ul>
			</div>

			{/* 标题 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
						<DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-bold">选项组管理</h1>
						<p className="text-xs text-base-content/50">Option Groups · 共 {groups.length} 组</p>
					</div>
				</div>
				<button type="button" className="btn btn-primary btn-sm gap-1" onClick={openCreateGroup}>
					<PlusIcon className="h-4 w-4" /> 新建选项组
				</button>
			</div>

			{/* 列表 */}
			{loading ? (
				<div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>
			) : groups.length === 0 ? (
				<div className="text-center text-base-content/40 py-12">暂无选项组</div>
			) : (
				<div className="space-y-3">
					{groups.map((g) => {
						const expanded = expandedId === g.id;
						const groupItems = itemsMap[g.id] || [];
						return (
							<div key={g.id} className="rounded-xl border border-base-200 bg-base-100 overflow-hidden">
								{/* group header */}
								<div className="flex items-center gap-3 px-4 py-3 hover:bg-base-200/30">
									<button type="button" className="btn btn-ghost btn-xs" onClick={() => toggleExpand(g.id)} aria-label={expanded ? "收起选项" : "展开选项"}>
										{expanded
											? <ChevronDownIcon className="h-4 w-4 text-base-content/50 shrink-0" />
											: <ChevronRightIcon className="h-4 w-4 text-base-content/50 shrink-0" />}
									</button>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-semibold text-sm">{g.groupName}</span>
											{g.groupNameEn && <span className="text-xs text-base-content/40">{g.groupNameEn}</span>}
											<span className="font-mono text-xs text-base-content/30">{g.groupCode}</span>
										</div>
										{g.description && <p className="text-xs text-base-content/50 truncate">{g.description}</p>}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span className="badge badge-outline badge-xs">{g.itemCount ?? 0} 项</span>
										{g.isSystem && <span className="badge badge-warning badge-xs">系统</span>}
										{g.isActive !== false
											? <span className="badge badge-success badge-xs">启用</span>
											: <span className="badge badge-ghost badge-xs">禁用</span>}
										<Link href={`/app-control/option-groups/${g.id}`} className="btn btn-ghost btn-xs" onClick={(e) => e.stopPropagation()}>
											<EyeIcon className="h-4 w-4" />
										</Link>
										<button type="button" className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); handleToggle(g.id); }}>
											{g.isActive !== false ? "禁用" : "启用"}
										</button>
										<button type="button" className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); openEditGroup(g); }}>
											<PencilSquareIcon className="h-4 w-4" />
										</button>
										{!g.isSystem && (
											<button type="button" className="btn btn-ghost btn-xs text-error" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }}>
												<TrashIcon className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>

								{/* expanded items */}
								{expanded && (
									<div className="border-t border-base-200 bg-base-200/10 px-4 py-3">
										{itemsLoading ? (
											<div className="flex justify-center py-4"><span className="loading loading-spinner loading-sm" /></div>
										) : (
											<>
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs font-medium text-base-content/60">选项列表</span>
													<button type="button" className="btn btn-outline btn-xs gap-1" onClick={() => openCreateItem(g.id)}>
														<PlusIcon className="h-3 w-3" /> 添加选项
													</button>
												</div>
												{groupItems.length === 0 ? (
													<p className="text-xs text-base-content/40 text-center py-4">暂无选项</p>
												) : (
													<div className="overflow-x-auto">
														<table className="table table-xs">
															<thead>
																<tr className="text-base-content/50">
																	<th>排序</th>
																	<th>Code</th>
																	<th>中文值</th>
																	<th>英文值</th>
																	<th>图标</th>
																	<th>颜色</th>
																	<th>状态</th>
																	<th className="text-right">操作</th>
																</tr>
															</thead>
															<tbody>
																{groupItems.map((item) => (
																	<tr key={item.id} className="hover">
																		<td className="text-center">{item.sortOrder ?? 0}</td>
																		<td className="font-mono text-xs">{item.optionCode}</td>
																		<td>{item.optionValue || "—"}</td>
																		<td className="text-base-content/60">{item.optionValueEn || "—"}</td>
																		<td>{item.icon || "—"}</td>
																		<td>
																			{item.color ? (
																				<span className="inline-flex items-center gap-1">
																					<span className="h-3 w-3 rounded-full border" style={{ backgroundColor: item.color }} />
																					<span className="text-xs">{item.color}</span>
																				</span>
																			) : "—"}
																		</td>
																		<td>
																			{item.isActive !== false
																				? <span className="badge badge-success badge-xs">启用</span>
																				: <span className="badge badge-ghost badge-xs">禁用</span>}
																		</td>
																		<td className="text-right">
																			<div className="flex items-center justify-end gap-1">
																				<button type="button" className="btn btn-ghost btn-xs" onClick={() => openEditItem(g.id, item)}>
																					<PencilSquareIcon className="h-3 w-3" />
																				</button>
																				<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteItem(g.id, item.id)}>
																					<TrashIcon className="h-3 w-3" />
																				</button>
																			</div>
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}
											</>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Group Modal */}
			{showGroupModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-bold text-lg">{editingGroup ? "编辑选项组" : "新建选项组"}</h3>
							<button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowGroupModal(false)}>
								<XMarkIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-3">
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">组编码</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="如 city_type, work_style"
									value={groupForm.groupCode}
									disabled={!!editingGroup}
									onChange={(e) => setGroupForm({ ...groupForm, groupCode: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">中文名称</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									value={groupForm.groupName}
									onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">英文名称（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									value={groupForm.groupNameEn}
									onChange={(e) => setGroupForm({ ...groupForm, groupNameEn: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">描述（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									value={groupForm.description}
									onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
								/>
							</label>
						</div>
						<div className="modal-action">
							<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowGroupModal(false)}>取消</button>
							<button
								type="button"
								className="btn btn-primary btn-sm"
								disabled={savingGroup || !groupForm.groupCode || !groupForm.groupName}
								onClick={handleSaveGroup}
							>
								{savingGroup ? <span className="loading loading-spinner loading-xs" /> : "保存"}
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop"><button type="button" onClick={() => setShowGroupModal(false)}>close</button></form>
				</dialog>
			)}

			{/* Item Modal */}
			{showItemModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-bold text-lg">{editingItem ? "编辑选项" : "添加选项"}</h3>
							<button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowItemModal(false)}>
								<XMarkIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-3">
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">选项编码</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="如 beach, mountain"
									value={itemForm.optionCode}
									disabled={!!editingItem}
									onChange={(e) => setItemForm({ ...itemForm, optionCode: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">中文值</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									value={itemForm.optionValue}
									onChange={(e) => setItemForm({ ...itemForm, optionValue: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">英文值（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									value={itemForm.optionValueEn}
									onChange={(e) => setItemForm({ ...itemForm, optionValueEn: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">图标（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="emoji 或 icon name"
									value={itemForm.icon}
									onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">颜色（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="#FF4458"
									value={itemForm.color}
									onChange={(e) => setItemForm({ ...itemForm, color: e.target.value })}
								/>
							</label>
						</div>
						<div className="modal-action">
							<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowItemModal(false)}>取消</button>
							<button
								type="button"
								className="btn btn-primary btn-sm"
								disabled={savingItem || !itemForm.optionCode || !itemForm.optionValue}
								onClick={handleSaveItem}
							>
								{savingItem ? <span className="loading loading-spinner loading-xs" /> : "保存"}
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop"><button type="button" onClick={() => setShowItemModal(false)}>close</button></form>
				</dialog>
			)}
		</div>
	);
}
