"use client";

import {
    createMembershipPlan,
    deleteMembershipPlan,
    fetchMembershipPlans,
    type MembershipPlanDto,
    updateMembershipPlan,
} from "@/app/lib/admin-api";
import {
    ChevronRightIcon,
    CreditCardIcon,
    HomeIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MembershipPage() {
	const [plans, setPlans] = useState<MembershipPlanDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<MembershipPlanDto | null>(null);
	const [formName, setFormName] = useState("");
	const [formPrice, setFormPrice] = useState("");
	const [formDuration, setFormDuration] = useState("monthly");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let active = true;
		fetchMembershipPlans().then((res) => {
			if (!active) return;
			if (res.ok && res.data) setPlans(res.data);
			setLoading(false);
		});
		return () => { active = false; };
	}, []);

	function openCreate() {
		setEditing(null);
		setFormName("");
		setFormPrice("");
		setFormDuration("monthly");
		setShowForm(true);
	}

	function openEdit(p: MembershipPlanDto) {
		setEditing(p);
		setFormName(p.name || "");
		setFormPrice(String(p.price ?? ""));
		setFormDuration(p.duration || "monthly");
		setShowForm(true);
	}

	async function handleSave() {
		setSaving(true);
		if (editing) {
			await updateMembershipPlan(editing.id, {
				name: formName,
				price: Number(formPrice),
				duration: formDuration,
			});
		} else {
			await createMembershipPlan({
				name: formName,
				price: Number(formPrice),
				duration: formDuration,
			});
		}
		setSaving(false);
		setShowForm(false);
		await reload();
	}

	async function reload() {
		setLoading(true);
		const res = await fetchMembershipPlans();
		if (res.ok && res.data) setPlans(res.data);
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此会员计划？")) return;
		await deleteMembershipPlan(id);
		await reload();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">会员管理</span>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
						<CreditCardIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold">会员管理</h1>
						<p className="text-xs text-base-content/50">Membership Plans — {plans.length} 个计划</p>
					</div>
				</div>
				<button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
					<PlusIcon className="h-4 w-4" /> 新建计划
				</button>
			</div>

			{/* Plan Cards */}
			{loading ? (
				<div className="grid gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-base-200" />)}
				</div>
			) : plans.length === 0 ? (
				<div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-base-300 text-base-content/30">
					暂无会员计划
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{plans.map((p) => (
						<div key={p.id} className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-lg font-bold">{p.name || "未命名"}</h3>
									<p className="mt-1 text-xs text-base-content/50">{p.duration || "—"}</p>
								</div>
								<span className={`badge ${p.status === "active" ? "badge-success" : "badge-ghost"}`}>
									{p.status || "active"}
								</span>
							</div>
							<p className="mt-4 text-3xl font-bold tabular-nums">
								¥{p.price?.toLocaleString() ?? "0"}
								<span className="text-sm font-normal text-base-content/50">/{p.duration === "yearly" ? "年" : "月"}</span>
							</p>
							{p.features && p.features.length > 0 && (
								<ul className="mt-4 space-y-1 text-sm text-base-content/70">
									{p.features.map((f) => <li key={f}>• {f}</li>)}
								</ul>
							)}
							<p className="mt-4 text-xs text-base-content/50">
								{p.subscriberCount ?? 0} 位订阅者 · 创建于 {p.createdAt?.slice(0, 10) || "—"}
							</p>
							<div className="mt-4 flex gap-2">
								<button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
									<PencilSquareIcon className="h-4 w-4" /> 编辑
								</button>
								<button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(p.id)}>
									<TrashIcon className="h-4 w-4" /> 删除
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-xl">
						<h3 className="text-lg font-bold">{editing ? "编辑计划" : "新建计划"}</h3>
						<div className="mt-4 space-y-3">
							<label className="form-control w-full">
								<div className="label"><span className="label-text">计划名称</span></div>
								<input className="input input-bordered w-full" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Pro" />
							</label>
							<label className="form-control w-full">
								<div className="label"><span className="label-text">价格 (¥)</span></div>
								<input className="input input-bordered w-full" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="99" />
							</label>
							<label className="form-control w-full">
								<div className="label"><span className="label-text">有效期</span></div>
								<select className="select select-bordered w-full" value={formDuration} onChange={(e) => setFormDuration(e.target.value)}>
									<option value="monthly">月付</option>
									<option value="yearly">年付</option>
								</select>
							</label>
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
							<button type="button" className="btn btn-primary btn-sm" disabled={saving || !formName} onClick={handleSave}>
								{saving ? "保存中…" : "保存"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
