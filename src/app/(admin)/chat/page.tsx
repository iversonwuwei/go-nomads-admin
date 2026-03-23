"use client";

import { type ConversationDto, deleteConversation, fetchConversations } from "@/app/lib/admin-api";
import {
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    HomeIcon,
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
		<div className="space-y-6">
			<div className="flex items-center gap-1.5 text-xs text-base-content/50">
				<Link href="/dashboard" className="hover:text-primary"><HomeIcon className="h-3.5 w-3.5" /></Link>
				<ChevronRightIcon className="h-3 w-3" />
				<span className="text-base-content">聊天记录</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h1 className="text-xl font-bold">聊天记录</h1>
					<p className="text-xs text-base-content/50">Chat — 共 {total} 个会话</p>
				</div>
			</div>

			{/* Search */}
			<div className="flex items-center gap-2 rounded-2xl border border-base-300/60 bg-base-100 px-4 py-3">
				<MagnifyingGlassIcon className="h-4 w-4 text-base-content/40" />
				<input
					className="w-full bg-transparent text-sm outline-none"
					placeholder="搜索参与者…"
					value={search}
					onChange={(e) => { setSearch(e.target.value); setPage(1); }}
				/>
			</div>

			{/* Conversation List */}
			<div className="space-y-2">
				{loading ? (
					<div className="flex h-48 items-center justify-center text-base-content/30">加载中…</div>
				) : conversations.length === 0 ? (
					<div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-base-300 text-base-content/30">暂无会话</div>
				) : (
					conversations.map((c) => (
						<div key={c.id} className="flex items-center gap-4 rounded-2xl border border-base-300/60 bg-base-100 p-4 transition hover:bg-base-200/50">
							{/* Participants Avatars */}
							<div className="flex -space-x-2">
								{(c.participants || []).slice(0, 2).map((p) => (
									<div key={p.userName ?? p.userId} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-base-100 bg-primary/10 text-xs font-bold text-primary">
										{(p.userName || "?")[0]}
									</div>
								))}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium">
									{(c.participants || []).map((p) => p.userName).join(" ↔ ") || "未知"}
								</p>
								<p className="truncate text-xs text-base-content/50">{c.lastMessage || "…"}</p>
							</div>
							{(c.unreadCount ?? 0) > 0 && (
								<span className="badge badge-sm badge-primary">{c.unreadCount}</span>
							)}
							<span className="text-xs text-base-content/40 whitespace-nowrap">
								{c.lastActiveAt?.slice(0, 16).replace("T", " ") || "—"}
							</span>
							<button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(c.id)}>
								<TrashIcon className="h-4 w-4" />
							</button>
						</div>
					))
				)}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-base-content/50">第 {page}/{totalPages} 页，共 {total} 条</p>
					<div className="join">
						<button type="button" className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
						<button type="button" className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
					</div>
				</div>
			)}
		</div>
	);
}
