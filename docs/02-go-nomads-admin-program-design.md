# go-nomads-admin 完整程序设计文档

> **项目路径：** `/Users/walden/Workspaces/WaldenProjects/go-nomads-project/go-nomads-admin`
> **分析报告：** `01-go-nomads-app-analysis-report.md`
> **更新时间：** 2026-04-09
> **框架：** Next.js 14+ / TypeScript / Tailwind CSS / Tremor / NextAuth

## 运行验证快照（2026-04-08）

按真实管理员登录态完成本地运行验证，页面已确认可打开并进入真实数据渲染，而非仅壳层可见:

- `/dashboard`
- `/app-control`
- `/notifications`
- `/chat`
- `/ai-chat`
- `/membership`
- `/travel-plans`
- `/community`

本轮修复同时落在后端契约层:

1. 多个 Admin Controller 去除重复 `[Authorize]`，统一走共享用户上下文 + `_currentUser.IsAdmin()`，避免服务间认证配置不一致导致 401 或 authorization middleware 异常。
2. 多个 Admin 列表/详情接口从直接返回 Postgrest 实体改为返回 DTO，避免 Postgrest 元数据序列化导致的 500。

当前已验证的页面信号:

- `/app-control` 不再出现“部分工作台数据读取失败，当前页面已回退为可浏览模式：HTTP 500”。
- `/notifications` 已渲染真实统计与列表数据。
- `/chat` 已渲染真实会话列表。
- `/ai-chat` 已渲染真实 AI 会话表格。
- `/membership` 已渲染 4 个会员计划卡片。
- `/travel-plans` 已渲染真实计划列表与详情跳转入口。
- `/community` 已渲染真实社区内容结果。

## Admin 治理基线（2026-04-08 增补）

管理后台不应停留在“看板 + 删除按钮”层级，针对 App 实际展示的数据，默认应具备以下治理能力：

1. 列表页

- 支持分页、搜索、筛选。
- 列表中优先展示可读内容，不直接暴露 UUID 作为主展示字段。
- 关联实体必须展示内容字段，如 `userName`、`cityName`、`hotelName`、`title`。
- 每一行至少提供一个主跳转入口，可进入详情页。

1. 详情页

- 每条核心数据都应有详情页。
- 详情页要能解释这条数据与 App 前台的关系，例如来自哪个用户、属于哪个城市、当前状态为何。
- 详情页承载查看、编辑、隐藏/下线、删除、审计等动作，而不是把所有动作都堆在列表页。

1. 写操作

- App 前台会消费的数据，优先补齐新增、编辑、下线/隐藏、删除。
- 审核型页面至少要支持查看详情 + 状态变更，不应只有删除。

1. 联动展示

- `userId` 不是 UI 目标字段，只能作为辅助标识。
- `cityId`、`relatedId`、`creatorId` 等字段都应尽量映射为可读信息，并可跳转到关联实体详情。

## Workflow 闭环修正目标（2026-04-08 第二轮）

本轮不再泛化讨论“后台最终应支持什么”，而是聚焦当前已经上线到 Admin 的高频 workflow，补齐“列表页只显示 ID / 详情页信息不完整 / 后端 DTO 不可读”的残缺链路。

目标页面:

- `/community`
- `/notifications`
- `/chat`
- `/ai-chat`
- `/membership`

本轮统一闭环要求:

1. 列表页

- 主展示字段必须优先显示可读文本，不允许把 `userId`、`cityId`、`createdBy`、`scope` 直接当成主内容展示。
- 每行保留稳定的详情跳转入口，列表页不再承担全部治理信息。
- 搜索、筛选参数应由后端真实接收并参与查询，不能只在前端本页内做假过滤。

1. 详情页

- 详情页应展示足够的上下文信息，让管理员理解这条数据来自谁、影响哪里、当前状态是什么。
- 若已有详情页但仍回退显示 ID，则视为未闭环。
- 详情页要承载最小必要动作，例如状态变更、编辑、删除或跳转关联实体。

1. 后端 DTO

- 所有 Admin DTO 默认补齐 display-name 字段，例如 `userName`、`createdByName`、`recipientSummary`、`scopeDisplay`。
- 若源数据确实无法解析出可读文本，DTO 也要返回明确的 fallback 语义，而不是让前端自行猜测 ID 含义。
- 列表 DTO 与详情 DTO 都要按“Admin 可直接渲染”的标准设计，而不是只暴露底层实体字段。

本轮具体闭环项:

- Community: 补搜索/类型过滤真实生效，详情与列表优先展示作者名、城市名、状态中文语义。
- Notifications: 补范围显示、接收人摘要、状态/读数/调度信息，详情页支持真实编辑。
- Chat: 补后端搜索、创建者/成员/消息的可读展示，避免详情页继续回退到用户 ID。
- AI Chat: 补后端搜索，列表与详情页优先展示用户名、模型、消息上下文。
- Membership: 补完整计划详情 DTO 与订阅者明细接口，详情页展示权益、定价、限制与订阅者，而不只是价格卡片。

## 孤儿用户引用处理（2026-04-09 增补）

本轮补充一个此前未被显式建模的场景：`userId` 存在，但 UserService 已无法返回该用户主档。

