# Go Nomads Admin API Matrix

## 0. Runtime Validation Snapshot (2026-04-08)

验证环境:

- Admin: `http://localhost:3002`
- Gateway: `http://localhost:5080/api/v1`
- 已重建服务: `user-service`, `ai-service`, `message-service`

本轮已完成真实登录 + 浏览器页面验证:

- `/dashboard`
- `/app-control`
- `/notifications`
- `/chat`
- `/ai-chat`
- `/membership`
- `/travel-plans`
- `/community`

本轮关键后端修复:

1. 移除多个 Admin Controller 上与共享用户上下文中间件重复的 `[Authorize]`，统一依赖 `_currentUser.IsAdmin()` 做管理员门禁，修复部分服务 401/authorization middleware 运行时错误。
2. Admin API 不再直接返回 Postgrest `BaseModel` 实体，改为返回 API 层 DTO，修复 `Postgrest.Attributes.PrimaryKeyAttribute` 序列化 500。

---

## 0.1 App Control 聚合依赖

Page: `/app-control`

1. 总览卡片

- `GET /api/v1/users/dashboard/overview`

1. 用户采样

- `GET /api/v1/users?page=&pageSize=`

1. 城市采样

- `GET /api/v1/cities?page=&pageSize=`

1. Meetup 采样

- `GET /api/v1/events?page=&pageSize=`

1. 社区采样

- `GET /api/v1/admin/community/posts?page=&pageSize=`

1. 通知采样

- `GET /api/v1/admin/notifications?page=&pageSize=`

1. 会员采样

- `GET /api/v1/admin/membership/plans`

1. 旅行计划采样

- `GET /api/v1/admin/travel-plans?page=&pageSize=`

1. AI 会话采样

- `GET /api/v1/admin/ai/conversations?page=&pageSize=`

验证结果:

- 上述接口已在 2026-04-08 本地通过真实管理员登录态验证，`/app-control` 页面已从降级警告恢复为正常渲染。

## 0.2 Operations / Community / AI 当前实际接口

1. 社区内容

- `GET /api/v1/admin/community/posts?page=&pageSize=&search=&type=`
- `DELETE /api/v1/admin/community/posts/{id}`

1. 通知管理

- `GET /api/v1/admin/notifications?page=&pageSize=&search=`
- `POST /api/v1/admin/notifications`
- `DELETE /api/v1/admin/notifications/{id}`

1. 聊天记录

- `GET /api/v1/admin/chats?page=&pageSize=&search=`
- `DELETE /api/v1/admin/chats/{id}`

1. AI 对话

- `GET /api/v1/admin/ai/conversations?page=&pageSize=&search=`
- `DELETE /api/v1/admin/ai/conversations/{id}`

1. 会员计划

- `GET /api/v1/admin/membership/plans`
- `POST /api/v1/admin/membership/plans`
- `PUT /api/v1/admin/membership/plans/{id}`
- `DELETE /api/v1/admin/membership/plans/{id}`

1. 旅行计划

- `GET /api/v1/admin/travel-plans?page=&pageSize=&search=&status=`
- `GET /api/v1/admin/travel-plans/{id}`
- `PUT /api/v1/admin/travel-plans/{id}/status`
- `DELETE /api/v1/admin/travel-plans/{id}`

说明:

- 以上路径与 `src/app/lib/admin-api.ts` 当前实现一致。
- `travel-plans/{id}` 明细接口已返回扁平 DTO，包含 `interests`、`departureCity`、`departureDate`、`dailyItinerary`、`attractions`、`restaurants`、`budget`、`tips`，供详情页稳定渲染。

## 0.3 P0 API Gap Matrix (2026-04-08)

目标：让 App 强相关后台页面具备“列表可读 + 单条详情 + 基本治理动作 + 关联信息可读化”。

1. Users `/users`

- Current:
  - `GET /api/v1/users`
  - `GET /api/v1/users/{id}`
- Current closure:
  - `PUT /api/v1/users/{id}`
  - `PATCH /api/v1/users/{id}/role`
- Remaining gap:
  - 用户状态、会员级别等后台专属治理字段仍缺专用接口。

1. Community `/community`

