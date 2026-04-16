# Go Nomads Admin Blueprint

## 1. 目标与边界

本方案基于现有代码事实，设计 `go-nomads-admin` 的三层能力：

1. 数据中心 (Data Center): 统一指标、报表、监控与审计。
2. 数据中台 (Data Platform): 统一数据标准、标签字典、内容治理、媒资资产。
3. 管理系统 (Operations Admin): 面向运营/审核/客服/超级管理员的业务后台。

设计原则:

- API-first: 页面动作直接对接现有后端 Controller，避免"先做 UI 再补接口"。
- Domain-oriented: 按业务域划分菜单和权限，不按技术服务名堆菜单。
- Workflow-first: 每个核心流程定义状态机和可追踪操作。
- Modern UX: 响应式、可搜索、批量操作、可撤销、全局 Command Palette。

## 1.1 2026-04-15 UI/UX Refresh Blueprint

本轮刷新把 Admin 定义为“战略壳层 + 工作区”的双层结构，而不是单层后台页面集合。

目标体验:

1. Strategic Shell

- 左侧为持久化 domain navigation，承担“我当前处于哪个治理域”的空间定位。
- 顶部为 command/search bar，承担跨页面搜索、跳转与高频动作入口的统一认知。
- 当前工作域需要有 mission strip 或 workspace status，让运营和审核知道此刻在处理哪类问题。

1. Operational Workspace

- 主内容区按任务链路组织，不按组件种类组织。
- 首页优先展示 workflow stages、risk signals、active queues，而不是纯数字卡片墙。
- 列表型页面优先采用 list-detail / triage 模式，减少“点进详情页再返回”的无效切换。

1. Visual Direction

- 壳层采用更深的结构色，形成明显的“控制平面”气质。
- 数据工作区保持高可读浅色表面，保证表格、图表、表单、详情块的扫描效率。
- 强调色分工明确：风险/阻断使用 hazard warm tone，数据与系统信号使用冷色 data tone。

1. Shared Primitives

- 所有页面尽量通过共享的 workspace hero、section、table shell、detail grid、entity summary 样式落地。
- 新视觉不依赖单页定制背景或零散渐变，而应沉淀为全局壳层 token 与共享布局类。

1. Rollout Strategy

- 首批优先改造 `/dashboard` 和全局 shell，使所有页面先获得统一的信息架构与品牌氛围。
- 第二批扩散到 Notifications、Community、Membership、Travel Plans、App Control 等高频页面。
- 后续再把 Media / Moderation / IAM 做到统一的 queue-first 工作台模型。

当前 rollout 进度（2026-04-16）:

- `/dashboard` 已作为指挥页重构完成。
- Notifications、Community、Travel Plans、Membership、App Control 已切到共享 workspace 或 detail 语言。
- 下一阶段应从“主干页面已统一”转向“剩余高频治理页补齐 + 浏览器验收”，避免继续只做样式层迁移而没有交互验收闭环；`/users`、`/cities`、`/meetups`、`/coworking`、`/innovation` 列表页是这一阶段已经启动并基本收口的对象，分别承接用户详情治理流、城市供给详情链路、活动供给治理链路、空间供给治理链路与创新项目治理链路。
- 这意味着 shell/dashboard 的映射工作已经从“单点改造”进入“批量一致性”阶段；随着 `/operations` 与 `/moderation/reports` 完成共享 workspace 语义对齐，下一步更值得做的是浏览器验收，而不是继续只扩展同类列表页。

---

## 2. 从 go-nomads-app 提炼的业务模块

来源: `go-nomads-app/lib/features`, `go-nomads-app/lib/routes/app_routes.dart`

移动端模块可抽象为 9 个业务域:

1. 城市与地理: `city`, `city_list`, `location`, `weather`, `favorites`。
2. 用户生成内容 UGC: 城市照片/费用/评论/优缺点。
3. 空间与住宿: `coworking`, `hotel`。
4. 活动与社群: `meetup`, `community`, 邀请与参与。
5. 聊天与通知: `chat`, `notification`。
6. 用户与身份: `auth`, `user_profile`, `user_management`。
7. 会员与支付: `membership`, `payment`。
8. AI 与行程: `ai`, `travel_plan`, `async_task`, `travel_history`。
9. 版主治理: `moderator`, `user_city_content`。