统一处理规则：

1. `userId` 继续作为身份锚点保留，Admin 不得因为名字缺失就取消 `/users/{id}` 跳转。
2. 后端 Admin DTO 在用户主档缺失时返回显式 fallback，例如 `孤儿用户8e9a1156`，不再混同为 `未知用户` 或 `未命名用户`。
3. 前端共享用户链接组件对孤儿标签使用风险提示样式，提醒管理员这是数据完整性问题，而不是普通匿名用户。
4. `/users/[id]` 详情页在 `User not found` 时必须解释为“UserService 缺失主档，但业务数据仍在引用”，帮助管理员把问题归因到数据治理而不是导航故障。

当前浏览器审计结论：

- `/community` 与 `/travel-plans` 都引用了 `8e9a1156-671c-4be2-be97-9c0fa2098dc1`，该 ID 点击后返回 `User not found`。
- `/notifications` 已审计到的接收人链接均能正常打开用户详情。
- `/ai-chat` 已审计样本均能正常打开用户详情。

## 关联 ID 展示规范（2026-04-09 第二轮增补）

本轮在真实作业面验证中补充一条更严格的 Admin 契约规则：页面允许保留当前主实体的主键 ID 作为审计锚点，但不允许继续把关联实体的 raw ID 直接展示给管理员。

统一规则：

1. 详情页与列表页中，除当前记录自己的主 ID 外，所有 `userId`、`cityId`、`createdBy`、`acceptedAnswerId`、`relatedId`、`recipientId` 一类字段都必须由后端先解析成 display 字段，再由 DTO 返回给前端。
2. 前端页面不得承担“看到一个 ID 再自己猜它是谁/是什么”的职责；页面只消费 `userName`、`cityName`、`createdByName`、`acceptedAnswerSummary`、`relatedResourceName` 一类可直接渲染字段。
3. 若对应 service 无法解析出实体名称，DTO 仍需返回明确 fallback 语义，例如“孤儿用户8e9a1156”“已删除回答”“未知关联资源”，而不是把原始 ID 暴露给 UI。
4. 若页面需要保留关联跳转，仍以原始 ID 作为路由锚点，但页面主视觉与信息行默认显示解析后的名称/摘要。

本轮优先收口的高频页面：

- `/community/[id]`: 作者、城市、采纳回答
- `/notifications/[id]`: 接收对象、关联资源
- `/chat/[id]`: 创建者、成员、消息发送者
- `/ai-chat/[id]`: 用户

## 全量页面审计（2026-04-08）

| 页面 | 列表 | 详情 | 新建 | 编辑/状态变更 | 删除 | 关联内容展示 | 列表跳详情 | 结论 |
|------|------|------|------|---------------|------|--------------|------------|------|
| `/dashboard` | KPI/聚合 | 不适用 | 否 | 否 | 否 | 聚合卡片 | 局部跳转 | 作为总览页保留，无需 CRUD |
| `/app-control` | 聚合工作台 | 不适用 | 否 | 部分子模块 | 否 | 已接通多域采样 | 子模块跳转待增强 | 重点在治理入口，不做实体 CRUD |
| `/app-control/static-texts` | 是 | 是 | 是 | 是 | 是 | 以文案键为主 | 是 | 已补详情页，可查看文案正文与影响说明 |
| `/app-control/option-groups` | 是 | 是 | 是 | 是 | 是 | 组选项可读 | 是 | 已补详情页，可查看组选项级联视图 |
| `/app-control/config-publish` | 快照/发布 | 部分 | 是 | 回滚 | 否 | 快照号/时间 | 部分 | 适合作为运维页 |
| `/users` | 是 | 是 | 否 | 是 | 否 | 名称/邮箱可读，详情可看会员/旅行信号 | 是 | 已补详情页、资料编辑与角色管理 |
| `/cities` | 是 | 是 | 否 | 弱 | 否 | 城市名可读 | 是 | 缺新建、编辑、下线 |
| `/coworking` | 是 | 是 | 否 | 弱 | 否 | 城市可读 | 是 | 缺新建、编辑、审核状态管理 |
| `/hotels` | 是 | 是 | 是 | 弱 | 否 | 城市可读 | 是 | 缺编辑与删除/下线 |
| `/meetups` | 是 | 是 | 否 | 弱 | 否 | 城市/组织者可读 | 是 | 缺编辑、取消、下架 |
| `/innovation` | 是 | 是 | 否 | 弱 | 否 | 作者可读 | 是 | 缺新建、编辑、删除 |
| `/travel-plans` | 是 | 是 | 否 | 是 | 是 | 用户名与计划内容可读，支持跳转用户详情 | 是 | 已补状态管理，列表与详情页保留 userId 作为身份锚点 |
| `/community` | 是 | 否 | 否 | 否 | 是 | 作者/城市可读，作者支持跳转用户详情 | 是 | 已补详情、隐藏/恢复、作者联动；城市仍待实体详情闭环 |
| `/notifications` | 是 | 否 | 是 | 否 | 是 | 范围与内容可读，定向用户支持跳转用户详情 | 是 | 已补详情、编辑；群体范围仍以摘要文案展示 |
| `/chat` | 是 | 否 | 否 | 否 | 是 | 房间、成员、消息可读，成员/消息发送者支持跳转用户详情 | 是 | 已补详情页与参与者联动，仍缺更完整搜索闭环 |
| `/ai-chat` | 是 | 否 | 否 | 否 | 是 | 用户列与详情支持跳转用户详情 | 是 | 已补详情页、会话消息明细、用户联动 |
| `/membership` | 是 | 否 | 是 | 是 | 是 | 套餐信息可读 | 否 | 缺套餐详情页与订阅者明细 |
| `/moderators` | 是 | 否 | 否 | 是 | 是 | 用户/城市可读 | 否 | 缺详情页 |
| `/moderation/reports` | 是 | 部分 | 否 | 弱 | 否 | 举报人/目标待增强 | 弱 | 缺 Admin 闭环处置接口 |
| `/moderation/city-photos` | 是 | 否 | 否 | 弱 | 否 | 图片可见，缺用户/城市上下文 | 否 | 缺详情与审核闭环 |
| `/city-reviews` | 是 | 否 | 否 | 弱 | 否 | 用户/城市可读 | 否 | 缺详情、隐藏、删除 |
| `/hotel-reviews` | 是 | 否 | 否 | 弱 | 否 | 用户/酒店可读 | 否 | 缺详情、隐藏、删除 |
| `/pros-cons` | 是 | 否 | 否 | 部分 | 是 | 用户/城市可读 | 否 | 缺详情与恢复动作 |
| `/event-types` | 是 | 否 | 是 | 是 | 是 | 类型名可读 | 否 | 缺详情页 |
| `/iam/roles` | 是 | 是 | 是 | 是 | 是 | 角色名与用户数可读 | 是 | 需统一到产品化表格/表单标准 |
| `/legal` | 是 | 是 | 是 | 是 | 是 | 文档标题/版本/状态可读 | 是 | 作为法务内容管理页闭环 |
| `/analytics` | 聚合分析 | 不适用 | 否 | 否 | 否 | 图表可读 | 跳转待补 | 作为分析页保留，无需实体 CRUD |
| `/operations` | 运营入口 | 不适用 | 否 | 否 | 否 | 入口为主 | 是 | 适合作为导航页 |
| `/settings` | 是 | 是 | 是 | 是 | 是 | 配置分组与值可读 | 是 | 由真实配置实体承载并纳入快照 |

