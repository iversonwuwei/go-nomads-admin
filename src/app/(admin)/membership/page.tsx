"use client";

import {
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
}heroiconsreact24outline
PencilLinkAdminFinextlink
	AdminFonuseEffectn useState }ershipPreactin / system - workspace
} from AdminTabletype; Memaappcomponentsadmin / admin - table
	update{
	AdminField,
		AdminFormGrid,
		AdminModal,
		AdminWorkspace,
		AdminWorkspaceBreadcrumb,
		AdminWorkspaceHero,
		AdminWorkspaceSection,
}ershipP @/app/componentsadmin/system-workspace
@/app/li
createMembershipPlan,
	deleteMembershipPlan,
	fetchMembershipPlansi
typeMembershipPlanDto,
	updateMembershipPlan,
	@/app/lib / admin - api

function formatCount(value: number) {
	return new Intl.NumberFormat("zh-CN").format(value);
}

function getDurationLabel(duration?: string) {
	if (duration === "yearly") return "年付";
	if (duration === "monthly") return "月付";
	return duration || "未设置周期";
}

function formatPrice(plan: MembershipPlanDto) {
	const currency = plan.currency || "¥";
	if (plan.price != null) return `${currency}${formatCount(plan.price)}`;
	return `${currency}0`;
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
		return () => {
			active = false;
		};
	}, []);

	const activeCount = plans.filter((plan) => (plan.status || "active") === "active").length;
	const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscriberCount ?? 0), 0);
	const avgPrice = plans.length > 0
		? Math.round(plans.reduce((sum, plan) => sum + (plan.price ?? 0), 0) / plans.length)
		: 0;
	const aiEnabledCount = plans.filter((plan) => plan.canUseAI).length;
	const moderatorEligibleCount = plans.filter((plan) => plan.canApplyModerator).length;

	function openCreate() {
		setEditing(null);
		setFormName("");
		setFormPrice("");
		setFormDuration("monthly");
		setShowForm(true);
	}

	function openEdit(plan: MembershipPlanDto) {
		setEditing(plan);
		setFormName(plan.name || "");
		setFormPrice(String(plan.price ?? ""));
		setFormDuration(plan.duration || "monthly");
		setShowForm(true);
	}

	async function reload() {
		setLoading(true);
		const res = await fetchMembershipPlans();
		if (res.ok && res.data) setPlans(res.data);
		setLoading(false);
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

	async function handleDelete(id: string) {
		if (!confirm("确定删除此会员计划？")) return;
		await deleteMembershipPlan(id);
		await reload();
	}

	return (
		<AdminWorkspace>
			<AdminWorkspaceBreadcrumb
				items={[
					{ label: "数据中心", href: "/dashboard" },
					{ label: "用户与商业化", href: "/membership" },
					{ label: "会员管理" },
				]}
			/>

			<AdminWorkspaceHero
				eyebrow="Monetization Control"
				title="会员管理"
				description="会员页不是单纯的价格表，而是 App 商业化控制面。这里定义的是用户愿意为什么付费、能获得哪些能力，以及这些权益如何转化为长期留存。"
				actions={
					<>
						<button type="button" className="btn btn-primary rounded-2xl px-5" onClick={openCreate}>
							<PlusIcon className="h-4 w-4" /> 新建计划
						</button>
						<Link href="/app-control" className="btn btn-outline rounded-2xl px-5">
							返回 App 控制台
						</Link>
					</>
				}
				stats={[
					{ label: "Total Plans", value: formatCount(plans.length), hint: "当前可配置的会员套餐数" },
					{ label: "Total Subscribers", value: formatCount(totalSubscribers), hint: "现有计划累计订阅人数" },
					{ label: "Average Price", value: `¥${formatCount(avgPrice)}`, hint: "当前计划平均定价" },
				]}
			/>

			<AdminWorkspaceSection
				title="Portfolio Signals"
				description="先看启用状态、AI 权益和版主资格，再进入计划矩阵调整价格与能力边界。"
			>
				<div className="admin-signal-grid">
					<article className="admin-signal-card">
						<span>启用计划</span>
						<strong>{formatCount(activeCount)}</strong>
						<p>当前面向用户可见并可购买的计划数量。</p>
					</article>
					<article className="admin-signal-card">
						<span>AI Enabled</span>
						<strong>{formatCount(aiEnabledCount)}</strong>
						<p>开放 AI 使用权限的计划数量。</p>
					</article>
					<article className="admin-signal-card">
						<span>Moderator Eligible</span>
						<strong>{formatCount(moderatorEligibleCount)}</strong>
						<p>允许申请版主资格的计划数量。</p>
					</article>
					<article className="admin-signal-card">
						<span>Pricing Focus</span>
						<strong>价格 / 权益 / 周期</strong>
						<p>本页优先治理价格分层、能力开关与订阅承接。</p>
					</article>
				</div>
			</AdminWorkspaceSection>

			<AdminWorkspaceSection
				title="Plan Matrix"
				description="统一审视计划名称、定价、关键能力、订阅人数与状态，并保留详情、编辑和删除动作。"
			>
				<AdminTable
					headers={["计划", "价格与周期", "能力边界", "订阅人数", "状态", "创建时间", "操作"]}
					hasRows={!loading && plans.length > 0}
					colSpan={7}
					emptyMessage={loading ? "加载中…" : "暂无会员计划"}
					meta={
						<>
							<div>
								<span className="admin-table-meta-label">Current Portfolio</span>
								<span className="admin-table-meta-value">{plans.length}</span>
							</div>
							<p className="admin-table-meta-copy">列表保留的是商业化治理动作，详情页则负责解释权益、订阅者与计划上下文。</p>
						</>
					}
				>
					{plans.map((plan) => (
						<tr key={plan.id}>
							<td>
								<div className="admin-entity-copy">
									<Link href={`/membership/${plan.id}`} className="admin-entity-title text-primary hover:underline">
										{plan.name || "未命名计划"}
									</Link>
									<span className="admin-entity-subtitle">
										Level {plan.level ?? "—"} · {plan.description || "商业化分层计划"}
									</span>
								</div>
							</td>
							<td>
								<div className="space-y-1.5">
									<p className="text-sm font-semibold text-base-content">{formatPrice(plan)}</p>
									<p className="text-xs text-base-content/55">{getDurationLabel(plan.duration)}</p>
									{plan.priceMonthly != null || plan.priceYearly != null ? (
										<p className="text-[11px] text-base-content/50">
											月付 {plan.priceMonthly ?? "—"} / 年付 {plan.priceYearly ?? "—"}
										</p>
									) : null}
								</div>
							</td>
							<td>
								<div className="flex flex-wrap gap-1.5">
									<span className={`badge badge-sm ${plan.canUseAI ? "badge-info" : "badge-ghost"}`}>
										AI {plan.canUseAI ? "开启" : "关闭"}
									</span>
									<span className={`badge badge-sm ${plan.canApplyModerator ? "badge-success" : "badge-ghost"}`}>
										版主 {plan.canApplyModerator ? "可申请" : "不可申请"}
									</span>
									{plan.aiUsageLimit != null ? (
										<span className="badge badge-sm badge-outline">AI 配额 {plan.aiUsageLimit}</span>
									) : null}
								</div>
							</td>
							<td className="tabular-nums">{formatCount(plan.subscriberCount ?? 0)}</td>
							<td>
								<span className={`badge badge-sm ${(plan.status || "active") === "active" ? "badge-success" : "badge-ghost"}`}>
									{(plan.status || "active") === "active" ? "启用" : plan.status || "—"}
								</span>
							</td>
							<td className="text-xs text-base-content/55">{plan.createdAt?.slice(0, 10) || "—"}</td>
							<td>
								<div className="flex items-center justify-end gap-1">
									<Link href={`/membership/${plan.id}`} className="btn btn-ghost btn-xs rounded-xl">
										详情
									</Link>
									<button type="button" className="btn btn-ghost btn-xs rounded-xl" onClick={() => openEdit(plan)}>
										<PencilSquareIcon className="h-4 w-4" />
									</button>
									<button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(plan.id)}>
										<TrashIcon className="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</AdminTable>
			</AdminWorkspaceSection>

			<AdminModal
				open={showForm}
				title={editing ? "编辑会员计划" : "新建会员计划"}
				description="这里配置的是付费产品，而不是单纯字段。请确认名称、价格与周期能表达清晰的价值分层。"
				onClose={() => setShowForm(false)}
				actions={
					<>
						<button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>取消</button>
						<button type="button" className="btn btn-primary btn-sm" disabled={saving || !formName} onClick={handleSave}>
							{saving ? "保存中…" : "保存计划"}
						</button>
					</>
				}
			>
				<AdminFormGrid>
					<AdminField label="计划名称">
						<input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Pro" />
					</AdminField>
					<AdminField label="价格 (¥)">
						<input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="99" />
					</AdminField>
					<AdminField label="有效期" hint="当前创建接口仍以基础周期为主，复杂权益在详情中查看。">
						<select value={formDuration} onChange={(e) => setFormDuration(e.target.value)}>
							<option value="monthly">月付</option>
							<option value="yearly">年付</option>
						</select>
					</AdminField>
				</AdminFormGrid>
			</AdminModal>
		</AdminWorkspace>
	);
}