- Current:
  - `GET /api/v1/admin/community/posts`
  - `DELETE /api/v1/admin/community/posts/{id}`
- Required:
  - `GET /api/v1/admin/community/posts/{id}`
  - `PUT /api/v1/admin/community/posts/{id}/status`
- Read model requirements:
  - `authorName`
    - `authorId`
  - `cityName`
    - enough identity data to jump to `/users/{authorId}`

1. Notifications `/notifications`

- Current:
  - `GET /api/v1/admin/notifications`
  - `POST /api/v1/admin/notifications`
  - `DELETE /api/v1/admin/notifications/{id}`
- Required:
  - `GET /api/v1/admin/notifications/{id}`
  - `PUT /api/v1/admin/notifications/{id}`
- Read model requirements:
  - `scopeDisplay`
  - `recipientSummary`
    - `recipientUserName`
    - `userId`
  - `status`
  - `scheduledAt`

1. Chats `/chat`

- Current:
  - `GET /api/v1/admin/chats`
  - `DELETE /api/v1/admin/chats/{id}`
- Required:
  - `GET /api/v1/admin/chats/{id}`
- Read model requirements:
  - `participants[].userName`
  - `participants[].avatarUrl`
  - `messages[]`
  - `cityName`
  - `countryName`

1. AI Chat `/ai-chat`

- Current:
  - `GET /api/v1/admin/ai/conversations`
  - `DELETE /api/v1/admin/ai/conversations/{id}`
- Required:
  - `GET /api/v1/admin/ai/conversations/{id}`
- Read model requirements:
  - `userName`
  - `messages[]`
  - `modelName`
  - `totalTokens`
  - `intentTags` if available

1. Membership `/membership`

- Current:
  - `GET /api/v1/admin/membership/plans`
  - `POST /api/v1/admin/membership/plans`
  - `PUT /api/v1/admin/membership/plans/{id}`
  - `DELETE /api/v1/admin/membership/plans/{id}`
- Required:
  - `GET /api/v1/admin/membership/plans/{id}`
  - `GET /api/v1/admin/membership/plans/{id}/subscribers`

1. Travel Plans `/travel-plans`

- Current:
  - `GET /api/v1/admin/travel-plans`
  - `GET /api/v1/admin/travel-plans/{id}`
  - `PUT /api/v1/admin/travel-plans/{id}/status`
  - `DELETE /api/v1/admin/travel-plans/{id}`
- Closure:
  - 列表搜索和状态过滤已接通，详情页已消费真实行程内容。
- Read model requirements:
  - `userName`
    - `userId`
  - `cityName`
  - `status`
  - `completionRate`

1. Static Texts `/app-control/static-texts`

- Current:
  - `GET /api/v1/admin/static-texts`
  - `GET /api/v1/admin/static-texts/{id}`
  - `POST /api/v1/admin/static-texts`
  - `PUT /api/v1/admin/static-texts/{id}`
  - `DELETE /api/v1/admin/static-texts/{id}`
- Closure:
  - Admin 已补详情页，可查看正文、版本、最近修改人与影响说明。

1. Option Groups `/app-control/option-groups`

- Current:
  - `GET /api/v1/admin/option-groups`
  - `GET /api/v1/admin/option-groups/{id}`
  - `GET /api/v1/admin/option-groups/{id}/items`
  - groups/items CRUD already exists
- Closure:
  - Admin 已补组选项详情页，可查看分组元数据和组选项级联明细。

实施顺序:

1. 先补 detail/read-model API 与 display-name 字段。
2. 再补列表页跳详情和详情页。
3. 最后补写操作页面需要的更新接口。

## 0.4 Workflow 闭环合同（2026-04-08 第二轮）

本轮目标不是新增页面壳层，而是把已经存在的 workflow 补成“后端字段可读 + 前端详情可用 + 操作可闭环”。

1. Community `/community`

- Current:
  - `GET /api/v1/admin/community/posts?page=&pageSize=&search=&type=`
  - `GET /api/v1/admin/community/posts/{id}`
  - `PUT /api/v1/admin/community/posts/{id}/status`
  - `DELETE /api/v1/admin/community/posts/{id}`
