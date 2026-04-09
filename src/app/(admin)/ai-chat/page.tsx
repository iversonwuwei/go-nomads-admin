"use client";

import AdminTable from "@/app/components/admin/admin-table";
import {
	AdminToolbarSlot,
	AdminWorkspace,
	AdminWorkspaceBreadcrumb,
	AdminWorkspaceHero,
	AdminWorkspaceSection,
	AdminWorkspaceToolbar,
} from "@/app/components/admin/system-workspace";
import { UserIdentityLink } from "@/app/components/admin/user-identity-link";
import { type AiSessionDto, deleteAiSession, fetchAiSessions } from "@/app/lib/admin-api";
import { getUserDisplayInitial } from "@/app/lib/user-display";
import {
    MagnifyingGlassIcon,
    SparklesIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AiChatPage() {
	const [sessions, setSessions] = useState<AiSessionDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");

	useEffect(() => {
		let active = true;
		fetchAiSessions({ page, pageSize, search: search || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setSessions(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, search]);

	const visibleSessions = sessions.filter((session) => {
		if (!search.trim()) return true;
		const query = search.toLowerCase();
		return [session.title, session.userName, session.userId, session.model, session.status]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(query));
	});

	const displayedTotal = search.trim() ? visibleSessions.length : total;

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchAiSessions({ page, pageSize, search: search || undefined });
		if (res.ok && res.data) { setSessions(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此 AI 对话？")) return;
		await deleteAiSession(id);
		await reload();
	}

	return (
		<AdminWorkspace>
			<AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "AI 对话" }]} />
			<AdminWorkspaceHero
				eyebrow="AI Interaction"
				title="AI 对话"
				description="统一查看用户、模型、Token 消耗和会话标题，让运营与风控能在一张表里完成筛查与跳转。"
				stats={[
					{ label: "Visible Sessions", value: String(displayedTotal), hint: "当前视图中的 AI 会话量" },
					{ label: "Current Page", value: `${page}/${totalPages}`, hint: "分页浏览位置" },
					{ label: "Search", value: search.trim() ? "已启用" : "未启用", hint: "当前是否使用检索" },
				]}
				actions={
					<div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
						<SparklesIcon className="h-5 w-5" />
						<span>模型会话治理</span>
					</div>
				}
			/>

			<AdminWorkspaceSection title="检索入口" description="优先缩小会话范围，再进入详情页查看消息上下文或执行删除。">
				<AdminWorkspaceToolbar>
					<AdminToolbarSlot label="搜索会话标题、用户或模型" grow>
						<MagnifyingGlassIcon className="admin-toolbar-search-icon h-4 w-4" />
						<input
							placeholder="搜索标题、用户 ID、用户名或模型..."
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</AdminToolbarSlot>
				</AdminWorkspaceToolbar>
			</AdminWorkspaceSection>

			<AdminWorkspaceSection title="会话结果" description="把用户身份、模型选择与 Token 成本放进统一的产品表格，降低查看与操作跳转成本。">
				<AdminTable
					headers={["用户", "会话标题", "模型", "Token", "时间", "操作"]}
					hasRows={!loading && visibleSessions.length > 0}
					colSpan={6}
					emptyMessage={loading ? "加载中…" : "暂无 AI 会话"}
					meta={
						<>
							<div>
								<span className="admin-table-meta-label">AI Session Matrix</span>
								<span className="admin-table-meta-value">{visibleSessions.length}</span>
							</div>
							<p className="admin-table-meta-copy">把 AI 会话页和其他治理页统一成相同的 workspace 与 table 结构，减少界面认知切换。</p>
						</>
					}
				>
					{visibleSessions.map((s) => (
						<tr key={s.id}>
							<td>
								<div className="admin-entity-inline">
									<div className="admin-entity-avatar">{getUserDisplayInitial(s.userName, s.userId)}</div>
									<div className="admin-entity-copy">
										<UserIdentityLink userId={s.userId} userName={s.userName} />
										<span className="admin-entity-subtitle">{s.status || "active"}</span>
									</div>
								</div>
							</td>
							<td className="max-w-xs text-base-content/75">
								<Link href={`/ai-chat/${s.id}`} className="font-medium text-primary hover:underline">
									{s.title || s.lastMessage || "—"}
								</Link>
							</td>
							<td>{s.model ? <span className="badge badge-sm badge-outline">{s.model}</span> : "—"}</td>
							<td className="tabular-nums text-sm">{s.tokenUsage?.toLocaleString() ?? "—"}</td>
							<td className="text-xs text-base-content/55">{(s.lastMessageAt || s.createdAt)?.slice(0, 16).replace("T", " ") || "—"}</td>
							<td>
								<div className="flex items-center justify-end gap-1">
									<Link href={`/ai-chat/${s.id}`} className="btn btn-ghost btn-xs rounded-xl">详情</Link>
									<button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(s.id)}>
										<TrashIcon className="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</AdminTable>
			</AdminWorkspaceSection>

			{totalPages > 1 ? (
				<div className="admin-pagination-shell">
					<p className="admin-pagination-copy">第 {page}/{totalPages} 页，共 {total} 条</p>
					<div className="join">
						<button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
						<button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
					</div>
				</div>
			) : null}
		</AdminWorkspace>
	);
}