这决定了 Admin 不应只是"内容管理"，而是必须覆盖审核、运营、系统治理、数据治理四类角色场景。

---

## 3. 与 go-nomads-backend 的能力映射

来源: `go-nomads-backend/src/Services/**/Controllers/*.cs`, `.../API/Controllers/*.cs`

### 3.1 核心服务与已存在 API 能力

1. CityService:
- `CitiesController`: 城市列表/搜索/推荐/统计/版主分配/生成图片/附近城市。
- `UserCityContentController`: 照片、费用、评论、优缺点、统计。
- `ModeratorApplicationController`: 申请、审批、统计、撤销。
- `ModeratorTransferController`: 版主移交流程。
- `CityRatingsController`: 评分、评分分类 CRUD。
- `GeographyAdminController`: 地理种子数据导入。

2. UserService:
- `UsersController`: 用户列表、搜索、候选版主、用户详情/批量。
- `RolesController`: 角色 CRUD 与角色用户。
- `ReportController`: 举报创建、详情、我的举报。
- `MembershipController`, `PaymentController`, `UserStatsController`, `InterestsController`, `SkillsController`。

3. CoworkingService:
- `CoworkingController`: 空间 CRUD、搜索、验证资格、提交验证、验证状态、预订、评论。
- `CoworkingReviewController`: 评论 CRUD。

4. AccommodationService:
- `HotelController`, `HotelReviewController`。

5. EventService:
- `EventsController`: 活动 CRUD、取消、加入/退出、关注、邀请、参与者等。
- `EventTypesController`: 活动类型管理。

6. MessageService:
- `NotificationsController`: 通知创建、批量、管理员通知、城市版主通知、已读、删除。
- `ChatsController`, `TencentIMController`。

7. AIService:
- `ChatController`: 会话、消息、流式、旅行计划、异步任务、图像生成。

8. CacheService / SearchService / ProductService:
- 提供缓存、检索、产品管理支撑能力。

9. DocumentService:
- 当前主要是 API 文档聚合 Hub，不是完整媒资中心。
- 媒资上传目前更多在 App 侧走 Supabase Storage (`SupabaseConfig`, `ImageUploadHelper`)。

### 3.2 结论

- Admin 一期可大量复用现有 API。
- 媒资治理能力需在 Admin 侧补齐 (索引、审核、生命周期、引用关系)，后续建议后端补 MediaService 或扩展 DocumentService。

---

## 4. 信息架构 (IA): 数据中心 + 数据中台 + 管理系统

## 4.1 一级导航

1. 总览 Dashboard
2. 数据中心 Data Center
3. 数据中台 Data Platform
4. 业务管理 Operations
5. 内容与审核 Moderation
6. 媒资中心 Media Center
7. 用户与权限 IAM
8. 系统与可观测性 System

## 4.2 二级导航与页面

### A. Dashboard

1. 全局运营看板
- KPI: DAU/MAU、内容提交量、审核 SLA、举报处理时长、活跃城市数。
- 交互: 时间粒度切换 (24h/7d/30d)、按城市过滤、按业务域过滤。

2. 风险雷达
- 待处理举报、高风险内容、异常用户行为、服务告警。

### B. 数据中心 (Data Center)

1. 指标中心
- 用户增长、留存、会员转化、活动参与率、城市热度。

2. 主题分析
- 城市画像、空间质量画像、内容质量画像、版主绩效画像。

3. 报表中心
- 固定报表 + 自定义报表。
- 导出: CSV/XLSX，支持计划任务和订阅推送。

4. 审计与追溯
- 操作日志、审批日志、字段级变更 Diff。

### C. 数据中台 (Data Platform)

1. 主数据管理 MDM
- 城市主数据、国家/地区、活动类型、费用分类、评分分类。

2. 字典与标签
- 技能、兴趣、标签体系，版本化管理，支持灰度发布。

3. 数据质量
- 重复城市、脏数据、缺失值、异常值任务看板。

4. 规则引擎
- 审核规则、评分规则、自动分发规则。

### D. 业务管理 (Operations)