- Gaps to close:
  - 后端需真实处理 `search` 与 `type`。
  - 列表与详情默认展示 `authorName`、`cityName`，避免回退到 ID。
  - 状态在 UI 统一映射为中文语义。

1. Notifications `/notifications`

- Current:
  - `GET /api/v1/admin/notifications?page=&pageSize=&status=`
  - `GET /api/v1/admin/notifications/{id}`
  - `POST /api/v1/admin/notifications`
  - `PUT /api/v1/admin/notifications/{id}`
  - `DELETE /api/v1/admin/notifications/{id}`
- DTO requirements:
  - `scope`
  - `scopeDisplay`
  - `recipientSummary`
  - `recipientUserName`
  - `userId`
  - `status`
  - `deliveredCount`
  - `readCount`
  - `scheduledAt`
- Gaps to close:
  - 列表与详情页群体范围显示 `recipientSummary`，定向用户显示可跳转用户身份。
  - 详情页应能编辑标题、内容、类型、元数据，并显示范围与接收人摘要。

1. Chats `/chat`

- Current:
  - `GET /api/v1/admin/chats?page=&pageSize=&search=`
  - `GET /api/v1/admin/chats/{id}`
  - `DELETE /api/v1/admin/chats/{id}`
- DTO requirements:
  - `createdByName`
  - `createdBy`
  - `members[].userName`
  - `members[].userId`
  - `messages[].userName`
  - `messages[].userId`
  - `city`
  - `country`
- Gaps to close:
  - 后端需真实处理 `search`。
  - 详情页成员和消息区域优先显示用户名，仅把 ID 作为辅助信息，并允许跳转用户详情。

1. AI Chat `/ai-chat`

- Current:
  - `GET /api/v1/admin/ai/conversations?page=&pageSize=&search=`
  - `GET /api/v1/admin/ai/conversations/{id}`
  - `DELETE /api/v1/admin/ai/conversations/{id}`
- DTO requirements:
  - `userName`
  - `userId`
  - `modelName`
  - `totalTokens`
  - `messages[]`
- Gaps to close:
  - 后端需真实处理 `search`。
  - 列表和详情页默认显示用户名与模型，不再让 `userId` 成为主要文案，但必须保留 `/users/{id}` 跳转能力。

1. Membership `/membership`

- Current:
  - `GET /api/v1/admin/membership/plans`
  - `GET /api/v1/admin/membership/plans/{id}`
  - `POST /api/v1/admin/membership/plans`
  - `PUT /api/v1/admin/membership/plans/{id}`
  - `DELETE /api/v1/admin/membership/plans/{id}`
- Required additions:
  - `GET /api/v1/admin/membership/plans/{id}/subscribers`
- Detail DTO requirements:
  - `description`
  - `level`
  - `currency`
  - `priceMonthly`
  - `priceYearly`
  - `aiUsageLimit`
  - `canUseAI`
  - `canApplyModerator`
  - `moderatorDeposit`
  - `sortOrder`
  - `updatedAt`
- Subscriber DTO requirements:
  - `userId`
  - `userName`
  - `email`
  - `startDate`
  - `expiryDate`
  - `isActive`
  - `autoRenew`
- Gaps to close:
  - 详情页不能只停留在价格摘要，需要展示权益、限制和订阅者明细。

## 1. Moderation / Reports

Page: `/moderation/reports`

1. 列表查询 (建议后端补齐)

- Suggested: `GET /api/v1/reports?status=&contentType=&page=&pageSize=`
- Current available: `GET /api/v1/reports/my`, `GET /api/v1/reports/{id}`

1. 提交举报

- `POST /api/v1/reports`
- Controller: `UserService/API/Controllers/ReportController.cs`

1. 查看详情

- `GET /api/v1/reports/{id}`

1. 处置动作 (建议新增)

- Suggested: `POST /api/v1/reports/{id}/assign`
- Suggested: `POST /api/v1/reports/{id}/resolve`
- Suggested: `POST /api/v1/reports/{id}/reject`

## 2. Moderation / City Photos

Page: `/moderation/city-photos`

1. 城市照片列表

- `GET /api/v1/cities/{cityId}/user-content/photos`
- Controller: `CityService/API/Controllers/UserCityContentController.cs`

1. 删除照片

