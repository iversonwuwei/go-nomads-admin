# TOOLS.md - Local Notes

## 开发环境

- 包管理: Yarn 4.5.1
- 端口: dev 3002, Docker 3002
- Lint/Format: Biome 2.x
- Node.js: v20+

## 常用命令

```bash
# 开发
yarn dev

# 构建
yarn build

# Biome 检查
yarn biome check src/

# Docker 构建
docker compose up --build
```

## 认证

- JWT Cookie: `admin_access_token`
- 角色解析: 标准 `role` + .NET Claims 格式
- 公开路径: `/login`, `/register`, `/forgot-password`, `/privacy`, `/api/*`

## 数据可视化

- 图表库: @tremor/react
- 组件: BarChart, LineChart, DonutChart, Card, Metric, Table
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
