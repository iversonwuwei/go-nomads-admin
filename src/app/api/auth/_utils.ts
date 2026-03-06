import { resolveApiBase } from "@/app/lib/runtime-api-base";
import { NextResponse } from "next/server";

export type ProxyEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
};

export type TokenSnapshot = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export function getApiBase() {
  return resolveApiBase();
}

export function normalizeEnvelope<T>(raw: unknown, fallbackMessage = "Request failed"): ProxyEnvelope<T> {
  const source = (raw ?? {}) as Record<string, unknown>;
  const errorsRaw = (source.errors ?? source.Errors ?? []) as unknown;

  return {
    success: Boolean(source.success ?? source.Success),
    message: String(source.message ?? source.Message ?? fallbackMessage),
    data: (source.data ?? source.Data ?? source) as T | null,
    errors: Array.isArray(errorsRaw) ? errorsRaw.map((x) => String(x)) : [],
  };
}

export function extractTokens(raw: unknown): TokenSnapshot {
  const source = (raw ?? {}) as Record<string, unknown>;
  const data = (source.data ?? {}) as Record<string, unknown>;

  const accessToken = String(data.accessToken ?? source.accessToken ?? "") || undefined;
  const refreshToken = String(data.refreshToken ?? source.refreshToken ?? "") || undefined;
  const expiresIn = Number(data.expiresIn ?? source.expiresIn ?? 0) || undefined;

  return { accessToken, refreshToken, expiresIn };
}

export function withAuthCookies(response: NextResponse, tokens: TokenSnapshot) {
  if (!tokens.accessToken) return;

  response.cookies.set({
    name: "admin_access_token",
    value: tokens.accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn ?? 60 * 60 * 24,
  });

  if (tokens.refreshToken) {
    response.cookies.set({
      name: "admin_refresh_token",
      value: tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: "admin_access_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "admin_refresh_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