- `DELETE /api/v1/cities/{cityId}/user-content/photos/{photoId}`

1. 批量上传 (运营反查入口可用)

- `POST /api/v1/cities/{cityId}/user-content/photos/batch`

1. 审核动作 (建议新增)

- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/{photoId}/approve`
- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/{photoId}/reject`
- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/batch-review`

## 3. IAM / Roles

Page: `/iam/roles`

1. 角色列表

- `GET /api/v1/roles`
- Controller: `UserService/API/Controllers/RolesController.cs`

1. 创建角色

- `POST /api/v1/roles`

1. 更新角色

- `PUT /api/v1/roles/{id}`

1. 删除角色

- `DELETE /api/v1/roles/{id}`

1. 角色用户

- `GET /api/v1/roles/{id}/users`

Workflow closure:

- Admin 列表页直接消费角色详情、用户数和角色成员视图。
- 新建 / 编辑 / 删除在同页 modal 完成，不再保留占位按钮。

## 3.1 Legal Documents

Page: `/legal`

1. 法律文档列表

- `GET /api/v1/admin/legal?page=&pageSize=&documentType=&language=&search=`
- Controller: `UserService/API/Controllers/AdminLegalDocumentsController.cs`

1. 法律文档详情

- `GET /api/v1/admin/legal/{id}`

1. 创建法律文档

- `POST /api/v1/admin/legal`

1. 更新法律文档

- `PUT /api/v1/admin/legal/{id}`

1. 删除法律文档

- `DELETE /api/v1/admin/legal/{id}`

Contract notes:

- 列表默认返回 `documentType`、`title`、`language`、`version`、`status`、`effectiveDate`、`updatedAt`。
- 详情返回 sections / summary / sdkList，全页可直接渲染和编辑。
- `isCurrent=true` 的更新会自动下线同 `documentType + language` 的其他 current 版本。

## 3.2 System Settings

Page: `/settings`

1. 配置项列表

- `GET /api/v1/admin/config/system-settings?page=&pageSize=&section=&search=`
- Controller: `ConfigService/API/Controllers/AdminSystemSettingsController.cs`

1. 配置项详情

- `GET /api/v1/admin/config/system-settings/{id}`

1. 创建配置项

- `POST /api/v1/admin/config/system-settings`

1. 更新配置项

- `PUT /api/v1/admin/config/system-settings/{id}`

1. 删除配置项

- `DELETE /api/v1/admin/config/system-settings/{id}`

Snapshot integration:

- `app_system_settings` 纳入 `app_config_snapshots.system_settings`，发布时一并打包。
- 已发布快照继续走现有 `/api/v1/admin/config/publish`、`/api/v1/admin/config/snapshots`、rollback workflow。

## 4. Users

Page: `/users`

1. 用户分页
- `GET /api/v1/users?page=&pageSize=`
- Controller: `UserService/API/Controllers/UsersController.cs`

2. 用户搜索
- `GET /api/v1/users/search?q=&role=&page=&pageSize=`

3. 候选版主
- `GET /api/v1/users/moderator-candidates?q=&page=&pageSize=`

4. 用户详情
- `GET /api/v1/users/{id}`

## 5. Moderator Governance

Target pages: `/moderation/moderator-applications`, `/moderation/moderator-transfers`

1. 申请队列
- `GET /api/v1/cities/moderator/applications/pending`
- Controller: `CityService/API/Controllers/ModeratorApplicationController.cs`

2. 审批动作
- `POST /api/v1/cities/moderator/handle`

3. 统计
- `GET /api/v1/cities/moderator/applications/statistics`

4. 移交管理
- Base: `api/v1/cities/moderator/transfers`
- Controller: `CityService/API/Controllers/ModeratorTransferController.cs`

## 6. Gap Summary (for backend backlog)

1. 举报后台闭环接口缺失
- 缺少 Admin 列表筛选/分配/处置接口。

2. 图片审核状态接口缺失
- 目前以上传/删除为主，缺状态机接口。

3. 审计日志统一接口缺失
- 建议增加 `/api/v1/admin/audit-logs`。

4. 媒资关系索引缺失
- 建议新增 `media-assets` 领域接口，提供引用关系与重复图查询。
