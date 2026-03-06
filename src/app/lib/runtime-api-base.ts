export function resolveApiBase(): string {
  // 优先使用显式配置，便于 Docker/CI 注入。
  if (process.env.API_BASE && process.env.API_BASE.trim().length > 0) {
    return process.env.API_BASE;
  }

  // 本地开发统一走宿主机 Nginx 网关。
  return "http://localhost/api/v1";
}
