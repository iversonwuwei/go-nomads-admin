"use client";

import AdminTable from "@/app/components/admin/admin-table";
import {
	AdminField,
	AdminFormGrid,
	AdminModal,
	AdminWorkspace,
	AdminWorkspaceHero,
	AdminWorkspaceSection,
	AdminWorkspaceToolbar,
} from "@/app/components/admin/system-workspace";
import {
	type ConfigSnapshotDto,
	createSystemSetting,
	deleteSystemSetting,
	fetchConfigSnapshots,
	fetchSystemSettingById,
	fetchSystemSettings,
	type SystemSettingDto,
	updateSystemSetting,
} from "@/app/lib/admin-api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type Section = "general" | "moderation" | "ai" | "notification" | "maintenance";
type PanelMode = "create" | "edit" | "view" | null;

type SettingFormState = {
	section: Section;
	settingKey: string;
	label: string;
	description: string;
	valueType: string;
	value: string;
	defaultValue: string;
	isActive: boolean;
	isSecret: boolean;
	sortOrder: number;
};

const TABS: { key: Section; label: string; note: string }[] = [
	{ key: "general", label: "基本设置", note: "平台基础配置与默认行为" },
	{ key: "moderation", label: "审核设置", note: "治理阈值与审核动作参数" },
	{ key: "ai", label: "AI 设置", note: "默认模型、配额和生成参数" },
	{ key: "notification", label: "通知设置", note: "消息保留与投递策略" },
	{ key: "maintenance", label: "系统维护", note: "运维开关与维护流程参数" },
];

const EMPTY_FORM: SettingFormState = {
	section: "general",
	settingKey: "",
	label: "",
	description: "",
	valueType: "string",
	value: "",
	defaultValue: "",
	isActive: true,
	isSecret: false,
	sortOrder: 10,
};

