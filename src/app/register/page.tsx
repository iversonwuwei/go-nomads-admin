"use client";

import AuthScene from "@/app/components/auth/auth-scene";
import { registerUser, sendRegisterCode } from "@/app/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const countdownTimerRef = useRef<number | null>(null);
  const errorId = "register-form-error";
  const messageId = "register-form-message";

  const canSendCode = useMemo(() => isValidEmail(email) && countdown <= 0 && !sendingCode, [email, countdown, sendingCode]);
  const emailInvalid = email.length > 0 && !isValidEmail(email);
  const codeWeak = verificationCode.length > 0 && verificationCode.trim().length < 6;
  const passwordWeak = password.length > 0 && password.length < 6;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const passwordStrength = getPasswordStrength(password);
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 3 &&
      isValidEmail(email) &&
      verificationCode.trim().length >= 6 &&
      password.length >= 6 &&
      confirmPassword === password &&
      agreed
    );
  }, [name, email, verificationCode, password, confirmPassword, agreed]);

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

  async function onSendCode() {
    if (!isValidEmail(email)) {
      setError("请输入正确的邮箱地址");
      return;
    }

    setError("");
    setMessage("");
    setSendingCode(true);

    const result = await sendRegisterCode(email.trim());
    setSendingCode(false);

    if (!result.success) {
      setError(result.message || "验证码发送失败");
      return;
    }

    setMessage("验证码已发送，请检查邮箱");
    startCountdown(60);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      setError("请完成所有必填项并确认协议");
      return;
    }

    setError("");
    setMessage("");
    setPending(true);

    const result = await registerUser({
      name: name.trim(),
      email: email.trim(),
      password,
      verificationCode: verificationCode.trim(),
    });

    setPending(false);

    if (!result.success) {
      setError(result.message || "注册失败，请检查输入信息");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <AuthScene
      eyebrow="Identity Bootstrap"
      title="管理员账号注册"
      subtitle="注册流程与移动端一致：邮箱验证码 + 密码创建。完成后可直接进入管理中台。"
      footer={
        <p>
          推荐使用企业邮箱，便于后续角色分配与审计追踪。
          <span className="ml-1 text-[#0f52ba]">验证码默认 60 秒可重发。</span>
        </p>
      }
    >
      <div className="mb-6">
        <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
          <Link href="/login" className="px-3 py-1 text-slate-600 hover:text-slate-900">登录</Link>
          <span className="rounded-lg bg-white px-3 py-1 text-slate-900 shadow-sm">注册</span>
          <Link href="/forgot-password" className="px-3 py-1 text-slate-600 hover:text-slate-900">找回密码</Link>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">创建新账号</h2>
        <p className="mt-1 text-sm text-slate-600">字段规则对齐 App 注册: name/email/password/verificationCode。</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <label className="form-control w-full">
          <span className="mb-2 block text-sm font-medium text-slate-700">用户名</span>
          <input
            type="text"
            className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base focus:border-cyan-600 focus:outline-none"
            placeholder="至少 3 个字符"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            aria-describedby={error ? errorId : message ? messageId : undefined}
          />
        </label>

        <label className="form-control w-full">
          <span className="mb-2 block text-sm font-medium text-slate-700">邮箱</span>
          <div className="flex gap-2">
            <input
              type="email"
              className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base focus:border-cyan-600 focus:outline-none ${error || emailInvalid ? "auth-field-invalid" : ""}`}
              placeholder="name@go-nomads.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={error ? errorId : message ? messageId : undefined}
            />
            <button
              type="button"
              className="btn h-12 rounded-xl border-slate-300 bg-white px-4"
              onClick={onSendCode}
              disabled={!canSendCode}
            >
              {countdown > 0 ? `${countdown}s` : sendingCode ? "发送中" : "发送验证码"}
            </button>
          </div>
          {emailInvalid ? <span className="mt-2 text-xs text-red-600">邮箱格式不正确，请检查后再发送验证码。</span> : null}
        </label>

        <label className="form-control w-full">
          <span className="mb-2 block text-sm font-medium text-slate-700">邮箱验证码</span>
          <input
            type="text"
            className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 text-base tracking-[0.25em] focus:border-cyan-600 focus:outline-none ${error || codeWeak ? "auth-field-invalid" : ""}`}
            placeholder="输入 6 位验证码"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={8}
            aria-describedby={error ? errorId : message ? messageId : undefined}
          />
          {codeWeak ? <span className="mt-2 text-xs text-amber-600">验证码至少 6 位。</span> : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control w-full">
            <span className="mb-2 block text-sm font-medium text-slate-700">密码</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 pr-16 text-base focus:border-cyan-600 focus:outline-none ${error || passwordWeak ? "auth-field-invalid" : ""}`}
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={error ? errorId : message ? messageId : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full transition-all duration-200 ${passwordStrength.color} ${passwordStrength.widthClass}`} />
              </div>
              <p className="text-xs text-slate-600">密码强度: {passwordStrength.label}</p>
            </div>
            {passwordWeak ? <span className="mt-2 block text-xs text-amber-600">密码长度至少 6 位。</span> : null}
          </label>

          <label className="form-control w-full">
            <span className="mb-2 block text-sm font-medium text-slate-700">确认密码</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white px-4 pr-16 text-base focus:border-cyan-600 focus:outline-none ${error || confirmMismatch ? "auth-field-invalid" : ""}`}
                placeholder="再次输入密码"
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

        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          我已阅读并同意管理平台使用规范与审计条款
        </label>

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
        {message ? (
          <div
            id={messageId}
            role="status"
            aria-live="polite"
            className="auth-feedback rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          className="btn h-12 w-full rounded-xl border-0 bg-gradient-to-r from-cyan-700 to-blue-700 text-base font-semibold text-white hover:from-cyan-800 hover:to-blue-800"
          disabled={pending || !canSubmit}
        >
          {pending ? "注册中..." : "创建并进入控制台"}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">提示: 输入完成后按 Enter 可直接提交注册。</p>

      <p className="mt-6 text-sm text-slate-600">
        已有账号？
        <Link href="/login" className="ml-1 font-semibold text-[#0f52ba] hover:underline">
          返回登录
        </Link>
      </p>
    </AuthScene>
  );
}