1. 城市管理
- 列表、详情、统计、推荐权重、版主管理。

2. 空间管理
- Coworking 与 Hotel 双域管理。
- 审核状态、认证状态、评论质量、投诉率。

3. 活动管理
- 活动生命周期、取消率、参与转化、邀请管理。

4. 会员与支付
- 会员套餐、价格策略、权益配置、支付对账。

5. AI 任务管理
- 会话、任务、失败重试、token 消耗、模型成本。

### E. 内容与审核 (Moderation)

1. 举报中心
- 队列: 待处理/处理中/已结案。
- 动作: 驳回、警告、下架、封禁、升级人工复审。

2. UGC 审核中心
- 城市照片、评论、费用、优缺点。
- 支持批量通过/拒绝、原因模板、一键回溯原帖。

3. 版主治理
- 申请审核、移交流程、绩效评分、权限回收。

### F. 媒资中心 (Media Center)

1. 资源库
- 图片列表、上传者、来源业务、城市关联、引用次数、哈希。

2. 审核工作台
- AI 初审 + 人工复核。
- 风险标签: 低质图、重复图、违规图、版权风险。

3. 处理工作流
- 裁剪、压缩、格式转换、缩略图、WebP/AVIF 转码。

4. 生命周期
- 未引用资源清理、冷存储策略、删除审批、恢复回收站。

5. 资产关系图
- 图像 -> 城市/空间/活动/用户头像引用链路。

### G. 用户与权限 (IAM)

1. 用户中心
- 搜索、状态管理、会员状态、行为摘要。

2. 角色与权限
- 角色 CRUD、权限矩阵、资源级授权(按城市/模块)。

3. 组织与岗位
- 运营、审核、客服、数据分析、超级管理员角色模板。

### H. 系统与可观测性 (System)

1. 服务健康
- 各微服务可用性、延迟、错误率。

2. 消息与通知
- 系统通知模板、批量触达、触达结果追踪。

3. 搜索与缓存
- 索引状态、重建任务、缓存命中率。

---

## 5. 重点页面交互细化 (含图片管理)

## 5.1 城市照片审核页 (关键)

目标: 对 `UserCityContentController` 的照片上传能力形成完整治理闭环。

页面结构:

1. 左侧筛选:
- 城市、时间范围、上传用户、审核状态、风险分、是否重复图。

2. 中间瀑布流:
- 大图预览 + 元信息卡 (尺寸、大小、来源、hash、EXIF、上传时间)。

3. 右侧操作面板:
- 通过 / 拒绝 / 打回补充 / 下架。
- 处理原因模板。
- 相似图检索。
- 查看引用关系。

4. 批量操作:
- 批量通过、批量拒绝、批量转交。

5. 审计记录:
- 每次审核行为写入操作日志。

建议 API 对接:

- 读取: `GET /api/v1/cities/{cityId}/user-content/photos`
- 删除: `DELETE /api/v1/cities/{cityId}/user-content/photos/{photoId}`
- 补充: 增加审核状态字段接口 (建议新增)

## 5.2 举报处理工作台

来源: `ReportController`

核心流程:

1. 新举报进入队列。
2. 审核员领取 -> 调查上下文。
3. 处置: 忽略 / 警告 / 删除内容 / 封禁用户 / 升级。
4. 通知举报人及被举报人。
5. 自动沉淀到案例库。

必要功能:

- 一屏查看举报对象上下文 (用户、内容、历史违规)。
- 处置模板与处罚分级。
- 处理 SLA 倒计时。

## 5.3 版主申请审批页

来源: `ModeratorApplicationController`, `ModeratorTransferController`

细节:

- 队列视图 + 详情抽屉。
- 同城已有版主冲突提示。
- 申请历史与拒绝原因复用。
- 批准后自动推送系统通知。

## 5.4 空间验证与质量页

来源: `CoworkingController` 验证资格/提交验证/状态更新。

细节:

- 验证任务队列。
- 证据材料审阅。
- 通过后触发徽章与搜索权重调整。

---

## 6. 现代化 UI/UX 规范

## 6.1 视觉系统

