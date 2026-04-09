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

function formatCount(value: number) {
	return new Intl.NumberFormat("zh-CN").format(value);
}

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

	const activeCount = plans.filter((plan) => (plan.status || "active") === "active").length;
	const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscriberCount ?? 0), 0);
	const avgPrice = plans.length > 0
		? Math.round(plans.reduce((sum, plan) => sum + (plan.price ?? 0), 0) / plans.length)
		: 0;

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
		<div className="control-page">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">会员管理</span>
			</div>

			<header className="control-hero p-6 md:p-8">
				<div className="dashboard-hero-grid">
					<div className="space-y-5">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
									<CreditCardIcon className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Monetization</p>
									<h1 className="text-3xl font-bold">会员管理</h1>
									<p className="mt-1 text-sm text-base-content/60">Membership plans 决定转化、订阅和长期留存策略</p>
								</div>
							</div>
							<button type="button" className="btn btn-primary rounded-2xl px-5" onClick={openCreate}>
								<PlusIcon className="h-4 w-4" /> 新建计划
							</button>
						</div>
						<p className="max-w-3xl text-sm leading-6 text-base-content/70">这个页面不是纯 CRUD，它是 App 商业化配置页。你在这里定义的是用户愿意为什么付费，以及该如何分层定价。</p>
						<div className="control-summary-grid">
							<div className="control-summary-card">
								<span>Total Plans</span>
								<strong>{formatCount(plans.length)}</strong>
								<p>当前可配置的会员套餐数</p>
							</div>
							<div className="control-summary-card">
								<span>Total Subscribers</span>
								<strong>{formatCount(totalSubscribers)}</strong>
								<p>现有计划累计订阅人数</p>
							</div>
							<div className="control-summary-card">
								<span>Average Price</span>
								<strong>¥{formatCount(avgPrice)}</strong>
								<p>当前计划平均定价</p>
							</div>
						</div>
					</div>

					<div className="admin-panel rounded-3xl p-5">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">Pricing Focus</p>
						<div className="mt-4 space-y-3">
							<div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">启用计划</span><span className="font-semibold">{formatCount(activeCount)}</span></div></div>
							<div className="control-mini-stat"><div className="flex items-center justify-between text-sm"><span className="text-base-content/60">当前重点</span><span className="font-semibold">价格 / 权益 / 续费周期</span></div></div>
						</div>
					</div>
				</div>
			</header>

			<section className="control-area">
				<div className="control-area-header">
					<p className="control-area-label">Area 01</p>
					<div className="control-area-title-row">
						<div>
							<h2 className="control-area-title">套餐结果区</h2>
							<p className="control-area-muted">这一块直接承载会员计划结果卡片。用户能清楚知道这里是在比较套餐结构、价格和订阅表现。</p>
						</div>
					</div>
				</div>
				<div className="control-area-body">
					<div className="control-focus-bar">
						<div className="control-focus-item"><span>Focus</span><strong>权益配置与价格分层</strong></div>
						<div className="control-focus-item"><span>Boundary</span><strong>此区只展示套餐结果，不承载创建表单</strong></div>
					</div>

					{loading ? (
						<div className="mt-5 grid gap-4 md:grid-cols-3">
							{[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-base-200" />)}
						</div>
					) : plans.length === 0 ? (
							<div className="mt-5 flex h-64 items-center justify-center rounded-2xl border border-dashed border-base-300 text-base-content/30">
								暂无会员计划
							</div>
						) : (
								<div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{plans.map((p) => (
										<div key={p.id} className="control-stage-card p-6">
							<div className="flex items-start justify-between">
								<div>
													<Link href={`/membership/${p.id}`} className="text-lg font-bold text-primary hover:underline">
														{p.name || "未命名"}
													</Link>
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
												<Link href={`/membership/${p.id}`} className="btn btn-ghost btn-sm">
													详情
												</Link>
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
				</div>
			</section>

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-xl">
						<h3 className="text-lg font-bold">{editing ? "编辑计划" : "新建计划"}</h3>
						<p className="mt-1 text-sm text-base-content/60">这里配置的是付费产品，不只是字段。请确认名称、价格和周期能反映清晰的用户价值分层。</p>
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
