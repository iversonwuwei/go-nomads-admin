---
applyTo: "src/**/*.{ts,tsx}"
---

# Next.js 管理后台开发规范

## Harness Engineering 基线
- 本工程默认遵循根目录 `HARNESS_ENGINEERING_CHECKLIST.md`。
- 交付说明默认遵循根目录 `HARNESS_DELIVERY_TEMPLATE.md`。
- 开发前先明确权限边界、后台数据契约、失败路径与验证方式。
- 后台改动必须同时检查鉴权、空态/错误态、操作审计可观测性，以及发布回滚影响。

## 技术栈
与 go-nomads-web 相同，额外包含：
- @tremor/react（数据可视化、图表、KPI 卡片）
- JWT 认证中间件（Cookie: `admin_access_token`）

## 认证流程
- 登录后将 JWT 存入 Cookie `admin_access_token`
- `src/proxy.ts` 中间件解析 JWT，校验角色
- 支持标准 `role` 和 .NET Claims 格式角色解析
- 公开路径（无需认证）: `/login`, `/register`, `/forgot-password`, `/privacy`, `/api/*`

## 路由结构
- 管理页面在 `(admin)/` 路由组下
- 登录/注册等公开页面在根级路由
- 新增管理页面放 `src/app/(admin)/{feature}/page.tsx`

## 组件与样式
- 共享组件: `src/app/components/`
- 工具函数: `src/app/lib/`
- 数据可视化优先使用 Tremor 组件（BarChart, LineChart, Card, Metric）
- 表格/表单优先使用 DaisyUI 组件类
- 不要引入额外 UI 库（已有 DaisyUI + Tremor + HeadlessUI）

## 代码质量
- Biome 2.x 负责 lint + format
- React Compiler 已启用
- 类型定义优先使用 `type`
- 不要使用 `any` 类型

## API 交互
- 通过 Gateway 统一通信，路径前缀 `/api/v1`
- 请求需携带 `admin_access_token` Cookie

## 部署
- Docker 端口: 3002
- 输出: `standalone` 模式
