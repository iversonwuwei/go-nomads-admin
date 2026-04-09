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
	createLegalDocument,
	deleteLegalDocument,
	fetchLegalDocumentById,
	fetchLegalDocuments,
	type LegalDocumentDetailDto,
	type LegalDocumentDto,
	updateLegalDocument,
} from "@/app/lib/admin-api";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type PanelMode = "create" | "edit" | "view" | null;

type LegalFormState = {
	documentType: string;
	version: string;
	language: string;
	title: string;
	effectiveDate: string;
	isCurrent: boolean;
	sectionsJson: string;
	summaryJson: string;
	sdkListJson: string;
};

const EMPTY_FORM: LegalFormState = {
	documentType: "privacy-policy",
	version: "1.0.0",
	language: "zh",
	title: "",
	effectiveDate: new Date().toISOString().slice(0, 16),
	isCurrent: true,
	sectionsJson: "[]",
	summaryJson: "[]",
	sdkListJson: "[]",
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

function toPrettyJson(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

function toFormState(document?: LegalDocumentDetailDto | null): LegalFormState {
	if (!document) return EMPTY_FORM;

	return {
		documentType: document.documentType || "privacy-policy",
		version: document.version || "1.0.0",
		language: document.language || "zh",
		title: document.title || "",
		effectiveDate: document.effectiveDate ? new Date(document.effectiveDate).toISOString().slice(0, 16) : EMPTY_FORM.effectiveDate,
		isCurrent: Boolean(document.isCurrent),
		sectionsJson: toPrettyJson(document.sections || []),
		summaryJson: toPrettyJson(document.summary || []),
		sdkListJson: toPrettyJson(document.sdkList || []),
	};
}

export default function LegalPage() {
	const [documents, setDocuments] = useState<LegalDocumentDto[]>([]);
	const [search, setSearch] = useState("");
	const [documentType, setDocumentType] = useState("");
	const [language, setLanguage] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [panelMode, setPanelMode] = useState<PanelMode>(null);
	const [selectedDocument, setSelectedDocument] = useState<LegalDocumentDetailDto | null>(null);
	const [form, setForm] = useState<LegalFormState>(EMPTY_FORM);
	const [detailLoading, setDetailLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	const loadDocuments = useCallback(async () => {
		setLoading(true);
		const res = await fetchLegalDocuments({ page: 1, pageSize: 100, documentType, language });
		if (!res.ok || !res.data) {
			setDocuments([]);
			setError(res.message || "法律文档读取失败");
			setLoading(false);
			return;
		}

		setDocuments(res.data.items);
		setError(null);
		setLoading(false);
	}, [documentType, language]);

	useEffect(() => {
		void loadDocuments();
	}, [loadDocuments]);

	const filteredDocuments = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		if (!normalized) return documents;

		return documents.filter((document) =>
			[document.title, document.documentType, document.version, document.language]
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(normalized)),
		);
	}, [documents, search]);

	const publishedCount = useMemo(
		() => documents.filter((document) => document.status === "published").length,
		[documents],
	);

	const languageCount = useMemo(
		() => new Set(documents.map((document) => document.language).filter(Boolean)).size,
		[documents],
	);

	function openCreatePanel() {
		setSelectedDocument(null);
		setForm(EMPTY_FORM);
		setPanelMode("create");
	}

	async function openPanel(mode: Exclude<PanelMode, null | "create">, document: LegalDocumentDto) {
		setPanelMode(mode);
		setDetailLoading(true);
		const res = await fetchLegalDocumentById(document.id);
		if (!res.ok || !res.data) {
			setError(res.message || "法律文档详情读取失败");
			setPanelMode(null);
			setDetailLoading(false);
			return;
		}

		setSelectedDocument(res.data);
		setForm(toFormState(res.data));
		setDetailLoading(false);
	}

	function closePanel() {
		setPanelMode(null);
		setSelectedDocument(null);
		setForm(EMPTY_FORM);
		setDetailLoading(false);
	}

	function parseJsonField(fieldLabel: string, raw: string) {
		try {
			const parsed = JSON.parse(raw || "[]");
			if (!Array.isArray(parsed)) {
				throw new Error(`${fieldLabel} 必须是 JSON 数组`);
			}
			return parsed;
		} catch (parseError) {
			throw new Error(`${fieldLabel} 格式错误: ${String(parseError)}`);
		}
	}

	function handleSubmit() {
		startTransition(() => {
			void (async () => {
				try {
					const payload = {
						documentType: form.documentType,
						version: form.version,
						language: form.language,
						title: form.title.trim(),
						effectiveDate: new Date(form.effectiveDate).toISOString(),
						isCurrent: form.isCurrent,
						sections: parseJsonField("Sections", form.sectionsJson),
						summary: parseJsonField("Summary", form.summaryJson),
						sdkList: parseJsonField("SDK List", form.sdkListJson),
					};

					if (!payload.title) {
						setError("标题不能为空");
						return;
					}

					const res =
						panelMode === "edit" && selectedDocument
							? await updateLegalDocument(selectedDocument.id, payload)
							: await createLegalDocument(payload);

					if (!res.ok) {
						setError(res.message || "法律文档保存失败");
						return;
					}

					closePanel();
					await loadDocuments();
				} catch (submitError) {
					setError(String(submitError));
				}
			})();
		});
	}

	async function handleDelete(document: LegalDocumentDto) {
		if (!window.confirm(`确认删除文档“${document.title || document.documentType}”吗？`)) return;

		startTransition(() => {
			void (async () => {
				const res = await deleteLegalDocument(document.id);
				if (!res.ok) {
					setError(res.message || "法律文档删除失败");
					return;
				}

				await loadDocuments();
			})();
		});
	}

	const isReadOnly = panelMode === "view";

	return (
		<AdminWorkspace>
			<AdminWorkspaceHero
				eyebrow="System / Legal"
				title="法律文档治理"
				description="对隐私政策、服务协议等法务内容执行真正可维护的 CRUD workflow，并让版本、语言、状态和结构化内容在后台可直接治理。"
				actions={
					<button type="button" className="btn btn-primary" onClick={openCreatePanel}>
						新建法律文档
					</button>
				}
				stats={[
					{ label: "文档总数", value: String(documents.length), hint: "当前筛选范围内已加载文档" },
					{ label: "已发布版本", value: String(publishedCount), hint: "标记 current 的文档版本" },
					{ label: "覆盖语言", value: String(languageCount), hint: "用于评估多语言法务完整度" },
				]}
			/>

			<AdminWorkspaceSection
				title="文档列表"
				description="在列表视图直接识别类型、语言、版本和发布状态，并从同页进入详情、编辑和删除。"
			>
				<AdminWorkspaceToolbar>
					<label className="admin-field">
						<span className="admin-field-label">搜索文档</span>
						<span className="admin-field-hint">按标题、类型、版本或语言检索</span>
						<span className="admin-field-control">
							<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例如 privacy-policy / terms / zh" />
						</span>
					</label>
					<label className="admin-field">
						<span className="admin-field-label">文档类型</span>
						<span className="admin-field-hint">聚焦一个法务域进行治理</span>
						<span className="admin-field-control">
							<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
								<option value="">全部类型</option>
								<option value="privacy-policy">privacy-policy</option>
								<option value="terms-of-service">terms-of-service</option>
							</select>
						</span>
					</label>
					<label className="admin-field">
						<span className="admin-field-label">语言</span>
						<span className="admin-field-hint">用于核查多语言版本覆盖情况</span>
						<span className="admin-field-control">
							<select value={language} onChange={(event) => setLanguage(event.target.value)}>
								<option value="">全部语言</option>
								<option value="zh">zh</option>
								<option value="en">en</option>
							</select>
						</span>
					</label>
					<article className="admin-workspace-stat">
						<span>当前视图</span>
						<strong>{filteredDocuments.length}</strong>
						<p>{loading ? "正在同步列表..." : "受搜索与筛选条件影响"}</p>
					</article>
				</AdminWorkspaceToolbar>

				{error ? (
					<div className="alert alert-warning mt-4">
						<span>{error}</span>
					</div>
				) : null}

				<div className="mt-4">
					<AdminTable
						headers={["类型 / 标题", "语言", "版本", "状态", "生效时间", "操作"]}
						hasRows={!loading && filteredDocuments.length > 0}
						emptyMessage={loading ? "法律文档加载中..." : "暂无法律文档"}
					>
						{filteredDocuments.map((document) => (
							<tr key={document.id}>
								<td>
									<div className="space-y-1">
										<p className="font-semibold text-base-content">{document.title || document.documentType}</p>
										<p className="text-xs text-base-content/50">{document.documentType}</p>
									</div>
								</td>
								<td>{document.language || "-"}</td>
								<td className="font-semibold">{document.version || "-"}</td>
								<td>
									<span className="badge badge-outline badge-sm">{document.status || "unknown"}</span>
								</td>
								<td className="text-sm text-base-content/60">{formatDateLabel(document.effectiveDate)}</td>
								<td>
									<div className="flex flex-wrap gap-2">
										<button type="button" className="btn btn-xs btn-outline" onClick={() => void openPanel("view", document)}>
											详情
										</button>
										<button type="button" className="btn btn-xs btn-outline" onClick={() => void openPanel("edit", document)}>
											编辑
										</button>
										<button type="button" className="btn btn-xs btn-error btn-outline" onClick={() => void handleDelete(document)}>
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
				title={panelMode === "create" ? "新建法律文档" : panelMode === "edit" ? `编辑文档 · ${selectedDocument?.title || ""}` : `文档详情 · ${selectedDocument?.title || ""}`}
				description="法务结构化内容当前以 JSON 数组方式维护，保证 sections / summary / sdkList 能与后端契约完全对齐。"
				onClose={closePanel}
				actions={
					panelMode === "view" ? null : (
						<>
							<button type="button" className="btn btn-ghost" onClick={closePanel}>
								取消
							</button>
							<button type="button" className="btn btn-primary" disabled={isPending || detailLoading} onClick={handleSubmit}>
								{isPending ? "保存中..." : panelMode === "edit" ? "保存修改" : "创建文档"}
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
							<AdminField label="文档类型" hint="同类型同语言同版本不允许重复。">
								<select
									value={form.documentType}
									disabled={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, documentType: event.target.value }))}
								>
									<option value="privacy-policy">privacy-policy</option>
									<option value="terms-of-service">terms-of-service</option>
								</select>
							</AdminField>
							<AdminField label="语言" hint="建议与 App 端法务语言枚举保持一致。">
								<select
									value={form.language}
									disabled={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
								>
									<option value="zh">zh</option>
									<option value="en">en</option>
								</select>
							</AdminField>
							<AdminField label="标题" hint="后台列表与前台展示都优先使用该标题。">
								<input
									value={form.title}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="版本号" hint="例如 1.0.0、1.1.0。">
								<input
									value={form.version}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="生效时间" hint="用于计算当前版本状态和历史排序。">
								<input
									type="datetime-local"
									value={form.effectiveDate}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))}
								/>
							</AdminField>
							<AdminField label="当前版本" hint="开启后会自动下线同类型同语言的其它 current 版本。">
								<div className="flex items-center gap-3 pt-2">
									<input
										type="checkbox"
										checked={form.isCurrent}
										disabled={isReadOnly}
										onChange={(event) => setForm((current) => ({ ...current, isCurrent: event.target.checked }))}
									/>
									<span className="text-sm text-base-content/70">标记为当前生效版本</span>
								</div>
								</AdminField>
							</AdminFormGrid>

							<AdminField label="Sections JSON" hint="必须是数组，元素结构为 { title, content }。">
								<textarea
									value={form.sectionsJson}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, sectionsJson: event.target.value }))}
								/>
							</AdminField>

							<AdminField label="Summary JSON" hint="必须是数组，元素结构为 { icon, title, content }。">
								<textarea
									value={form.summaryJson}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, summaryJson: event.target.value }))}
								/>
							</AdminField>

							<AdminField
								label="SDK List JSON"
								hint="必须是数组，元素结构为 { name, company, purpose, dataCollected, privacyUrl }。"
							>
								<textarea
									value={form.sdkListJson}
									readOnly={isReadOnly}
									onChange={(event) => setForm((current) => ({ ...current, sdkListJson: event.target.value }))}
								/>
							</AdminField>
						</div>
				)}
			</AdminModal>
		</AdminWorkspace>
	);
}
