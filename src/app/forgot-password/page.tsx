"use client";

import AuthScene from "@/app/components/auth/auth-scene";
import { resetForgottenPassword, sendForgotPasswordCode } from "@/app/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function getPasswordStrength(value: string) {
  if (!value) {
    return { level: 0, label: "未输入", color: "bg-slate-200", widthClass: "auth-strength-w-0" };
  }

  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return { level: 1, label: "弱", color: "bg-rose-500", widthClass: "auth-strength-w-1" };
  if (score <= 4) return { level: 2, label: "中", color: "bg-amber-500", widthClass: "auth-strength-w-2" };
  return { level: 3, label: "强", color: "bg-emerald-500", widthClass: "auth-strength-w-3" };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [account, setAccount] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const countdownTimerRef = useRef<number | null>(null);
  const errorId = "forgot-form-error";
  const messageId = "forgot-form-message";

  const canSendCode = useMemo(() => account.trim().length > 0 && countdown <= 0 && !sendingCode, [account, countdown, sendingCode]);
  const codeWeak = code.length > 0 && code.trim().length < 6;
  const newPasswordWeak = newPassword.length > 0 && newPassword.length < 6;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const passwordStrength = getPasswordStrength(newPassword);
  const canReset = useMemo(() => {
    return code.trim().length >= 6 && newPassword.length >= 6 && confirmPassword === newPassword;
  }, [code, newPassword, confirmPassword]);

  function startCountdown(seconds: number) {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }

    setCountdown(seconds);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            window.clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  async function submitSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!canSendCode) return;

    setError("");
    setMessage("");
    setSendingCode(true);

    const result = await sendForgotPasswordCode(account.trim());
    setSendingCode(false);

    if (!result.success) {
      setError(result.message || "验证码发送失败");
      return;
    }

    setMessage(result.message || "验证码已发送");
    setStep(1);
    startCountdown(60);
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!canReset) {
      setError("请填写完整信息并确认新密码");
      return;
    }

    setError("");
    setMessage("");
    setPending(true);

    const result = await resetForgottenPassword({
      emailOrPhone: account.trim(),
      code: code.trim(),
      newPassword,
    });

    setPending(false);

    if (!result.success) {
      setError(result.message || "重置密码失败");
      return;
    }

    setMessage("密码重置成功，请重新登录");
    setStep(2);
    window.setTimeout(() => {
      router.replace("/login");
    }, 1200);
  }

  return (
    <AuthScene
      eyebrow="Password Recovery"
      title="找回管理员密码"
      subtitle="流程与 App 一致：输入邮箱/手机号 -> 获取验证码 -> 设置新密码。"
      footer={<p>若超过 3 次失败，请联系平台超级管理员进行人工重置。</p>}
    >
      <div className="mb-6">
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
          <Link href="/login" className="px-3 py-1 text-slate-600 hover:text-slate-900">登录</Link>
          <Link href="/register" className="px-3 py-1 text-slate-600 hover:text-slate-900">注册</Link>
          <span className="rounded-lg bg-white px-3 py-1 text-slate-900 shadow-sm">找回密码</span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">恢复账号访问权限</h2>
        <p className="mt-1 text-sm text-slate-600">三步恢复访问权限，最短 1 分钟完成。</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 text-center text-xs">
        <div className={`rounded-xl px-3 py-2 ${step >= 0 ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"}`}>账号</div>
        <div className={`rounded-xl px-3 py-2 ${step >= 1 ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}>验证码</div>
        <div className={`rounded-xl px-3 py-2 ${step >= 2 ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>新密码</div>
      </div>
      <p className="sr-only" aria-live="polite">当前处于找回密码第 {step + 1} 步</p>

      {step === 0 ? (
        <form onSubmit={submitSendCode} className="space-y-4" noValidate>
          <label className="form-control w-full">
            <span className="mb-2 block text-sm font-medium text-slate-700">邮箱或手机号</span>
            <input
              type="text"
              className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base focus:border-cyan-600 focus:outline-none"
              placeholder="email@example.com 或 +8613812345678"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoFocus
              aria-describedby={error ? errorId : message ? messageId : undefined}
            />
          </label>

          <button
            type="submit"
            className="btn h-12 w-full rounded-xl border-0 bg-gradient-to-r from-cyan-700 to-blue-700 text-base font-semibold text-white hover:from-cyan-800 hover:to-blue-800"
            disabled={!canSendCode}
          >
            {sendingCode ? "发送中..." : "发送验证码"}
          </button>
        </form>
      ) : null}

      {step >= 1 && step < 2 ? (
        <form onSubmit={submitReset} className="space-y-4" noValidate>
          <label className="form-control w-full">
            <span className="mb-2 block text-sm font-medium text-slate-700">验证码</span>
            <div className="flex gap-2">
              <input
                type="text"
                className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base tracking-[0.2em] focus:border-cyan-600 focus:outline-none ${codeWeak ? "auth-field-invalid" : ""}`}
                placeholder="输入收到的验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-describedby={error ? errorId : message ? messageId : undefined}
              />
              <button
                type="button"
                className="btn h-12 rounded-xl border-slate-300 bg-white px-4"
                onClick={submitSendCode}
                disabled={!canSendCode}
              >
                {countdown > 0 ? `${countdown}s` : "重发"}
              </button>
            </div>
            {codeWeak ? <span className="mt-2 block text-xs text-amber-600">验证码至少 6 位。</span> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control w-full">
              <span className="mb-2 block text-sm font-medium text-slate-700">新密码</span>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 pr-16 text-base focus:border-cyan-600 focus:outline-none ${newPasswordWeak ? "auth-field-invalid" : ""}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-describedby={error ? errorId : message ? messageId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {showNewPassword ? "隐藏" : "显示"}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full transition-all duration-200 ${passwordStrength.color} ${passwordStrength.widthClass}`} />
                </div>
                <p className="text-xs text-slate-600">密码强度: {passwordStrength.label}</p>
              </div>
              {newPasswordWeak ? <span className="mt-2 block text-xs text-amber-600">新密码长度至少 6 位。</span> : null}
            </label>

            <label className="form-control w-full">
              <span className="mb-2 block text-sm font-medium text-slate-700">确认新密码</span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 pr-16 text-base focus:border-cyan-600 focus:outline-none ${confirmMismatch ? "auth-field-invalid" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-describedby={error ? errorId : message ? messageId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {showConfirmPassword ? "隐藏" : "显示"}
                </button>
              </div>
              {confirmMismatch ? <span className="mt-2 block text-xs text-red-600">两次输入的密码不一致。</span> : null}
            </label>
          </div>

          <button
            type="submit"
            className="btn h-12 w-full rounded-xl border-0 bg-gradient-to-r from-cyan-700 to-blue-700 text-base font-semibold text-white hover:from-cyan-800 hover:to-blue-800"
            disabled={pending || !canReset}
          >
            {pending ? "重置中..." : "确认重置密码"}
          </button>
        </form>
      ) : null}

      {message ? (
        <div
          id={messageId}
          role="status"
          aria-live="polite"
          className="auth-feedback mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="auth-feedback mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-[#0f52ba] hover:underline">
          返回登录
        </Link>
      </p>
    </AuthScene>
  );
}