## 分期建议

### P0：直接影响 App 展示内容与管理闭环

- `/users`
- `/travel-plans`
- `/community`
- `/notifications`
- `/chat`
- `/ai-chat`
- `/membership`
- `/app-control/static-texts`
- `/app-control/option-groups`

P0 统一要求：

- 列表行可点击进入详情。
- 列表优先显示可读内容而非 ID。
- 补单条详情 API。
- 补最小可治理动作：编辑/状态变更/删除 中至少两类。

### P1：内容审核、系统治理与后台标准化

- `/city-reviews`
- `/hotel-reviews`
- `/pros-cons`
- `/moderation/reports`
- `/moderation/city-photos`
- `/moderators`
- `/iam/roles`
- `/legal`
- `/settings`

### P2：资源配置与运营分析页

- `/cities`
- `/coworking`
- `/hotels`
- `/meetups`
- `/innovation`
- `/event-types`
- `/settings`
- `/analytics`

---

## 一、项目架构

### 1.1 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14+ (App Router) |
| 语言 | TypeScript |
| UI 组件 | Tailwind CSS + Tremor + Radix UI |
| 状态 | React Server Components + Server Actions |
| 图表 | Tremor 内置图表 |
| 地图 | 高德地图 / 腾讯地图 |
| 认证 | NextAuth.js（管理员 JWT）|
| API | 后端微服务（Gateway）|
| 国际化 | 计划中 |

### 1.2 项目结构

