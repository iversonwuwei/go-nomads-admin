# Go Nomads Admin API Matrix

## 1. Moderation / Reports

Page: `/moderation/reports`

1. 列表查询 (建议后端补齐)
- Suggested: `GET /api/v1/reports?status=&contentType=&page=&pageSize=`
- Current available: `GET /api/v1/reports/my`, `GET /api/v1/reports/{id}`

2. 提交举报
- `POST /api/v1/reports`
- Controller: `UserService/API/Controllers/ReportController.cs`

3. 查看详情
- `GET /api/v1/reports/{id}`

4. 处置动作 (建议新增)
- Suggested: `POST /api/v1/reports/{id}/assign`
- Suggested: `POST /api/v1/reports/{id}/resolve`
- Suggested: `POST /api/v1/reports/{id}/reject`

## 2. Moderation / City Photos

Page: `/moderation/city-photos`

1. 城市照片列表
- `GET /api/v1/cities/{cityId}/user-content/photos`
- Controller: `CityService/API/Controllers/UserCityContentController.cs`

2. 删除照片
- `DELETE /api/v1/cities/{cityId}/user-content/photos/{photoId}`

3. 批量上传 (运营反查入口可用)
- `POST /api/v1/cities/{cityId}/user-content/photos/batch`

4. 审核动作 (建议新增)
- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/{photoId}/approve`
- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/{photoId}/reject`
- Suggested: `POST /api/v1/cities/{cityId}/user-content/photos/batch-review`

## 3. IAM / Roles

Page: `/iam/roles`

1. 角色列表
- `GET /api/v1/roles`
- Controller: `UserService/API/Controllers/RolesController.cs`

2. 创建角色
- `POST /api/v1/roles`

3. 更新角色
- `PUT /api/v1/roles/{id}`

4. 删除角色
- `DELETE /api/v1/roles/{id}`

5. 角色用户
- `GET /api/v1/roles/{id}/users`

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
