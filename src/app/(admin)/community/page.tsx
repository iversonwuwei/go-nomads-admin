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
import { type CommunityPostDto, deleteCommunityPost, fetchCommunityPosts } from "@/app/lib/admin-api";
import {
    FunnelIcon,
    MagnifyingGlassIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
    { label: "全部类型", value: "" },
    { label: "帖子", value: "post" },
    { label: "评论", value: "comment" },
];

function formatCount(value: number) {
    return new Intl.NumberFormat("zh-CN").format(value);
}

export default function CommunityPage() {
    const [posts, setPosts] = useState<CommunityPostDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");

    useEffect(() => {
        let active = true;
        fetchCommunityPosts({ page, pageSize, search: search || undefined, type: type || undefined }).then((res) => {
            if (!active) return;
        if (res.ok && res.data) {
            setPosts(res.data.items);
            setTotal(res.data.totalCount);
        }
        setLoading(false);
    });
      return () => {
          active = false;
      };
  }, [page, pageSize, search, type]);

    const hiddenCount = posts.filter((post) => (post.status || "").toLowerCase() === "hidden").length;
    const postCount = posts.filter((post) => post.type === "post").length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount ?? 0), 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    async function reload() {
        setLoading(true);
        const res = await fetchCommunityPosts({ page, pageSize, search: search || undefined, type: type || undefined });
      if (res.ok && res.data) {
          setPosts(res.data.items);
          setTotal(res.data.totalCount);
      }
      setLoading(false);
  }

    async function handleDelete(id: string) {
        if (!confirm("确定删除此内容？")) return;
        await deleteCommunityPost(id);
        await reload();
    }

    return (
      <AdminWorkspace>
          <AdminWorkspaceBreadcrumb items={[{ label: "数据中心", href: "/dashboard" }, { label: "社区内容" }]} />
          <AdminWorkspaceHero
              eyebrow="Community Governance"
              title="社区内容"
              description="把社区内容治理、搜索缩圈和处置动作放到统一工作台，降低运营在列表和详情之间的切换成本。"
              actions={
                  <Link href="/app-control" className="btn btn-outline rounded-2xl">
                      返回 App 控制台
                  </Link>
              }
              stats={[
                  { label: "Total Community Items", value: String(total), hint: "当前查询条件下的内容总数" },
                  { label: "Hidden In Page", value: String(hiddenCount), hint: "当前页被隐藏的内容数" },
                  { label: "Likes In Page", value: String(totalLikes), hint: "当前页互动热度总和" },
              ]}
          />

          <AdminWorkspaceSection
              title="治理筛选入口"
              description="优先按关键词和内容类型缩小范围，再进入结果表做删除或详情治理。"
          >
              <AdminWorkspaceToolbar>
                  <AdminToolbarSlot label="搜索作者或内容" grow>
                      <MagnifyingGlassIcon className="admin-toolbar-search-icon h-4 w-4" />
                      <input
                          placeholder="搜索内容、作者、城市…"
                          value={search}
                          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                      />
                  </AdminToolbarSlot>
                  <AdminToolbarSlot label="内容类型">
                      <FunnelIcon className="admin-toolbar-search-icon h-4 w-4" />
                      <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
                          {TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                      </select>
                  </AdminToolbarSlot>
                  <AdminToolbarSlot label="当前页帖子数">
                      <div className="text-sm font-medium text-base-content">{formatCount(postCount)}</div>
                  </AdminToolbarSlot>
              </AdminWorkspaceToolbar>
          </AdminWorkspaceSection>

          <AdminWorkspaceSection
              title="社区结果与处置"
              description="统一查看作者、互动数据、状态和城市归属，并保留详情跳转与删除动作。"
          >
              <AdminTable
                  headers={["类型", "作者", "内容摘要", "点赞", "评论", "城市", "状态", "时间", "操作"]}
                  hasRows={!loading && posts.length > 0}
                  colSpan={9}
                  emptyMessage={loading ? "加载中…" : "暂无社区数据"}
                  meta={
                      <>
                          <div>
                              <span className="admin-table-meta-label">Current Result Set</span>
                              <span className="admin-table-meta-value">{posts.length}</span>
                  </div>
                          <p className="admin-table-meta-copy">列表内直接暴露治理动作，详情页则负责解释上下文和补充信息，不再混杂多套卡片样式。</p>
                      </>
                  }
              >
                  {posts.map((post) => (
                      <tr key={post.id}>
                          <td>
                      <span className={`badge badge-sm ${post.type === "post" ? "badge-primary" : "badge-ghost"}`}>
                          {post.type === "post" ? "帖子" : post.type === "comment" ? "评论" : post.type || "—"}
                      </span>
                  </td>
                  <td>
                      <UserIdentityLink userId={post.authorId} userName={post.authorName} fallback="未命名作者" />
                  </td>
                  <td className="max-w-xs truncate text-base-content/70">
                      <Link href={`/community/${post.id}`} className="text-primary hover:underline">
                          {post.content || "—"}
                      </Link>
                  </td>
                  <td className="tabular-nums">{post.likeCount ?? 0}</td>
                  <td className="tabular-nums">{post.commentCount ?? 0}</td>
                  <td className="text-base-content/70">{post.cityName || "—"}</td>
                  <td>
                      <span className={`badge badge-sm ${post.status === "hidden" ? "badge-warning" : "badge-success"}`}>
                          {post.status === "hidden" ? "已隐藏" : "正常"}
                      </span>
                  </td>
                  <td className="text-xs text-base-content/55">{post.createdAt?.slice(0, 10) || "—"}</td>
                  <td>
                      <div className="flex items-center justify-end gap-1">
                          <Link href={`/community/${post.id}`} className="btn btn-ghost btn-xs rounded-xl">详情</Link>
                          <button type="button" className="btn btn-ghost btn-xs rounded-xl text-error" onClick={() => handleDelete(post.id)}>
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