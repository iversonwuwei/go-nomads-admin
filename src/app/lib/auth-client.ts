"use client";

export type AuthEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
};

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  verificationCode: string;
};

export type ForgotPasswordResetPayload = {
  emailOrPhone: string;
  code: string;
  newPassword: string;
};

export type LoginResult = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
};

const STORAGE_KEY = "go_nomads_admin_auth";

function normalizeEnvelope<T>(raw: unknown): AuthEnvelope<T> {
  const source = (raw ?? {}) as Record<string, unknown>;
  const data = (source.data ?? source.Data ?? null) as T | null;
  const errorsRaw = (source.errors ?? source.Errors ?? []) as unknown;

  return {
    success: Boolean(source.success ?? source.Success),
    message: String(source.message ?? source.Message ?? ""),
    data,
    errors: Array.isArray(errorsRaw) ? errorsRaw.map((x) => String(x)) : [],
  };
}

function extractLoginResult(payload: Record<string, unknown>): LoginResult {
  const data = (payload.data ?? {}) as Record<string, unknown>;

  const accessToken =
    String(data.accessToken ?? payload.accessToken ?? "") || "";

  return {
    accessToken,
    refreshToken: String(data.refreshToken ?? payload.refreshToken ?? "") || undefined,
    expiresIn: Number(data.expiresIn ?? payload.expiresIn ?? 0) || undefined,
    user: (data.user ?? payload.user ?? undefined) as AuthUser | undefined,
  };
}

function persistAuthState(result: LoginResult) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function readAuthState(): LoginResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LoginResult;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loginWithEmail(payload: LoginPayload): Promise<AuthEnvelope<LoginResult>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw);

  if (!res.ok || !normalized.success || !normalized.data) {
    return {
      success: false,
      message: normalized.message || `HTTP ${res.status}`,
      data: null,
      errors: normalized.errors,
    };
  }

  const result = extractLoginResult(normalized.data);
  if (!result.accessToken) {
    return {
      success: false,
      message: "登录成功但未返回 accessToken",
      data: null,
      errors: normalized.errors,
    };
  }

  persistAuthState(result);
  return { success: true, message: normalized.message, data: result, errors: normalized.errors };
}

export async function sendRegisterCode(email: string): Promise<AuthEnvelope<null>> {
  const res = await fetch("/api/auth/register/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const raw = await res.json().catch(() => ({}));
  const normalized = normalizeEnvelope<null>(raw);
  return {
    success: res.ok && normalized.success,
    message: normalized.message || (res.ok ? "验证码已发送" : `HTTP ${res.status}`),
    data: null,
    errors: normalized.errors,
  };
}

export async function registerUser(payload: RegisterPayload): Promise<AuthEnvelope<LoginResult>> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw);

  if (!res.ok || !normalized.success || !normalized.data) {
    return {
      success: false,
      message: normalized.message || `HTTP ${res.status}`,
      data: null,
      errors: normalized.errors,
    };
  }

  const result = extractLoginResult(normalized.data);
  if (result.accessToken) {
    persistAuthState(result);
  }

  return { success: true, message: normalized.message, data: result, errors: normalized.errors };
}

export async function sendForgotPasswordCode(emailOrPhone: string): Promise<AuthEnvelope<Record<string, unknown>>> {
  const res = await fetch("/api/auth/forgot-password/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhone }),
  });

  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw);

  return {
    success: res.ok && normalized.success,
    message: normalized.message || (res.ok ? "验证码已发送" : `HTTP ${res.status}`),
    data: normalized.data,
    errors: normalized.errors,
  };
}

export async function resetForgottenPassword(payload: ForgotPasswordResetPayload): Promise<AuthEnvelope<null>> {
  const res = await fetch("/api/auth/forgot-password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));
  const normalized = normalizeEnvelope<null>(raw);

  return {
    success: res.ok && normalized.success,
    message: normalized.message || (res.ok ? "密码重置成功" : `HTTP ${res.status}`),
    data: null,
    errors: normalized.errors,
  };
}

export async function logoutAdmin() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem("admin-login");
  }
}

export async function fetchCurrentAdmin(): Promise<AuthEnvelope<AuthUser>> {
  const res = await fetch("/api/auth/me", { method: "GET" });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const normalized = normalizeEnvelope<Record<string, unknown>>(raw);

  if (!res.ok || !normalized.success || !normalized.data) {
    return {
      success: false,
      message: normalized.message || `HTTP ${res.status}`,
      data: null,
      errors: normalized.errors,
    };
  }

  const source = normalized.data;
  return {
    success: true,
    message: normalized.message,
    data: {
      id: String(source.id ?? source.Id ?? "") || undefined,
      name: String(source.name ?? source.Name ?? "") || undefined,
      email: String(source.email ?? source.Email ?? "") || undefined,
      role: String(source.role ?? source.Role ?? "") || undefined,
      avatar: String(source.avatar ?? source.Avatar ?? "") || undefined,
    },
    errors: normalized.errors,
  };
}