```
go-nomads-admin/src/
├── app/
│   ├── (admin)/                    ← 管理后台布局
│   │   ├── layout.tsx              ← 管理员 Shell
│   │   ├── dashboard/
│   │   ├── cities/
│   │   │   ├── page.tsx          ← 城市列表
│   │   │   └── [id]/page.tsx     ← 城市详情
│   │   ├── hotels/
│   │   │   ├── page.tsx          ← 酒店列表 ⭐新增
│   │   │   └── [id]/page.tsx     ← 酒店详情 ⭐新增
│   │   ├── hotel-reviews/          ← 酒店评论审核 ⭐新增
│   │   ├── coworking/
│   │   ├── meetups/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── event-types/            ← 活动类型管理 ⭐新增
│   │   ├── innovations/
│   │   ├── travel-plans/          ← AI 旅行计划 ⭐新增
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── profile/        ← 用户详情
│   │   │       ├── travel-history/ ← 旅行历史
│   │   │       └── membership/     ← 会员信息
│   │   ├── moderators/             ← 版主管理 ⭐新增
│   │   ├── moderator-applications/ ← 版主申请审批 ⭐新增
│   │   ├── city-reviews/          ← 城市评论审核 ⭐新增
│   │   ├── pros-cons/             ← 优缺点审核 ⭐新增
│   │   ├── community/              ← 社区内容管理 ⭐新增
│   │   ├── notifications/         ← 通知推送管理 ⭐新增
│   │   ├── chat/                  ← 聊天记录管理 ⭐新增
│   │   ├── ai-chat/               ← AI 对话管理 ⭐新增
│   │   ├── membership/             ← 会员订阅管理 ⭐新增
│   │   ├── analytics/              ← 高级数据分析 ⭐新增
│   │   ├── moderation/
│   │   │   ├── reports/           ← 举报审核（已有）
│   │   │   └── city-photos/       ← 照片审核（已有）
│   │   ├── iam/
│   │   │   └── roles/             ← 角色管理（已有）
│   │   ├── settings/               ← 系统设置 ⭐新增
│   │   └── operations/            ← 运营管理（已有）
│   │
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── api/                        ← API Routes（Server Actions）
│
├── components/
│   ├── admin/
│   │   ├── AdminShell.tsx         ← 侧边栏 + 顶部导航
│   │   ├── AdminTable.tsx         ← 通用数据表格
│   │   ├── FilterBar.tsx         ← 通用筛选栏
│   │   ├── StatCard.tsx           ← 通用统计卡片
│   │   ├── Pagination.tsx         ← 通用分页
│   │   ├── ConfirmDialog.tsx      ← 确认对话框
│   │   ├── ImageUploader.tsx      ← 图片上传
│   │   ├── RichTextEditor.tsx     ← 富文本编辑
│   │   └── StatusBadge.tsx        ← 状态徽章
│   └── ui/                        ← 基础 UI 组件
│
├── lib/
│   ├── admin-api.ts               ← 管理员 API 客户端
│   ├── auth-client.ts             ← NextAuth 配置
│   ├── api.ts                     ← 通用 API 封装
│   └── utils.ts                   ← 工具函数
│
└── types/
    └── admin.ts                    ← 管理员专用类型
```

---

## 二、页面功能详细设计

### 2.1 Dashboard（数据概览）— `/dashboard`

**已有：** KPI 卡片（用户/城市/Coworking/Meetup/Innovation）

**新增增强：**
```
KPI 卡片（扩展）：
  ├── 用户维度
  │     ├── 总用户数
  │     ├── 日新增
  │     ├── 月活跃（DAU/WAU）
  │     ├── 新注册转化率
  │     └── 付费用户数
  │
  ├── 业务维度
  │     ├── 总酒店数
  │     ├── 总评论数
  │     ├── 总旅行计划数
  │     ├── AI 对话数
  │     └── 消息数
  │
  └── 审核维度
        ├── 待审核（举报/照片/评论/优缺点）
        └── 今日处理

图表：
  ├── 用户增长趋势（折线图）
  ├── 内容增长趋势（柱状图）
  ├── 各城市活跃度（地图热力图）
  ├── Top 10 城市（条形图）
  └── 会员转化漏斗
```

---

### 2.2 Hotel 酒店管理 — `/hotels`

#### 2.2.1 酒店列表 `/hotels`

**筛选栏：**
- 关键词搜索（名称/城市）
- 来源：`全部 / Community / Booking.com`
- 分类：`全部 / Luxury / Budget / Hostel`
- 状态：`全部 / 正常 / 已下线`
- 城市筛选
- 有无数字游民特性：`全部 / 是 / 否`

**表格列：**
| 列名 | 说明 |
|------|------|
| ID | 截断显示 |
| 名称 | 支持跳转详情 |
| 来源 | Badge（Community / Booking） |
| 城市 | 城市名称 |
| 分类 | Badge |
| 评分 | ⭐ 4.5（5） |
| 评论数 | |
| 价格范围 | ¥200-500/晚 |
| 数字游民评分 | nomadScore |
| 数字游民特性 | WiFi/Desk/Coworking 等图标 |
| 状态 | 正常/已下线 Badge |
| 创建时间 | |
| 操作 | 查看/编辑/下线 |

**批量操作：**
- 批量下线
- 批量导出

#### 2.2.2 酒店详情 `/hotels/[id]`

**Tab 结构：**
```
基本信息 Tab
  ├── 基本信息表单（编辑）
  │     ├── 名称、地址、城市
  │     ├── 分类、星级
  │     ├── 联系方式（电话/邮箱/网站）
  │     └── 特色标签
  ├── 图片管理
  │     ├── 主图设置
  │     ├── 图片列表（拖拽排序）
  │     └── 上传新图片
  └── 数字游民特性
        ├── WiFi 速度（Mbps）
        ├── 是否有工位
        ├── 是否有共享办公区
        └── 长住折扣

房型管理 Tab ⭐新增
  ├── 房型列表
  │     ├── 名称、描述
  │     ├── 人数/床型/面积
  │     ├── 价格/货币
  │     ├── 可用房间数
  │     └── 状态（可用/不可用）
  └── 新增房型表单

评论管理 Tab ⭐新增
  ├── 评论列表（分页）
  │     ├── 用户/评分/内容
  │     ├── 图片
  │     └── 操作：隐藏/删除
  └── 筛选：评分/日期

统计数据 Tab
  ├── 浏览量/收藏数/预订数
  ├── 预订转化率
  └── 平均停留时长
```

---

### 2.3 Hotel Review 酒店评论审核 — `/hotel-reviews`

