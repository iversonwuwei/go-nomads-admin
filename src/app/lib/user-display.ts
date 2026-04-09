const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PLACEHOLDER_NAMES = new Set([
  "未命名用户",
  "未知用户",
  "匿名用户",
  "未命名作者",
  "未命名创建者",
  "Unknown User",
]);

export function getDisplayName(value?: string | null, fallback = "未命名用户"): string {
  const normalized = value?.trim();
  if (!normalized || UUID_PATTERN.test(normalized)) {
    return fallback;
  }

  return normalized;
}

export function getDisplayInitial(value?: string | null, fallback = "未命名用户"): string {
  return getDisplayName(value, fallback).slice(0, 1) || "?";
}

export function getUserDisplayName(
  value?: string | null,
  userId?: string | null,
  fallback = "未命名用户",
): string {
  const normalizedValue = value?.trim();
  const resolved = getDisplayName(value, "");
  if (resolved && !PLACEHOLDER_NAMES.has(normalizedValue ?? "")) {
    return resolved;
  }

  if (fallback?.trim()) {
    return fallback;
  }

  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    return "未命名用户";
  }

  const shortId = normalizedUserId.replaceAll("-", "").slice(0, 8);
  return shortId ? `用户${shortId}` : "未命名用户";
}

export function getUserDisplayInitial(
  value?: string | null,
  userId?: string | null,
  fallback = "未命名用户",
): string {
  return getUserDisplayName(value, userId, fallback).slice(0, 1) || "?";
}