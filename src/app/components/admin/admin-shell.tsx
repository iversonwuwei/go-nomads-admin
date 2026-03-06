"use client";

import { Bars3Icon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-config";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="drawer lg:drawer-open">
        <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex flex-col">
          <header className="sticky top-0 z-20 border-b border-base-300/60 bg-base-100/85 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <label
                htmlFor="admin-drawer"
                className="btn btn-ghost btn-square lg:hidden"
                aria-label="Open navigation"
              >
                <Bars3Icon className="h-5 w-5" />
              </label>

              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.18em] text-base-content/50">
                  Go Nomads Admin
                </p>
                <p className="text-sm font-semibold">数据中心 + 中台 + 管理系统</p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-base-300/70 bg-base-100 px-3 py-2 md:flex">
                <MagnifyingGlassIcon className="h-4 w-4 text-base-content/50" />
                <input
                  className="w-48 bg-transparent text-sm outline-none"
                  placeholder="搜索页面/用户/城市..."
                  aria-label="Global search"
                />
              </div>

              <button type="button" className="btn btn-primary btn-sm">
                + 新建任务
              </button>
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>

        <aside className="drawer-side border-r border-base-300/70 bg-base-100/90">
          <label htmlFor="admin-drawer" aria-label="Close navigation" className="drawer-overlay" />
          <div className="min-h-full w-72 p-4">
            <Link href="/dashboard" className="block rounded-xl border border-base-300/70 bg-base-100 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Operations Hub</p>
              <h2 className="mt-2 text-xl font-bold">行途管理台</h2>
              <p className="mt-1 text-xs text-base-content/60">Go Nomads Control Plane</p>
            </Link>

            <nav className="mt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                      active
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-200 text-base-content"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>
                      <span className="block text-sm font-semibold leading-4">{item.title}</span>
                      <span className={`block text-xs ${active ? "text-primary-content/80" : "text-base-content/60"}`}>
                        {item.subtitle}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