**列表结构：**
| 列名 | 说明 |
|------|------|
| 评论 ID | |
| 用户 | 头像+名称 |
| 酒店 | 关联酒店名称 |
| 评分 | ⭐4 |
| 内容 | 截断 |
| 图片 | 缩略图列表 |
| 状态 | 正常/已隐藏 Badge |
| 时间 | |
| 操作 | 查看/隐藏/删除 |

**筛选：**
- 酒店名称
- 评分范围
- 状态
- 时间范围

---

### 2.4 City Review 城市评论审核 — `/city-reviews`

**列表结构：**
| 列名 | 说明 |
|------|------|
| 评论 ID | |
| 用户 | 头像+名称 |
| 城市 | |
| 评分 | ⭐4 |
| 标题/内容 | |
| 访问日期 | |
| 停留时长 | |
| 点赞数 | |
| 状态 | |
| 操作 | 查看/隐藏/删除 |

---

### 2.5 Event Type 活动类型管理 — `/event-types`

**列表结构：**
| 列名 | 说明 |
|------|------|
| 图标 | 🎨 |
| 类型名称（中/英）| |
| 描述 | |
| 关联活动数 | |
| 创建时间 | |
| 操作 | 编辑/删除 |

**新增/编辑表单：**
- 类型名称（中/英）
- 图标选择器
- 颜色选择器
- 描述

---

### 2.6 Travel Plan AI 旅行计划管理 — `/travel-plans`

**列表结构：**
| 列名 | 说明 |
|------|------|
| 计划 ID | |
| 用户 | 生成者 |
| 目的地 | 城市名称 |
| 天数 | |
| 预算等级 | Badge |
| 旅行风格 | Badge |
| 完成度 | 进度条 |
| 状态 | planning/confirmed/completed Badge |
| 创建时间 | |
| 操作 | 查看/取消 |

**旅行计划详情 `/travel-plans/[id]`**

身份联动约束：

- `userName` 仅作为展示名，`userId` 才是用户身份锚点。
- 列表和详情页只要拿到 `userId`，都应允许跳转到 `/users/{id}`。
- 如果聚合接口返回的是占位文案，前端仍应基于 `userId` 生成可识别短标签，避免出现死文本“未知用户”。

Tab 结构：

```
基本信息 Tab
  ├── 目的地信息
  ├── 元数据（天数/预算/风格/兴趣）
  ├── 出发地/出发日期
  └── 状态管理

每日行程 Tab
  ├── 日程列表
  │     ├── 主题
  │     ├── 活动数
  │     └── 预估花费
  └── 行程详情（可展开）

景点推荐 Tab
  ├── 景点列表（评分/类别/门票/最佳时间）
  └── 标记热门/删除

餐厅推荐 Tab
  ├── 餐厅列表（评分/菜系/价格/位置）
  └── 标记热门/删除

预算 Tab
  ├── 各项占比（饼图）
  └── 总额/日均

提示 Tab
  └── 用户提示列表
```

---

### 2.7 Moderator 版主管理 — `/moderators`

**列表结构：**

| 列名 | 说明 |
|------|------|
| 用户 | 头像+名称 |
| 城市 | 管理的城市 |
| 国家 | |
| 旅行统计 | 访问国家/城市数 |
| 最新旅行 | 最近访问城市 |
| 加入时间 | |
| 操作 | 查看/移除版主 |

**版主详情 `/moderators/[userId]`**

- 用户信息
- 管理的城市
- 旅行历史
- 旅行统计

---

### 2.8 Moderator Application 版主申请审批 — `/moderator-applications`

**申请状态：** pending / approved / rejected

**列表结构：**

| 列名 | 说明 |
|------|------|
| 申请人 | |
| 申请城市 | |
| 申请理由 | |
| 旅行统计 | 国家/城市/天数 |
| 最新旅行历史 | |
| 申请时间 | |
| 状态 | |
| 操作 | 审批通过/拒绝/查看详情 |

---

### 2.9 Pros/Cons 优缺点审核 — `/pros-cons`

**列表结构：**

| 列名 | 说明 |
|------|------|
| 内容 | 文本 |
| 类型 | Pros / Cons Badge |
| 用户 | |
| 城市 | |
| 点赞/点踩 | |
| 状态 | 正常/已隐藏 |
| 时间 | |
| 操作 | 查看/隐藏/删除 |

**筛选：**

- 城市
- 类型
- 状态
- 争议度（点赞-点踩 排序）

---

### 2.10 Notification 通知推送管理 — `/notifications`

**创建通知表单：**

```
通知类型：系统通知 / 活动提醒 / 系统公告
标题
内容（富文本）
发送范围：全部用户 / 指定用户 / 指定城市用户
发送时间：立即发送 / 定时发送
跳转链接（可选）
```

**通知列表：**

| 列名 | 说明 |
|------|------|
| 通知 ID | |
| 类型 | Badge |
| 标题 | |
| 内容摘要 | |
| 发送范围 | |
| 发送时间 | |
| 送达数/阅读数 | |
| 状态 | 已发送/待发送/草稿 |

身份联动约束：

- `recipientSummary` 适用于管理员群体、城市版主等群体范围。
- 定向用户通知必须保留 `userId` 与 `recipientUserName`，并允许跳转到 `/users/{id}`。
- 页面不能把 `userId` 直接当作接收对象主文案。

