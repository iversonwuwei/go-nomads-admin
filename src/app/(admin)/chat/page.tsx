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
import { type ConversationDto, deleteConversation, fetchConversations } from "@/app/lib/admin-api";
import {
	ChatBubbleLeftRightIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChatPage() {
	const [conversations, setConversations] = useState<ConversationDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState("");

	useEffect(() => {
		let active = true;
		fetchConversations({ page, pageSize, search: search || undefined }).then((res) => {
			if (!active) return;
			if (res.ok && res.data) { setConversations(res.data.items); setTotal(res.data.totalCount); }
			setLoading(false);
		});
		return () => { active = false; };
	}, [page, pageSize, search]);

	const visibleConversations = conversations.filter((conversation) => {
		if (!search.trim()) return true;
		const query = search.toLowerCase();
		return [conversation.name, conversation.city, conversation.country, conversation.roomType, conversation.id]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(query));
	});

	const displayedTotal = search.trim() ? visibleConversations.length : total;

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	async function reload() {
		setLoading(true);
		const res = await fetchConversations({ page, pageSize, search: search || undefined });
		if (res.ok && res.data) { setConversations(res.data.items); setTotal(res.data.totalCount); }
		setLoading(false);
	}

	async function handleDelete(id: string) {
		if (!confirm("确定删除此会话？")) return;
		await deleteConversation(id);
		await reload();
	}

	return (
		<AdminWorkspace>
			<AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "聊天记录" }]} />
			<AdminWorkspaceHero
				eyebrow="Operations Interaction"
				title="聊天记录"
				description="把房间、参与规模与最近活跃统一成可筛选的运营视图，减少在卡片流里逐条查找的成本。"
				stats={[
					{ label: "Visible Sessions", value: String(displayedTotal), hint: "当前视图中的会话数量" },
					{ label: "Page", value: `${page}/${totalPages}`, hint: "分页位置" },
					{ label: "Search", value: search.trim() ? "已启用" : "未启用", hint: "当前是否启用检索" },
				]}
				actions={
					<div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
						<ChatBubbleLeftRightIcon className="h-5 w-5" />
						<span>会话治理</span>
					</div>
				}
			/>

			<AdminWorkspaceSection title="搜索入口" description="优先缩小房间范围，再进入详情页做成员、消息和删除动作。">
				<AdminWorkspaceToolbar>
					<AdminToolbarSlot label="搜索房间、城市或国家" grow>
						<MagnifyingGlassIcon className="admin-toolbar-search-icon h-4 w-4" />
						<input
							placeholder="搜索房间、城市、国家或类型..."
							value={search}
							onChange={(e) => { setSearch(e.target.value); setPage(1); }}
						/>
					</AdminToolbarSlot>
				</AdminWorkspaceToolbar>
			</AdminWorkspaceSection>

			<AdminWorkspaceSection title="会话结果" description="列表保留详情与删除动作，同时补足房间语义和活跃时间，减少运营误点。">
				<AdminTable
					headers={["房间", "定位", "成员", "最近活跃", "操作"]}
					hasRows={!loading && visibleConversations.length > 0}
					colSpan={5}
					emptyMessage={loading ? "加载中…" : "暂无会话"}
					meta={
						<>
							<div>
								<span className="admin-table-meta-label">Chat Control Plane</span>
								<span className="admin-table-meta-value">{visibleConversations.length}</span>
							</div>
							<p className="admin-table-meta-copy">会话结果采用统一表格语义，避免不同运营页使用完全不同的列表模式。</p>
						</>
					}
				>
					{visibleConversations.map((c) => (
						<tr key={c.id}>
							<td>
								<div className="admin-entity-inline">
									<div className="admin-entity-avatar">{(c.name || c.roomType || "?")[0]}</div>
									<div className="admin-entity-copy">
										<Link href={`/chat/${c.id}`} className="admin-entity-title text-primary hover:underline">
											{c.name || "未命名房间"}
										</Link>
										<span className="admin-entity-subtitle">Room ID · {c.id.slice(0, 8)}</span>
									</div>
								</div>
							</td>
							<td className="text-sm text-base-content/65">{[c.roomType, c.city, c.country].filter(Boolean).join(" / ") || c.lastMessage || "—"}</td>
							<td>{typeof c.totalMembers === "number" ? <span className="badge badge-sm badge-primary badge-outline">{c.totalMembers} 人</span> : "—"}</td>
							<td className="text-xs text-base-content/55">{c.lastActiveAt?.slice(0, 16).replace("T", " ") || "—"}</td>
							<td>
								<div className="flex items-center justify-end gap-1">
									<Link href={`/chat/${c.id}`} className="btn btn-ghost btn-xs rounded-xl">详情</Link>
									<button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(c.id)}>
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
