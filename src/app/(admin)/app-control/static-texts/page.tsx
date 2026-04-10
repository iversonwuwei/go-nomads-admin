"use client";
import {
    createStaticText,
    deleteStaticText,
    fetchStaticTextCategories,
    fetchStaticTexts,
    type StaticTextDto,
    updateStaticText,
} from "@/app/lib/admin-api";
import {
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

const LOCALE_OPTIONS = [
	{ label: "全部语言", value: "" },
	{ label: "中文", value: "zh-CN" },
	{ label: "English (US)", value: "en-US" },
];

type FormData = {
	textKey: string;
	locale: string;
	textValue: string;
	category: string;
	description: string;
};

const emptyForm: FormData = { textKey: "", locale: "zh-CN", textValue: "", category: "", description: "" };

export default function StaticTextsPage() {
	const [items, setItems] = useState<StaticTextDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");
	const [locale, setLocale] = useState("");
	const [category, setCategory] = useState("");
	const [categories, setCategories] = useState<string[]>([]);

	// modal
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<StaticTextDto | null>(null);
	const [form, setForm] = useState<FormData>(emptyForm);
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		const res = await fetchStaticTexts({ page, pageSize, category: category || undefined, key: search || undefined, locale: locale || undefined });
		if (res.ok && res.data) {
			setItems(res.data.items);
			setTotal(res.data.totalCount);
		}
		setLoading(false);
	}, [page, pageSize, search, locale, category]);

	useEffect(() => { load(); }, [load]);

	useEffect(() => {
		fetchStaticTextCategories().then((r) => {
			if (r.ok && r.data) setCategories(r.data);
		});
	}, []);

	function openCreate() {
		setEditing(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(item: StaticTextDto) {
		setEditing(item);
		setForm({
			textKey: item.textKey || "",
			locale: item.locale || "zh-CN",
			textValue: item.textValue || "",
			category: item.category || "",
			description: item.description || "",
		});
		setShowModal(true);
	}

	async function handleSave() {
		setSaving(true);
		if (editing) {
			await updateStaticText(editing.id, {
				textValue: form.textValue,
				category: form.category || undefined,
				description: form.description || undefined,
				isActive: editing.isActive,
			});
		} else {
			await createStaticText({
				textKey: form.textKey,
				locale: form.locale,
				textValue: form.textValue,
				category: form.category || undefined,
				description: form.description || undefined,
			});
		}
		setSaving(false);
		setShowModal(false);
		await load();
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除该文本条目？")) return;
		await deleteStaticText(id);
		await load();
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
					<li>静态文本</li>
				</ul>
			</div>

			{/* 标题 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
						<DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-bold">静态文本管理</h1>
						<p className="text-xs text-base-content/50">Static Texts · 共 {total} 条</p>
					</div>
				</div>
				<button type="button" className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
					<PlusIcon className="h-4 w-4" /> 新建
				</button>
			</div>

			{/* 筛选栏 */}
			<div className="flex flex-wrap items-center gap-2">
				<input
					type="text"
					placeholder="按 Key 搜索..."
					className="input input-bordered input-sm w-56"
					value={search}
					onChange={(e) => { setSearch(e.target.value); setPage(1); }}
				/>
				<select
					className="select select-bordered select-sm"
					value={locale}
					onChange={(e) => { setLocale(e.target.value); setPage(1); }}
				>
					{LOCALE_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>
				<select
					className="select select-bordered select-sm"
					value={category}
					onChange={(e) => { setCategory(e.target.value); setPage(1); }}
				>
					<option value="">全部分类</option>
					{categories.map((c) => (
						<option key={c} value={c}>{c}</option>
					))}
				</select>
			</div>

			{/* 表格 */}
			{loading ? (
				<div className="flex justify-center py-12"><span className="loading loading-spinner" /></div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-base-200">
					<table className="table table-sm">
						<thead>
							<tr className="bg-base-200/40">
								<th>Key</th>
								<th>语言</th>
								<th>分类</th>
								<th>文本值</th>
								<th>版本</th>
								<th>状态</th>
								<th className="text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{items.length === 0 ? (
								<tr><td colSpan={7} className="text-center text-base-content/40 py-8">暂无数据</td></tr>
							) : items.map((item) => (
								<tr key={item.id} className="hover">
									<td>
										<Link href={`/app-control/static-texts/${item.id}`} className="font-mono text-xs text-primary hover:underline">
											{item.textKey}
										</Link>
									</td>
									<td><span className="badge badge-outline badge-xs">{item.locale}</span></td>
									<td className="text-xs">{item.category || "—"}</td>
									<td className="max-w-xs truncate text-xs">{item.textValue || "—"}</td>
									<td className="text-xs text-center">{item.version ?? 1}</td>
									<td>
										{item.isActive !== false
											? <span className="badge badge-success badge-xs">启用</span>
											: <span className="badge badge-ghost badge-xs">禁用</span>}
									</td>
									<td className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Link href={`/app-control/static-texts/${item.id}`} className="btn btn-ghost btn-xs">
												<EyeIcon className="h-4 w-4" />
											</Link>
											<button type="button" className="btn btn-ghost btn-xs" onClick={() => openEdit(item)}>
												<PencilSquareIcon className="h-4 w-4" />
											</button>
											<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(item.id)}>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
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

			{/* 创建/编辑模态框 */}
			{showModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-bold text-lg">{editing ? "编辑文本" : "新建文本"}</h3>
							<button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowModal(false)}>
								<XMarkIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-3">
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">Key</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="如 home.welcome_title"
									value={form.textKey}
									disabled={!!editing}
									onChange={(e) => setForm({ ...form, textKey: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">语言</span>
								<select
									className="select select-bordered select-sm w-full"
									value={form.locale}
									disabled={!!editing}
									onChange={(e) => setForm({ ...form, locale: e.target.value })}
								>
									<option value="zh-CN">中文</option>
									<option value="en-US">English (US)</option>
								</select>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">分类</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="如 home, onboarding"
									value={form.category}
									onChange={(e) => setForm({ ...form, category: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">文本值</span>
								<textarea
									className="textarea textarea-bordered textarea-sm w-full"
									rows={3}
									placeholder="文本内容..."
									value={form.textValue}
									onChange={(e) => setForm({ ...form, textValue: e.target.value })}
								/>
							</label>
							<label className="form-control w-full">
								<span className="label-text text-xs mb-1">描述（可选）</span>
								<input
									type="text"
									className="input input-bordered input-sm w-full"
									placeholder="用途说明"
									value={form.description}
									onChange={(e) => setForm({ ...form, description: e.target.value })}
								/>
							</label>
						</div>
						<div className="modal-action">
							<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>取消</button>
							<button
								type="button"
								className="btn btn-primary btn-sm"
								disabled={saving || !form.textKey || !form.textValue}
								onClick={handleSave}
							>
								{saving ? <span className="loading loading-spinner loading-xs" /> : "保存"}
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop"><button type="button" onClick={() => setShowModal(false)}>close</button></form>
				</dialog>
			)}
		</div>
	);
}
