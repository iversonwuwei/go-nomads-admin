"use client";

import AuthScene from "@/app/components/auth/auth-scene";
import { loginWithEmail } from "@/app/lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const forbidden = searchParams.get("forbidden") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const errorId = "login-form-error";
  const emailInvalid = email.length > 0 && !isValidEmail(email);

  const canSubmit = useMemo(() => isValidEmail(email) && password.length > 0, [email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("请输入有效邮箱和密码");
      return;
    }

    setPending(true);
    setError("");

    const result = await loginWithEmail({
      email: email.trim(),
      password,
    });

    setPending(false);

    if (!result.success) {
      setError(result.message || "登录失败，请检查账号密码");
      return;
    }

    if (!rememberMe && typeof window !== "undefined") {
      window.sessionStorage.setItem("admin-login", "session");
    }

    router.replace(nextPath);
  }

  return (
    <AuthScene
      eyebrow="Go Nomads Admin Authority"
      title="运营中枢登录"
      subtitle="面向平台运营、审核与增长团队。使用邮箱账号登录，进入实时数据总控与权限化工作台。"
      footer={
        <p>
          登录即表示同意平台管理端安全策略与审计规范。
          <span className="ml-1 text-[#0d6d7a]">所有关键操作将被记录。</span>
        </p>
      }
    >
      <div className="mb-6">
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
          <span className="rounded-lg bg-white px-3 py-1 text-slate-900 shadow-sm">登录</span>
          <Link href="/register" className="px-3 py-1 text-slate-600 hover:text-slate-900">注册</Link>
          <Link href="/forgot-password" className="px-3 py-1 text-slate-600 hover:text-slate-900">找回密码</Link>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">欢迎回到管理中枢</h2>
        <p className="mt-1 text-sm text-slate-600">使用企业邮箱账号登录，进入运营与审核工作台。</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {forbidden ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            当前账号没有管理后台权限，请使用管理员账号登录。
          </div>
        ) : null}

        <label className="form-control w-full">
          <span className="mb-2 block text-sm font-medium text-slate-700">邮箱地址</span>
          <input
            type="email"
            className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base focus:border-cyan-600 focus:outline-none ${error || emailInvalid ? "auth-field-invalid" : ""}`}
            placeholder="name@go-nomads.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-describedby={error ? errorId : undefined}
          />
          {emailInvalid ? <span className="mt-2 text-xs text-red-600">请输入有效邮箱地址。</span> : null}
        </label>

        <label className="form-control w-full">
          <span className="mb-2 block text-sm font-medium text-slate-700">密码</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 pr-16 text-base focus:border-cyan-600 focus:outline-none ${error ? "auth-field-invalid" : ""}`}
              placeholder="请输入登录密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-describedby={error ? errorId : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {showPassword ? "隐藏" : "显示"}
            </button>
          </div>
          {password.length > 0 && password.length < 6 ? (
            <span className="mt-2 block text-xs text-amber-600">密码长度建议至少 6 位。</span>
          ) : null}
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            记住我
          </label>

          <Link href="/forgot-password" className="font-medium text-[#0f52ba] hover:underline">
            忘记密码？
          </Link>
        </div>

        {error ? (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="auth-feedback rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          className="btn h-12 w-full rounded-xl border-0 bg-gradient-to-r from-cyan-700 to-blue-700 text-base font-semibold text-white hover:from-cyan-800 hover:to-blue-800"
          disabled={pending || !canSubmit}
        >
          {pending ? "登录中..." : "进入管理控制台"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">提示: 输入完成后按 Enter 可直接提交登录。</p>

      <p className="mt-6 text-sm text-slate-600">
        还没有账号？
        <Link href="/register" className="ml-1 font-semibold text-[#0d6d7a] hover:underline">
          注册管理员账号
        </Link>
      </p>
    </AuthScene>
  );
}