function formatDateLabel(value?: string): string {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function toFormState(setting?: SystemSettingDto | null): SettingFormState {
	if (!setting) return EMPTY_FORM;
	return {
		section: (setting.section as Section) || "general",
		settingKey: setting.settingKey || "",
		label: setting.label || "",
		description: setting.description || "",
		valueType: setting.valueType || "string",
		value: setting.value || "",
		defaultValue: setting.defaultValue || "",
		isActive: Boolean(setting.isActive),
		isSecret: Boolean(setting.isSecret),
		sortOrder: setting.sortOrder ?? 10,
	};
}

export default function SettingsPage() {
	const [section, setSection] = useState<Section>("general");
	const [settings, setSettings] = useState<SystemSettingDto[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [snapshots, setSnapshots] = useState<ConfigSnapshotDto[]>([]);
	const [panelMode, setPanelMode] = useState<PanelMode>(null);
	const [selectedSetting, setSelectedSetting] = useState<SystemSettingDto | null>(null);
	const [form, setForm] = useState<SettingFormState>(EMPTY_FORM);
	const [detailLoading, setDetailLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	const loadSettings = useCallback(async () => {
		const res = await fetchSystemSettings({ page: 1, pageSize: 100, section });
		if (!res.ok || !res.data) {
			setSettings([]);
			setError(res.message || "系统配置读取失败");
			setLoading(false);
			return;
		}

		setSettings(res.data.items);
		setError(null);
		setLoading(false);
	}, [section]);

	useEffect(() => {
		let cancelled = false;
		queueMicrotask(() => {
			if (!cancelled) {
				void loadSettings();
			}
		});

		return () => {
			cancelled = true;
		};
	}, [loadSettings]);

	useEffect(() => {
		void (async () => {
			const res = await fetchConfigSnapshots({ page: 1, pageSize: 5 });
			if (res.ok && res.data) {
				setSnapshots(res.data.items);
			}
		})();
	}, []);

	const filteredSettings = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		if (!normalized) return settings;

		return settings.filter((setting) =>
			[setting.settingKey, setting.label, setting.description, setting.value]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(normalized)),
		);
	}, [settings, search]);

	const activeCount = useMemo(
		() => settings.filter((setting) => setting.isActive).length,
		[settings],
	);

	const secretCount = useMemo(
		() => settings.filter((setting) => setting.isSecret).length,
		[settings],
	);

	function openCreatePanel() {
		setSelectedSetting(null);
		setForm({ ...EMPTY_FORM, section });
		setPanelMode("create");
	}

	async function openPanel(mode: Exclude<PanelMode, null | "create">, setting: SystemSettingDto) {
		setPanelMode(mode);
		setDetailLoading(true);
		const res = await fetchSystemSettingById(setting.id);
		if (!res.ok || !res.data) {
			setError(res.message || "系统配置详情读取失败");
			setPanelMode(null);
			setDetailLoading(false);
			return;
		}

		setSelectedSetting(res.data);
		setForm(toFormState(res.data));
		setDetailLoading(false);
	}

	function closePanel() {
		setPanelMode(null);
		setSelectedSetting(null);
		setForm(EMPTY_FORM);
		setDetailLoading(false);
	}

	function handleSubmit() {
		startTransition(() => {
			void (async () => {
				const payload = {
					section: form.section,
					settingKey: form.settingKey.trim(),
					label: form.label.trim(),
					description: form.description.trim(),
					valueType: form.valueType,
					value: form.value,
					defaultValue: form.defaultValue,
					isActive: form.isActive,
					isSecret: form.isSecret,
					sortOrder: Number(form.sortOrder || 0),
				};

				if (!payload.settingKey || !payload.label) {
					setError("settingKey 和 label 不能为空");
					return;
				}

				const res =
					panelMode === "edit" && selectedSetting
						? await updateSystemSetting(selectedSetting.id, payload)
						: await createSystemSetting(payload);

				if (!res.ok) {
					setError(res.message || "系统配置保存失败");
					return;
				}

				closePanel();
				setLoading(true);
				await loadSettings();
			})();
		});
	}

	async function handleDelete(setting: SystemSettingDto) {
		if (!window.confirm(`确认删除配置项“${setting.label || setting.settingKey}”吗？`)) return;

		startTransition(() => {
			void (async () => {
				const res = await deleteSystemSetting(setting.id);
				if (!res.ok) {
					setError(res.message || "系统配置删除失败");
					return;
				}

				setLoading(true);
				await loadSettings();
			})();
		});
	}

	const latestSnapshot = snapshots[0];
	const isReadOnly = panelMode === "view";

	return (
		<AdminWorkspace>
			<AdminWorkspaceHero
				eyebrow="System / Settings"
				title="系统配置治理"
				description="系统配置现在由真实实体承载，并纳入配置发布快照链路；这页负责 CRUD，发布和回滚继续走配置发布台。"
				actions={
					<div className="flex flex-wrap gap-3">
						<Link href="/app-control/config-publish" className="btn btn-outline">
							配置发布台
						</Link>
						<button type="button" className="btn btn-primary" onClick={openCreatePanel}>
							新建配置项
						</button>
					</div>
				}
				stats={[
					{ label: "当前分组配置", value: String(settings.length), hint: TABS.find((tab) => tab.key === section)?.note || "-" },
					{ label: "启用配置", value: String(activeCount), hint: "当前 section 中处于 active 状态的项" },
					{ label: "最新快照", value: latestSnapshot?.version || "-", hint: latestSnapshot ? `发布于 ${formatDateLabel(latestSnapshot.publishedAt || latestSnapshot.createdAt)}` : "尚未读取到快照" },
				]}
			/>

			<AdminWorkspaceSection
				title="配置域"
				description="按配置 section 做分组治理，所有字段都遵循统一的输入控件高度、间距和说明文字层级。"
			>
				<div className="flex flex-wrap gap-2">
					{TABS.map((tab) => (
						<button
							type="button"
							key={tab.key}
							className={`btn ${section === tab.key ? "btn-primary" : "btn-outline"}`}
							onClick={() => {
								setLoading(true);
								setSection(tab.key);
							}}
						>
							{tab.label}
						</button>
					))}
				</div>
			</AdminWorkspaceSection>

			<AdminWorkspaceSection
				title="配置项列表"
				description="支持按 section 切换、搜索、查看详情、编辑、删除，并直接看到是否 active / secret。"
			>
				<AdminWorkspaceToolbar>
					<label className="admin-field">
						<span className="admin-field-label">搜索配置项</span>
						<span className="admin-field-hint">按 key、标签、说明或值筛选</span>
						<span className="admin-field-control">
							<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例如 platform_name / default_model / retention" />
						</span>
					</label>
					<article className="admin-workspace-stat">
						<span>当前视图</span>
						<strong>{filteredSettings.length}</strong>
						<p>{loading ? "正在同步配置列表..." : "受搜索条件影响"}</p>
					</article>
					<article className="admin-workspace-stat">
						<span>Secret 配置</span>
						<strong>{secretCount}</strong>
						<p>标记为敏感项，便于后续接入脱敏策略</p>
					</article>
					<article className="admin-workspace-stat">
						<span>最近更新</span>
						<strong>{formatDateLabel(settings[0]?.updatedAt)}</strong>
						<p>快速判断当前 section 是否有近期变更</p>
					</article>
				</AdminWorkspaceToolbar>

				{error ? (
					<div className="alert alert-warning mt-4">
						<span>{error}</span>
					</div>
				) : null}

				<div className="mt-4">
					<AdminTable
						headers={["Key / 标签", "类型", "当前值", "状态", "更新时间", "操作"]}
						hasRows={!loading && filteredSettings.length > 0}
						emptyMessage={loading ? "系统配置加载中..." : "当前配置域暂无数据"}
					>
						{filteredSettings.map((setting) => (
							<tr key={setting.id}>
								<td>
									<div className="space-y-1">
										<p className="font-semibold text-base-content">{setting.label || setting.settingKey}</p>
										<p className="text-xs text-base-content/50">{setting.settingKey}</p>
									</div>
								</td>
								<td>{setting.valueType || "string"}</td>
								<td className="max-w-xs truncate">{setting.value || "-"}</td>
								<td>
									<div className="flex flex-wrap gap-2">
										<span className={`badge badge-sm ${setting.isActive ? "badge-success" : "badge-ghost"}`}>{setting.isActive ? "active" : "inactive"}</span>
										{setting.isSecret ? <span className="badge badge-sm badge-warning">secret</span> : null}
									</div>
								</td>
								<td className="text-sm text-base-content/60">{formatDateLabel(setting.updatedAt)}</td>
								<td>
									<div className="flex flex-wrap gap-2">
										<button type="button" className="btn btn-xs btn-outline" onClick={() => void openPanel("view", setting)}>
											详情
										</button>
										<button type="button" className="btn btn-xs btn-outline" onClick={() => void openPanel("edit", setting)}>
											编辑
										</button>
										<button type="button" className="btn btn-xs btn-error btn-outline" onClick={() => void handleDelete(setting)}>
											删除
										</button>
									</div>
								</td>
							</tr>
						))}
					</AdminTable>
				</div>
			</AdminWorkspaceSection>

			<AdminModal
				open={panelMode !== null}
				title={panelMode === "create" ? "新建配置项" : panelMode === "edit" ? `编辑配置 · ${selectedSetting?.label || ""}` : `配置详情 · ${selectedSetting?.label || ""}`}
				description="配置项使用统一的数据模型：section、settingKey、valueType、value、默认值和状态。"
				onClose={closePanel}
				actions={
					panelMode === "view" ? null : (
						<>
							<button type="button" className="btn btn-ghost" onClick={closePanel}>
								取消
							</button>
							<button type="button" className="btn btn-primary" disabled={isPending || detailLoading} onClick={handleSubmit}>
								{isPending ? "保存中..." : panelMode === "edit" ? "保存修改" : "创建配置"}
							</button>
						</>
					)
				}
			>
				{detailLoading ? (
					<p className="text-sm text-base-content/60">详情加载中...</p>
				) : (
					<div className="space-y-6">
						<AdminFormGrid>
							<AdminField label="Section" hint="决定该配置在后台中的治理域。">
								<select
									value={form.section}
									disabled={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, section: event.target.value as Section }))}
								>
									{TABS.map((tab) => (
										<option key={tab.key} value={tab.key}>
											{tab.key}
										</option>
									))}
								</select>
							</AdminField>
							<AdminField label="Setting Key" hint="用于后端读取和发布快照的稳定键。">
								<input
									value={form.settingKey}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, settingKey: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="标签" hint="后台主展示名，面向运营和管理员。">
								<input
									value={form.label}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="值类型" hint="当前支持 string / number / boolean / json。">
								<select
									value={form.valueType}
									disabled={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, valueType: event.target.value }))}
								>
									<option value="string">string</option>
									<option value="number">number</option>
									<option value="boolean">boolean</option>
									<option value="json">json</option>
								</select>
							</AdminField>
							<AdminField label="当前值" hint="若为 json，请直接输入 JSON 字符串。">
								<input
									value={form.value}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="默认值" hint="用于识别偏离默认配置的差异。">
								<input
									value={form.defaultValue}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, defaultValue: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="排序权重" hint="同 section 内按 sortOrder 升序展示。">
								<input
									type="number"
									value={form.sortOrder}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value || 0) }))}
								/>
							</AdminField>
						</AdminFormGrid>

							<AdminField label="描述" hint="说明配置的业务作用、影响面和调整边界。">
								<textarea
									value={form.description}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
								/>
							</AdminField>

							<div className="grid gap-4 md:grid-cols-2">
								<AdminField label="是否启用" hint="关闭后不参与 active 配置集与发布快照。">
									<div className="flex items-center gap-3 pt-2">
										<input
											type="checkbox"
											checked={form.isActive}
											disabled={isReadOnly}
											onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
										/>
										<span className="text-sm text-base-content/70">active</span>
									</div>
								</AdminField>
								<AdminField label="敏感配置" hint="后续可接入脱敏与权限细分策略。">
									<div className="flex items-center gap-3 pt-2">
										<input
											type="checkbox"
											checked={form.isSecret}
											disabled={isReadOnly}
											onChange={(event) => setForm((current) => ({ ...current, isSecret: event.target.checked }))}
										/>
										<span className="text-sm text-base-content/70">secret</span>
									</div>
								</AdminField>
							</div>
						</div>
				)}
			</AdminModal>
		</AdminWorkspace>
	);
}