---

### 2.11 Chat 聊天记录管理 — `/chat`

**会话列表：**

| 列名 | 说明 |
|------|------|
| 会话 ID | |
| 参与者 | 双方用户头像+名称 |
| 最后消息 | 截断 |
| 未读数 | |
| 最后活跃时间 | |
| 操作 | 查看记录/举报处理 |

**聊天记录详情 `/chat/[conversationId]`**

- 双方用户信息
- 消息列表（气泡形式）
- 时间戳
- 举报标记

---

### 2.12 AI Chat AI 对话管理 — `/ai-chat`

**AI 对话列表：**

| 列名 | 说明 |
|------|------|
| 会话 ID | |
| 用户 | |
| 最新消息摘要 | |
| 模型 | |
| Token 消耗 | |
| 创建时间 | |
| 操作 | 查看对话/统计 |

**对话详情 `/ai-chat/[sessionId]`**

- 用户信息
- 完整对话（问答形式）
- Token 消耗
- 意图分类标签
- 导出对话

身份联动约束：

- `userId` 是 AI 会话归属用户的唯一身份锚点。
- 列表与详情页应优先展示可读名称，但都必须支持跳转到 `/users/{id}`。

---

### 2.13 Membership 会员订阅管理 — `/membership`

**会员计划列表：**

| 列名 | 说明 |
|------|------|
| 计划名称 | |
| 价格 | |
| 有效期 | 月/年 |
| 功能权限 | |
| 订阅人数 | |
| 创建时间 | |
| 操作 | 编辑/下线/查看订阅者 |

**订阅者列表：**

| 列名 | 说明 |
|------|------|
| 用户 | |
| 计划 | |
| 订阅时间 | |
| 到期时间 | |
| 状态 | 有效/已过期/已取消 |
| 操作 | 续费/退款/取消 |

---

### 2.14 Community 社区内容管理 — `/community`

（如果 App 有社区模块）

**内容列表：**

| 列名 | 说明 |
|------|------|
| 内容 ID | |
| 类型 | 帖子/评论 |
| 作者 | |
| 内容摘要 | |
| 点赞/评论数 | |
| 城市关联 | |
| 状态 | |
| 时间 | |
| 操作 | 查看/隐藏/删除 |

身份联动约束：

- `authorName` 是聚合展示字段，`authorId` 是作者身份锚点。
- 列表与详情页中作者位必须支持跳转到 `/users/{id}`。
- 如果后端无法解析真实姓名，也不能回退成不可点击的占位词。

---

### 2.15 Analytics 高级数据分析 — `/analytics`

**Tab 结构：**

```
用户分析 Tab
  ├── 用户增长（折线图：日/周/月）
  ├── 用户留存（留存曲线）
  ├── 用户画像（地理分布/兴趣分布）
  └── 付费漏斗

业务分析 Tab
  ├── 城市热度排名（Top 20）
  ├── 酒店浏览/预订转化
  ├── 活动参与率
  ├── 旅行计划生成数/完成率
  └── AI 对话使用率

内容分析 Tab
  ├── 评论增长趋势
  ├── 优缺点贡献排行
  ├── 照片上传量
  └── 举报内容分类

收入分析 Tab（如果有支付数据）
  ├── 会员收入
  ├── 付费转化率
  └── ARPU
```

---

### 2.16 Settings 系统设置 — `/settings`

```
Settings 以真实配置项实体承载，不再使用前端假表单。

Section
  ├── general        基本设置
  ├── moderation     审核设置
  ├── ai             AI 设置
  ├── notification   通知设置
  └── maintenance    系统维护

Setting Item
  ├── key            稳定配置键
  ├── label          后台展示名
  ├── valueType      string / number / boolean / json
  ├── value          当前值
  ├── defaultValue   默认值
  ├── description    使用说明
  └── isActive       启用状态

后台 workflow
  ├── 列表：按 section / search 检索
  ├── 详情：查看完整配置与更新时间
  ├── 新建：新增配置项
  ├── 编辑：更新值、类型、说明、状态
  ├── 删除：逻辑删除或下线配置项
  └── 发布：纳入 Config snapshot，支持回滚观察
```

### 2.17 System 模块产品化标准

System 分组页面统一采用同一套页面组件与间距规范，避免 `roles`、`legal`、`settings` 各写一套 UI 节奏。

统一要求：

- 页面使用统一 hero、section、table-shell、form-grid 结构。
- 标题、正文、辅助说明、mono 字段使用统一字体层级，不再各页散落 `text-xs` / `text-sm`。
- 文本块、输入框、按钮组、表格 meta 区域使用统一 margin / padding token。
- 详情、创建、编辑统一使用同风格 modal / side panel。
- 过滤栏、指标卡、主操作区采用同一布局语义，保证系统模块可复制扩展。

---

## 三、通用组件设计

### 3.1 AdminShell（管理后台框架）

