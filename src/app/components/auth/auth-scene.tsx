import type { ReactNode } from "react";

type AuthSceneProps = {
  title: string;
  subtitle: string;
  eyebrow: string;
  footer: ReactNode;
  children: ReactNode;
};

export default function AuthScene({ title, subtitle, eyebrow, footer, children }: AuthSceneProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070d16] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-glow auth-glow-cyan absolute -left-16 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(0,191,166,0.38),_rgba(0,191,166,0)_70%)]" />
        <div className="auth-glow auth-glow-orange absolute right-[-120px] top-8 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,69,0.24),_rgba(255,122,69,0)_72%)]" />
        <div className="auth-glow auth-glow-indigo absolute bottom-[-180px] left-1/2 h-[28rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(92,124,250,0.26),_rgba(92,124,250,0)_70%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-10">
        <section className="auth-fade-up auth-fade-up-a relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1624]/85 p-7 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur md:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[2rem] bg-gradient-to-br from-white/10 to-transparent" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300/90">{eyebrow}</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">{subtitle}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-cyan-400/25 bg-cyan-300/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-2xl font-semibold text-cyan-200">99.95%</p>
              <p className="mt-1 text-xs text-cyan-100/90">平台可用性</p>
            </article>
            <article className="rounded-2xl border border-indigo-400/25 bg-indigo-300/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-2xl font-semibold text-indigo-200">24h</p>
              <p className="mt-1 text-xs text-indigo-100/90">全链路审计</p>
            </article>
            <article className="rounded-2xl border border-orange-400/25 bg-orange-300/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-2xl font-semibold text-orange-200">3-Step</p>
              <p className="mt-1 text-xs text-orange-100/90">身份验证</p>
            </article>
          </div>

          <div className="mt-7 rounded-2xl border border-dashed border-white/20 bg-black/15 p-4 text-sm text-slate-300">
            Control Center 覆盖登录、权限、审计三条关键链路，面向运营、审核和管理场景的高频操作优化。
          </div>
        </section>

        <section className="auth-fade-up auth-fade-up-b rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_28px_100px_rgba(5,12,24,0.5)] md:p-8">
          {children}
          <div className="mt-6 border-t border-slate-200 pt-5 text-xs text-slate-500">{footer}</div>
        </section>
      </div>
    </main>
  );
}