1. 采用 Token 体系: color/spacing/radius/shadow/typography。
2. 信息密度分级: 默认舒适，数据重度页可切换紧凑模式。
3. 强化状态颜色一致性:
- Success: 审核通过、任务完成
- Warning: 待处理、风险提醒
- Danger: 违规、删除、封禁

## 6.2 交互模式

1. 全局 Command Palette (`Cmd/Ctrl + K`): 直达页面与动作。
2. List-Detail 布局: 左列表右详情，减少跳转。
3. 批量操作条: 选中后浮出，不打断流程。
4. 可撤销机制: 删除/封禁类操作提供短时撤销。
5. 乐观更新 + 审计回执: 操作立即反馈并保留追踪。

## 6.3 表格与数据体验

1. 表格支持: 列自定义、固定列、保存视图、导出。
2. 高级筛选: 条件组 AND/OR、快捷筛选模板。
3. 空状态设计: 提供下一步建议，而非仅"暂无数据"。

## 6.4 响应式策略

1. Desktop-first (>=1280) 为主操作区。
2. Tablet 保留关键看板与审核能力。
3. Mobile 仅保留审批与消息处理轻操作。

---

## 7. 权限模型 (RBAC + Scope)

基于 `RolesController` 扩展到资源范围授权:

1. 角色层: SuperAdmin, DataAdmin, OpsAdmin, ModeratorAdmin, Support, Analyst。
2. 资源层: city, coworking, hotel, event, media, report。
3. 范围层:
- global
- by-region
- by-city

示例:

- 城市运营经理: `city:write` + scope `cityId in [A,B,C]`
- 内容审核员: `report:handle`, `media:review` + scope `global`

---

## 8. 数据与事件流建议

1. Command API: 业务写入走各微服务。
2. Read Model: Admin 聚合查询走 BFF/Query 服务。
3. Event Bus: 审核、举报、状态变更写入事件总线，驱动通知与报表异步更新。
4. 审计仓: 所有管理动作写审计表，支持回放。

---

## 9. 一期到三期落地路线

## Phase 1 (4-6 周)

1. Dashboard + 用户/角色管理 + 举报中心 + 版主申请。
2. 城市/空间基础 CRUD。
3. 媒资中心最小版: 列表、预览、下架、引用查看。

## Phase 2 (6-8 周)

1. 数据中心报表 + 自定义筛选 + 导出。
2. 评分分类、兴趣技能字典、活动类型管理。
3. 空间验证工作台 + 质量评分。

## Phase 3 (8-10 周)

1. AI 成本与质量治理。
2. 自动化规则引擎与批量任务。
3. 完整数据中台: 质量任务、主数据版本、跨域指标血缘。

---

## 10. 当前缺口与建议补强

1. 媒资审核状态 API 缺口:
- 目前有上传/删除，建议新增 `approve/reject/archive` 相关接口与状态字段。

2. 举报后台管理 API 缺口:
- 现有 `ReportController` 以提交/查询为主，建议补 `list(filter)`, `assign`, `resolve`。

3. 审核审计标准化:
- 建议统一 `AuditLog` 模型，覆盖所有 Admin 写操作。

4. DocumentService 角色调整:
- 当前偏 API 文档聚合，建议拆分/扩展为 `MediaService` 或 `ContentGovernanceService`。

---

## 11. go-nomads-admin 前端工程落地建议

1. 路由分组:
- `/dashboard`
- `/data-center/*`
- `/data-platform/*`
- `/operations/*`
- `/moderation/*`
- `/media/*`
- `/iam/*`
- `/system/*`

2. 页面模板:
- `ListPageTemplate`, `DetailDrawerTemplate`, `ReviewWorkbenchTemplate`, `MetricsBoardTemplate`。

3. 状态管理:
- Server-first (React Server Components + 数据拉取)
- Client 仅用于筛选条件、交互状态、编辑草稿。

4. 组件规范:
- 统一 `DataTable`, `FilterBar`, `BatchActionBar`, `AuditTimeline`, `MediaViewer`。

此文档可作为 Admin 产品 PRD + 技术设计初版，在此基础上可进一步输出:

- 页面级低保真线框
- API 对接清单 (endpoint -> page action)
- RBAC 权限矩阵表
- 迭代排期与验收标准