**布局：**
```
┌─────────────────────────────────────────────────┐
│  Header: Logo + 站点名称        用户下拉 | 通知 |
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  Sidebar │           Main Content               │
│          │                                      │
│  - Dashboard                                  │
│  - 城市管理                                    │
│    - 城市列表                                  │
│    - 城市评论                                  │
│    - 优缺点                                    │
│  - 酒店管理 ← 新增                            │
│    - 酒店列表                                  │
│    - 酒店评论                                  │
│  - 共享办公                                    │
│  - 活动管理                                    │
│    - 活动列表                                  │
│    - 活动类型                                  │
│  - AI 旅行计划 ← 新增                          │
│  - 用户管理                                    │
│    - 用户列表                                  │
│    - 版主管理 ← 新增                           │
│    - 会员管理                                  │
│  - 内容审核                                    │
│    - 举报审核                                  │
│    - 照片审核                                  │
│  - 运营                                       │
│    - 通知推送 ← 新增                           │
│    - AI 对话 ← 新增                           │
│    - 聊天记录 ← 新增                           │
│  - 系统                                       │
│    - 角色管理                                  │
│    - 系统设置 ← 新增                           │
│    - 数据分析 ← 新增                           │
└────┴──────────────────────────────────────────┘
```

**侧边栏要求：**
- 可折叠（hover 展开）
- 分组显示
- Badge 显示待审核数量
- 活跃状态高亮
- 权限控制（RBAC）

---

### 3.2 AdminTable（通用数据表格）

**功能：**
- 列定义配置化
- 支持排序（本地/服务端）
- 支持筛选
- 支持批量选择
- 行操作按钮（查看/编辑/删除）
- 批量操作工具栏
- 加载状态骨架屏
- 空状态提示
- 分页（支持自定义每页条数）

---

### 3.3 FilterBar（通用筛选栏）

**组件化筛选器：**
```tsx
<FilterBar>
  <SearchInput placeholder="搜索..." />
  <SelectFilter options={statusOptions} label="状态" />
  <SelectFilter options={typeOptions} label="类型" />
  <DateRangeFilter label="时间范围" />
  <Button variant="primary">搜索</Button>
  <Button variant="ghost">重置</Button>
</FilterBar>
```

---

### 3.4 StatCard（统计卡片）

统一外观：
- 标题 + 数值 + 趋势箭头
- 可选：对比数据/图标
- 颜色区分（蓝/绿/红/琥珀）

---

### 3.5 StatusBadge（状态徽章）

统一颜色映射：
```
正常 / Active  → 绿色
禁用 / Inactive → 灰色
待审核 / Pending → 黄色
已删除 / Deleted → 红色
草稿 / Draft   → 蓝色
已下线 / Offline → 灰色
已取消 / Cancelled → 红色
```

---

### 3.6 ConfirmDialog（确认对话框）

用于：
- 删除操作（显示「删除」提示）
- 状态变更（显示原状态→新状态）
- 批量操作确认

---

### 3.7 ImageUploader（图片上传）

- 支持拖拽上传
- 图片预览
- 进度条
- 删除已上传图片
- 最大数量限制

---

## 四、API 层设计

### 4.1 API 客户端模式

```typescript
// lib/admin-api.ts

// 统一 API 响应封装
type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
};

type Paginated<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

// API 函数签名规范
async function adminGet<T>(endpoint: string, params?: Record<string, string>): Promise<ApiEnvelope<T>>
async function adminPost<T>(endpoint: string, body: unknown): Promise<ApiEnvelope<T>>
async function adminPut<T>(endpoint: string, body: unknown): Promise<ApiEnvelope<T>>
async function adminDelete<T>(endpoint: string): Promise<ApiEnvelope<T>>
```

### 4.2 API 端点映射

| 模块 | 列表 | 详情 | 创建 | 更新 | 删除 |
|------|------|------|------|------|------|
| Hotel | GET /hotels | GET /hotels/{id} | POST /hotels | PUT /hotels/{id} | DELETE /hotels/{id} |
| HotelRoom | — | — | POST /hotels/{id}/rooms | PUT /rooms/{id} | DELETE /rooms/{id} |
| HotelReview | GET /hotel-reviews | — | — | PUT /hotel-reviews/{id}/hide | DELETE /hotel-reviews/{id} |
| CityReview | GET /city-reviews | — | — | PUT /city-reviews/{id}/hide | DELETE /city-reviews/{id} |
| EventType | GET /event-types | GET /event-types/{id} | POST /event-types | PUT /event-types/{id} | DELETE /event-types/{id} |
| TravelPlan | GET /travel-plans | GET /travel-plans/{id} | — | PUT /travel-plans/{id} | DELETE /travel-plans/{id} |
| Moderator | GET /moderators | GET /moderators/{id} | POST /moderators/assign | — | DELETE /moderators/{cityId} |
| ModeratorApp | GET /moderator-applications | — | — | PUT /moderator-applications/{id} | — |
| ProsCons | GET /pros-cons | — | — | PUT /pros-cons/{id}/hide | DELETE /pros-cons/{id} |
| Notification | GET /notifications | GET /notifications/{id} | POST /notifications | PUT /notifications/{id} | DELETE /notifications/{id} |
| Chat | GET /conversations | GET /conversations/{id} | — | — | DELETE /conversations/{id} |
| AIMessage | GET /ai-sessions | GET /ai-sessions/{id} | — | — | DELETE /ai-sessions/{id} |
| Membership | GET /memberships/plans | GET /memberships/plans/{id} | POST /memberships/plans | PUT /memberships/plans/{id} | DELETE /memberships/plans/{id} |
| Community | GET /community/posts | GET /community/posts/{id} | — | PUT /community/posts/{id} | DELETE /community/posts/{id} |

