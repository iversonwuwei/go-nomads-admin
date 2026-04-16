"use client";

import {
  Bars3Icon,
  ChartBarSquareIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type AuthUser, fetchCurrentAdmin, logoutAdmin } from "@/app/lib/auth-client";
import { type NavItem, type NavItem, type NavItem,, navItems } from "./nav-config";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchCurrentAdmin().then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        setCurrentAdmin(res.data);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const adminInitial = useMemo(() => {
    const source = currentAdmin?.name || currentAdmin?.email || "A";
    return source.charAt(0).toUpperCase();
  }, [currentAdmin?.email, currentAdmin?.name]);

  const adminRole = useMemo(() => {
    const role = (currentAdmin?.role || "admin").toLowerCase();
    return role === "superadmin" ? "Super Admin" : "Admin";
  }, [currentAdmin?.role]);

  const groupedNavItems = useMemo(() => {
    const grouped = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
      const group = item.group;
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});

    return navGroupOrder
      .map((group) => ({
        group,
        meta: navGroupMeta[group],
        items: grouped[group] ?? [],
      }))
      .filter((entry) => entry.items.length > 0);
  }, []);

  const currentItem = useMemo(
    () => navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? navItems[0],
    [pathname],
  );

  const currentGroupMeta = currentItem ? navGroupMeta[currentItem.group] : null;

  async function handleLogout() {
    await logoutAdmin();
    router.replace("/login");
  }

  return (
    <div className="admin-shell-root min-h-screen">
      <div className="drawer lg:drawer-open">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col">
          <header className="admin-topbar sticky top-0 z-20 border-b border-base-300/60 backdrop-blur-xl">
            <div className="admin-topbar-shell px-4 py-3 md:px-6">
              <label
                htmlFor="admin-drawer"
                className="btn btn-ghost btn-square lg:hidden"
                aria-label="Open navigation"
              >
                <Bars3Icon className="h-5 w-5" />
              </label>

              <div className="admin-topbar-copy">
                <p className="admin-topbar-eyebrow">Go Nomads Admin Control Plane</p>
                <div className="mt-1 flex items-center gap-2">
                  <ChartBarSquareIcon className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold text-base-content">
                    {currentItem?.title || "Control Plane For App Operations"}
                  </p>
                </div>
                <p className="mt-1 text-xs text-base-content/60">
                  {currentGroupMeta?.focus || "围绕 App 供给、治理、增长与风险动作组织当前操作域。"}
                </p>
              </div>

              <button type="button" className="admin-command-bar hidden md:flex" aria-label="打开全局命令搜索">
                <MagnifyingGlassIcon className="h-4 w-4 text-base-content/50" />
                <span className="admin-command-bar-copy">搜索任务 / 用户 / 城市 / 内容 / 操作...</span>
                <span className="admin-command-shortcut">Cmd K</span>
              </button>

              <div className="admin-topbar-status hidden xl:flex">
                <span className="admin-status-pill admin-status-pill-live">System Online</span>
                <span className="admin-status-pill">{currentGroupMeta?.title || "总览与指挥"}</span>
              </div>

              <Link href="/app-control" className="btn btn-primary btn-sm rounded-xl">
                进入 App 控制台
              </Link>

              <div className="hidden items-center gap-2 rounded-2xl border border-base-300/70 bg-base-100/92 px-2 py-1 lg:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                  {adminInitial}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-base-content">
                    {currentAdmin?.name || currentAdmin?.email || "管理员"}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-base-content/60">{adminRole}</p>
                </div>
              </div>

              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                退出
              </button>
            </div>
          </header>

          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>

        <aside className="drawer-side border-r border-base-300/70 bg-base-100/88 backdrop-blur-xl">
          <label htmlFor="admin-drawer" aria-label="Close navigation" className="drawer-overlay" />
          <div className="admin-sidebar-shell min-h-full w-80 p-4">
            <Link href="/dashboard" className="admin-brand-tile block rounded-3xl border border-base-300/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Operations Hub</p>
              <h2 className="mt-2 text-xl font-bold">行途管理台</h2>
              <p className="mt-1 max-w-52 text-xs leading-5 text-base-content/70">把后台重构成围绕供给、治理、增长与风控运转的 control plane，而不是模块清单。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="control-chip">App Surface</span>
                <span className="control-chip">Risk Review</span>
                <span className="control-chip">Growth Ops</span>
              </div>
            </Link>

            <section className="admin-nav-compass mt-4 rounded-3xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-base-content/45">Current Workspace</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-base-content">{currentGroupMeta?.title || "总览与指挥"}</p>
                  <p className="mt-1 text-xs leading-5 text-base-content/60">{currentGroupMeta?.description || "当前工作域说明"}</p>
                </div>
                <div className="admin-nav-focus-row">
                  <span className="admin-nav-pill">{currentItem?.subtitle || "Current"}</span>
                  <span className="admin-nav-pill admin-nav-pill-soft">{currentGroupMeta?.focus || "Control"}</span>
                </div>
                <div className="admin-compass-grid">
                  <div className="admin-compass-card">
                    <span>Protocol</span>
                    <strong>Workflow First</strong>
                  </div>
                  <div className="admin-compass-card">
                    <span>Mode</span>
                    <strong>Live Ops</strong>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Link href="/dashboard" className="btn btn-outline btn-sm justify-start rounded-2xl">返回数据中心</Link>
                  <Link href="/app-control" className="btn btn-primary btn-sm justify-start rounded-2xl">进入 App 控制台</Link>
                </div>
              </div>
            </section>

            <nav className="mt-4 space-y-4">
              {groupedNavItems.map(({ group, meta, items }) => (
                <section key={group} className="admin-nav-group-card rounded-3xl p-3">
                  <div className="admin-nav-group-header px-2 pb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{meta.subtitle}</p>
                      <p className="mt-1 text-sm font-semibold text-base-content">{meta.title}</p>
                    </div>
                    <span className="admin-nav-group-count">{items.length}</span>
                  </div>
                  <p className="px-2 text-xs leading-5 text-base-content/55">{meta.description}</p>
                  <div className="mt-3 space-y-1.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`admin-nav-item flex items-center gap-3 rounded-2xl px-3 py-3 transition ${active
                            ? "admin-nav-item-active"
                            : "text-base-content hover:bg-base-200/85"
                            }`}
                        >
                          <div className={`admin-nav-icon ${active ? "admin-nav-icon-active" : ""}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold leading-4">{item.title}</span>
                            <span className={`block text-[11px] ${active ? "text-primary-content/80" : "text-base-content/50"}`}>
                              {item.subtitle}
                            </span>
                          </span>
                          {item.badge ? (
                            <span className={`admin-nav-item-badge ${active ? "admin-nav-item-badge-active" : ""}`}>{item.badge}</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            <div className="admin-sidebar-footer mt-4">
              <div className="admin-operator-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/14 text-sm font-bold text-primary">
                    {adminInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-base-content">
                      {currentAdmin?.name || currentAdmin?.email || "管理员"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-base-content/55">{adminRole}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-base-content/60">
                  当前壳层已按业务域、风险与增长动作组织，适合在多模块间持续切换工作流。
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
