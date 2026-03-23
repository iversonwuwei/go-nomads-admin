# go-nomads-admin 完整程序设计文档

> **项目路径：** `/Users/walden/Workspaces/WaldenProjects/go-nomads-project/go-nomads-admin`
> **分析报告：** `01-go-nomads-app-analysis-report.md`
> **更新时间：** 2026-03-22
> **框架：** Next.js 14+ / TypeScript / Tailwind CSS / Tremor / NextAuth

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
基本设置
  ├── 网站名称/Logo
  ├── 联系方式
  └── 社交媒体链接

审核设置
  ├── 自动审核规则
  ├── 关键词过滤
  └── 举报处理流程

AI 设置
  ├── 默认模型
  ├── Token 限制
  └── 知识库配置

通知设置
  ├── 推送通知配置
  └── 邮件通知配置

系统维护
  ├── 缓存清理
  ├── 日志导出
  └── 数据备份
```

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