---

## 五、路由与权限设计

### 5.1 路由权限矩阵

| 角色 | Dashboard | Hotel | HotelReview | CityReview | EventType | TravelPlan | Moderator | User | Moderation | Analytics | Settings |
|------|-----------|-------|-------------|-----------|-----------|-----------|-----------|------|-----------|-----------|---------|
| SuperAdmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ContentAdmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| HotelAdmin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| UserAdmin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Moderator | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |

### 5.2 NextAuth 权限配置

```typescript
// 权限枚举
enum Permission {
  VIEW_DASHBOARD,
  MANAGE_HOTELS,
  MANAGE_HOTEL_REVIEWS,
  MANAGE_CITY_REVIEWS,
  MANAGE_EVENT_TYPES,
  MANAGE_TRAVEL_PLANS,
  MANAGE_MODERATORS,
  MANAGE_USERS,
  MANAGE_MODERATION,
  VIEW_ANALYTICS,
  MANAGE_SETTINGS,
}

// 角色权限映射
const rolePermissions: Record<Role, Permission[]> = {
  super_admin: Object.values(Permission),
  content_admin: [Permission.VIEW_DASHBOARD, Permission.MANAGE_HOTELS, ...],
  hotel_admin: [Permission.VIEW_DASHBOARD, Permission.MANAGE_HOTELS],
  user_admin: [Permission.VIEW_DASHBOARD, Permission.MANAGE_USERS, Permission.MANAGE_MODERATORS],
  moderator: [Permission.VIEW_DASHBOARD, Permission.MANAGE_CITY_REVIEWS, Permission.MANAGE_MODERATION],
};
```

---

## 六、页面实现顺序

### Phase 1：核心内容管理（P0）
1. 酒店列表 + 详情页
2. 酒店评论审核
3. 城市评论审核
4. 活动类型管理

### Phase 2：高级功能（P1）
5. AI 旅行计划管理
6. 版主管理 + 版主申请审批
7. 优缺点审核
8. 高级数据分析

### Phase 3：用户与通信（P2）
9. 用户旅行历史
10. 聊天记录管理
11. AI 对话管理
12. 通知推送管理

### Phase 4：运营辅助（P3）
13. 社区内容管理
14. 会员订阅管理
15. 系统设置
16. AI 知识库管理

---

## 七、技术规范

### 7.1 组件开发规范

**命名：**
- 页面组件：`PageNamePage`（如 `HotelsPage`）
- 客户端组件：`PageNameClient`（如 `HotelsClient`）
- 子组件：`FeatureNameComponentName`（如 `HotelReviewTable`）

**样式：**
- 优先使用 Tailwind CSS
- 禁止使用内联 style
- 使用 Tailwind 的 `sm:` `md:` `lg:` `xl:` 进行响应式
- 使用 CSS 变量管理主题色

**状态管理：**
- 列表数据：Server Components + Server Actions
- 表单/交互：React Hook Form + Zod
- 复杂状态：Zustand（如果需要）

**数据获取：**
- 使用 Server Actions 进行 CRUD
- 使用 Suspense 处理加载状态
- 列表页使用 `generateStaticParams` 预渲染

### 7.2 代码规范

- 严格 TypeScript（`strict: true`）
- 组件文件不超过 300 行，超出则拆分
- 工具函数提取到 `lib/utils.ts`
- 类型定义提取到 `types/` 目录
- API 调用统一封装在 `lib/admin-api.ts`

---

## 八、UI 设计规范

### 8.1 色彩系统

| 用途 | 色值 | Tailwind 类 |
|------|------|------------|
| 主色 | `#2563EB` | blue-600 |
| 主色深 | `#1D4ED8` | blue-700 |
| 成功 | `#16A34A` | green-600 |
| 警告 | `#D97706` | amber-600 |
| 错误 | `#DC2626` | red-600 |
| 页面背景 | `#F8FAFC` | slate-50 |
| 卡片背景 | `#FFFFFF` | white |
| 边框 | `#E2E8F0` | slate-200 |
| 主文字 | `#0F172A` | slate-900 |
| 次要文字 | `#64748B` | slate-500 |

### 8.2 字体

- 主字体：`Inter`（Google Fonts）
- 等宽字体：`JetBrains Mono`（用于 ID、代码）
- 中文：`Noto Sans SC`

### 8.3 间距系统

使用 Tailwind 默认间距，原则：
- 页面内边距：`p-6`
- 卡片间距：`gap-4`
- 表单项间距：`space-y-4`
- 表格行高：`h-12`（48px）

### 8.4 响应式断点

| 断点 | 宽度 | 适用 |
|------|------|------|
| sm | 640px | 手机横屏 |
| md | 768px | 平板 |
| lg | 1024px | 笔记本 |
| xl | 1280px | 台式机 |
| 2xl | 1536px | 大屏 |

---

_设计完成于 2026-03-22_
