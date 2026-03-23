# go-nomads-app 功能分析报告

> **项目路径：** `/Users/walden/Workspaces/WaldenProjects/go-nomads-project/go-nomads-app`
> **更新时间：** 2026-03-22

---

## 一、项目概览

### 1.1 产品定位

**go-nomads（行途）** — 数字游民城市探索平台，服务于全球远程工作者/数字游民群体，帮助他们发现、评估、规划旅行目的地。

- **App 名称**：行途
- **版本**：2.0.3+21
- **技术栈**：Flutter 3.4+ / Dart / Clean Architecture
- **目标用户**：数字游民、远程工作者、旅行爱好者
- **核心价值**：城市数据 + AI 旅行规划 + 社区内容

### 1.2 架构

**Clean Architecture（四层）：**
```
presentation  → UI / Widgets / Pages
application   → Controllers / Use Cases
domain        → Entities / Repositories（接口）
infrastructure → API 调用 / 数据库 / 外部服务
```

**状态管理：** GetX

**主要依赖：**
| 类别 | 库 |
|------|-----|
| HTTP | Dio, http |
| 地图 | flutter_map + latlong2（OSM）/ 高德地图 |
| 定位 | geolocator（GPS）/ amap_service |
| 搜索 | amap_poi（高德 POI）|
| 推送 | flutter_local_notifications |
| 地图 | Tencent Cloud Chat SDK |
| 登录 | fluwx（微信）/ tencent_kit（QQ）/ google_sign_in |
| 支付 | in_app_purchase |
| 存储 | sqflite（本地）/ supabase_flutter（云端）|
| 即时通讯 | signalr_netcore |
| AI | AI Service（自建）|

---

## 二、功能模块总览

### 2.1 功能模块列表

| # | 模块 | 功能描述 | 优先级 |
|---|------|---------|--------|
| 1 | City（城市） | 城市列表、详情、搜索、评分、优缺点、照片 | ⭐⭐⭐ |
| 2 | Hotel（酒店）| 酒店列表、详情、房型、点评、预订 | ⭐⭐⭐ |
| 3 | Coworking（共享办公）| 空间列表、详情、评论、验证 | ⭐⭐⭐ |
| 4 | Meetup（活动）| 活动列表、创建、参与、聊天 | ⭐⭐⭐ |
| 5 | Innovation（创新项目）| 创业项目展示、交流 | ⭐⭐ |
| 6 | Travel Plan（旅行计划）| AI 生成旅行计划、行程管理 | ⭐⭐⭐ |
| 7 | AI Chat（AI 助手）| AI 对话、知识库检索 | ⭐⭐⭐ |
| 8 | User（用户）| 认证、个人资料、旅行历史 | ⭐⭐ |
| 9 | Chat（私信）| 用户间一对一聊天 | ⭐⭐ |
| 10 | Notification（通知）| 系统通知、点赞/评论通知 | ⭐⭐ |
| 11 | Payment（支付）| 会员订阅、应用内购买 | ⭐ |
| 12 | Community（社区）| 帖子、评论、点赞 | ⭐ |
| 13 | Country（国家）| 国家列表 | ⭐ |

---

## 三、数据模型详解

### 3.1 City（城市）— 核心模块

**文件路径：** `lib/features/city/domain/entities/`

**核心实体：**
```
City — 城市聚合根
  ├── Moderator — 版主
  ├── CityScores — 详细评分（30+ 维度）
  ├── CityReview — 用户评论
  ├── ProsCons — 优缺点
  ├── CostOfLiving — 生活成本
  ├── VisaInfo — 签证信息
  ├── DigitalNomadGuide — 数字游民指南
  ├── Neighborhood — 社区/区域
  ├── CityPhoto — 用户上传照片
  ├── CityVideo — 城市视频
  ├── TrendsData — 趋势数据
  └── Demographics — 人口统计
```

**City 核心字段：**
```dart
City {
  id, name, nameEn, country, region
  imageUrl, portraitImageUrl, landscapeImageUrls[]
  description, timezone, population, currency
  latitude, longitude
  // 天气
  temperature, feelsLike, weather, humidity, airQualityIndex
  // 评分
  overallScore, costScore, internetScore, safetyScore
  likedScore, communityScore, weatherScore
  // 统计
  meetupCount, reviewCount, coworkingCount, averageCost
  // 用户交互
  isFavorite
  // 版主
  moderatorId, moderator
  isCurrentUserModerator, isCurrentUserAdmin
}
```

**CityScores（30+ 维度评分）：**
- overall, qualityOfLife, familyScore, communityScore
- safetyScore, womenSafety, lgbtqSafety, funScore
- walkability, nightlife, friendlyToForeigners, englishSpeaking
- foodSafety, lackOfCrime, lackOfRacism, educationLevel
- powerGrid, climateVulnerability, trafficSafety
- airlineScore, lostLuggage, hospitals, happiness
- freeWiFi, placesToWork, acHeating, freedomOfSpeech, startupScore

**业务规则：**
- `isHighQuality` → overallScore >= 4.0
- `isPopular` → meetupCount > 5
- `isNomadFriendly` → 有版主 + 有 Coworking + 有 Meetup

---

### 3.2 Hotel（酒店）

**文件路径：** `lib/features/hotel/domain/entities/`

**实体：**
```
Hotel — 酒店聚合根
  ├── RoomType — 房型
  └── HotelBooking — 预订记录
  └── HotelReview — 酒店点评
```

**Hotel 核心字段：**
```dart
Hotel {
  id, source（community/booking）, externalStatus
  name, cityId, cityName, country, address
  latitude, longitude
  rating, reviewCount
  description, amenities[], images[]
  category（luxury/budget/hostel）
  starRating, pricePerNight, currency
  isFeatured
  roomTypes[]
  // 数字游民特性
  wifiSpeed, hasWifi, hasWorkDesk, hasCoworkingSpace
  hasAirConditioning, hasKitchen, hasLaundry
  hasParking, hasPool, hasGym, has24HReception
  hasLongStayDiscount, isPetFriendly
  // 联系
  phone, email, website
  // 状态
  createdAt, createdBy, updatedAt
}
```

**RoomType 核心字段：**
```dart
RoomType {
  id, hotelId, name, description
  maxOccupancy, size, bedType
  pricePerNight, currency
  availableRooms, amenities[], images[]
  isAvailable, createdAt
}
```

**业务规则：**
- `isNomadFriendly` → hasWifi && (hasWorkDesk || hasCoworkingSpace)
- `hasGoodWifi` → hasWifi && wifiSpeed >= 50
- `sourceLabel` → Booking.com / Community

---

### 3.3 Coworking（共享办公）

**文件路径：** `lib/features/coworking/domain/entities/`

**实体：**
```
CoworkingSpace — 共享办公空间
  ├── CoworkingReview — 用户评论
  └── CoworkingComment — 评论回复
```

**CoworkingSpace 核心字段：**
```dart
CoworkingSpace {
  id, name, cityId, cityName
  address, latitude, longitude
  description, amenities[], images[]
  rating, reviewCount
  pricePerHour, pricePerDay, pricePerMonth
  wifiSpeed, hasStandingDesk, hasMeetingRoom
  hasPhoneBooth, hasKitchen, hasShower
  openHours, openDays
  contactPhone, contactEmail, website
  isVerified, isFeatured
  createdAt, createdBy, updatedAt
}
```

**VerificationEligibility（验证资格）：**
```dart
VerificationEligibility {
  eligible: bool
  userOwnedSpacesCount: int
  reasons[]: string
  nextEligibleDate?: DateTime
}
```

---

### 3.4 Meetup（活动）

**文件路径：** `lib/features/meetup/domain/entities/`

**实体：**
```
Meetup — 活动聚合根
  ├── EventType — 事件类型
  ├── EventInvitation — 邀请
  └── EventParticipant — 参与者
  └── EventFollower — 关注者
```

**Meetup 核心字段：**
```dart
Meetup {
  id, title, description
  location { cityId, cityName, address, latitude, longitude }
  venue { name, address, latitude, longitude, distanceFromVenue }
  schedule { startTime, endTime, timeZone }
  capacity { maxAttendees, currentAttendees, isFree, price }
  organizer { userId, name, avatar }
  images[], attendeeIds[]
  status（upcoming/ongoing/completed/cancelled）
  createdAt
  // 用户状态
  isJoined, isOrganizer
}
```

**EventType 核心字段：**
```dart
EventType {
  id, name, nameEn, icon
  color, description
  eventCount（该类型活动总数）
}
```

**业务规则：**
- `canJoin` → 未结束 + 未满员 + 非组织者 + 未加入
- `canLeave` → 非组织者 + 已加入 + 未结束
- `canEdit` → 组织者 + 未结束
- `isStartingSoon` → 24小时内
- `isOngoing` → 当前时间在开始和结束之间

---

### 3.5 Innovation（创新项目）

**文件路径：** `lib/features/innovation_project/domain/entities/`

```dart
InnovationProject {
  id, title, description
  userId, userName, userAvatar
  cityId, cityName, country
  stage, industry, teamSize
  website, demoUrl, pitchDeckUrl
  coverImage, images[]
  lookingFor[], hasReceivedFunding
  fundingAmount, createdAt
  updatedAt
}
```

---

### 3.6 Travel Plan（旅行计划）

**文件路径：** `lib/features/travel_plan/domain/entities/`

**实体：**
```
TravelPlan — AI 生成的完整旅行计划
  ├── Destination — 目的地
  ├── PlanMetadata — 计划元数据
  ├── TripTransportation — 交通计划
  ├── TripAccommodation — 住宿计划
  ├── DailyItinerary[] — 每日行程
  ├── AttractionRecommendation[] — 景点推荐
  ├── RestaurantRecommendation[] — 餐厅推荐
  └── TripBudget — 预算
```

**TravelPlan 核心字段：**
```dart
TravelPlan {
  id
  destination { cityId, cityName, cityImage }
  metadata {
    createdAt, duration, budgetLevel, style, interests[]
  }
  transportation {
    arrival { method, details, estimatedCost }
    localTransport { method, details, dailyCost }
  }
  accommodation {
    type, recommendation, recommendedArea, pricePerNight, amenities[]
  }
  dailyItineraries[] {
    day, theme, activities[], notes
  }
  attractions[] {
    name, description, category, rating, location, entryFee, bestTime
  }
  restaurants[] {
    name, cuisine, rating, priceRange, location, specialty
  }
  tips[]
  budget { transportation, accommodation, food, activities, miscellaneous, currency }
  status（planning/confirmed/completed/cancelled）
  departureLocation, departureDate
}
```

**业务规则：**
- `completeness` → 0-100 分的综合完成度评分
- `canEdit` → planning 或 confirmed 状态
- `canCancel` → planning 或 confirmed 状态

---

### 3.7 AI Chat（AI 助手）

**文件路径：** `lib/features/ai/`

**功能：**
- AI 对话聊天
- 城市知识检索
- 旅行建议
- 接入 AIService 后端

---

### 3.8 User & Auth（用户认证）

**文件路径：** `lib/features/auth/`, `lib/features/user/`

**登录方式：**
- 微信登录（fluwx）
- QQ 登录（tencent_kit）
- Google 登录（google_sign_in）
- Apple 登录（sign_in_with_apple）
- 邮箱注册/登录

**User 核心字段：**
```dart
User {
  id, email, name, avatar
  phone, bio
  homeCityId, homeCityName
  role（user/moderator/admin）
  membership { type, expiresAt }
  travelStats { countries, cities, trips }
  createdAt, lastActiveAt
}
```

---

### 3.9 Chat（私信）

**文件路径：** `lib/features/chat/`

**实体：**
```dart
ChatConversation {
  id, participants[], lastMessage
  unreadCount, updatedAt
}

ChatMessage {
  id, conversationId, senderId
  content, type（text/image/file）
  createdAt, readAt
}
```

---

### 3.10 Notification（通知）

**文件路径：** `lib/features/notification/`

**类型：**
- 系统通知
- 点赞/评论通知
- Meetup 邀请通知
- 城市更新通知

---

### 3.11 Travel History（旅行历史）

**文件路径：** `lib/features/travel_history/`

```dart
TravelHistory {
  id, userId, cityId, cityName, countryName
  startDate, endDate, stayDuration
  status（planning/on_going/completed）
  rating?, review?
}
```

---

### 3.12 其他功能

**Interest（兴趣标签）**
- 用户兴趣标签管理

**Skill（技能）**
- 用户技能管理

**Membership（会员）**
- 会员类型、订阅状态

**Legal Document（法律文档）**
- 隐私政策、服务条款

---

## 四、后端微服务架构

### 4.1 服务列表

| 服务名 | 路径 | 职责 |
|--------|------|------|
| **Gateway** | `Gateway/` | API 网关，统一入口，JWT 鉴权 |
| **UserService** | `Services/UserService/` | 用户管理、认证、会员 |
| **CityService** | `Services/CityService/` | 城市 CRUD、评分、版主管理 |
| **AccommodationService** | `Services/AccommodationService/` | 酒店、民宿、房型 |
| **CoworkingService** | `Services/CoworkingService/` | 共享办公空间、评论 |
| **EventService** | `Services/EventService/` | Meetup、活动类型、参与者 |
| **InnovationService** | `Services/InnovationService/` | 创业项目 |
| **MessageService** | `Services/MessageService/` | 即时通讯、聊天 |
| **AIService** | `Services/AIService/` | AI 对话、知识库 |
| **SearchService** | `Services/SearchService/` | 全局搜索 |
| **ProductService** | `Services/ProductService/` | 商品管理 |
| **DocumentService** | `Services/DocumentService/` | 文档/媒体管理 |
| **CacheService** | `Services/CacheService/` | 缓存服务 |
| **AppHost** | `GoNomads.AppHost/` | 应用主机，进程管理 |
| **ServiceDefaults** | `GoNomads.ServiceDefaults/` | 共享中间件、健康检查 |
| **Shared** | `Shared/` | 共享模型、中间件 |

### 4.2 技术栈

- **框架**：ASP.NET Core 9.0
- **架构**：DDD（Dapper + PostgreSQL + Dapr）
- **通信**：Dapr（服务调用、发布订阅）
- **数据库**：PostgreSQL + Supabase
- **ORM**：Dapper（微服务），Supabase（部分服务）
- **消息**：Dapr Pub/Sub（RabbitMQ）
- **缓存**：Redis / CacheService

### 4.3 服务间通信

```
App（Flutter）
    ↓ HTTP
Gateway（API 网关，JWT 鉴权）
    ↓ Dapr Service Invocation
各微服务（CityService / UserService / ...）
    ↓ Dapr Pub/Sub
MessageQueue（RabbitMQ）
```

---

## 五、API 端点总览

### 5.1 CityService API

```
GET  /api/v1/cities                      — 城市列表（分页+搜索）
GET  /api/v1/cities/{id}                 — 城市详情
GET  /api/v1/cities/{id}/scores         — 城市评分详情
GET  /api/v1/cities/{id}/reviews        — 城市评论列表
POST /api/v1/cities/{id}/reviews        — 创建评论
GET  /api/v1/cities/{id}/pros-cons      — 优缺点列表
POST /api/v1/cities/{id}/pros-cons      — 添加优缺点
GET  /api/v1/cities/{id}/photos         — 城市照片
POST /api/v1/cities/{id}/photos         — 上传城市照片
GET  /api/v1/cities/{id}/guide          — 数字游民指南
GET  /api/v1/cities/{id}/nearby         — 附近城市
GET  /api/v1/cities/{id}/weather        — 实时天气
GET  /api/v1/cities/{id}/moderator      — 版主信息
POST /api/v1/cities/{id}/favorite        — 收藏城市
DELETE /api/v1/cities/{id}/favorite      — 取消收藏

GET  /api/v1/cities/{id}/event-types    — 活动类型列表
GET  /api/v1/cities/{id}/events         — 城市活动列表

Moderator:
GET  /api/v1/moderators/applications     — 版主申请列表
POST /api/v1/moderators/apply           — 申请成为版主
POST /api/v1/moderators/transfer        — 转让版主
```

### 5.2 AccommodationService API

```
GET  /api/v1/hotels                       — 酒店列表
GET  /api/v1/hotels/{id}                 — 酒店详情
POST /api/v1/hotels                      — 创建酒店（community）
GET  /api/v1/hotels/{id}/rooms          — 房型列表
POST /api/v1/hotels/{id}/rooms           — 创建房型
GET  /api/v1/hotels/{id}/reviews         — 酒店评论
POST /api/v1/hotels/{id}/reviews         — 添加评论
```

### 5.3 CoworkingService API

```
GET  /api/v1/coworking                   — 共享办公列表
GET  /api/v1/coworking/{id}             — 共享办公详情
POST /api/v1/coworking                   — 创建共享办公
GET  /api/v1/coworking/{id}/comments    — 评论列表
POST /api/v1/coworking/{id}/comments    — 添加评论
```

### 5.4 EventService API

```
GET  /api/v1/events                       — 活动列表
GET  /api/v1/events/{id}                 — 活动详情
POST /api/v1/events                       — 创建活动
PUT  /api/v1/events/{id}                 — 更新活动
DELETE /api/v1/events/{id}               — 删除活动
POST /api/v1/events/{id}/join             — 加入活动
POST /api/v1/events/{id}/leave           — 离开活动
POST /api/v1/events/{id}/invite          — 邀请参与
GET  /api/v1/event-types                 — 事件类型列表
```

### 5.5 UserService API

```
POST /api/v1/auth/register               — 注册
POST /api/v1/auth/login                  — 登录
GET  /api/v1/users/me                    — 当前用户信息
PUT  /api/v1/users/me                    — 更新个人信息
GET  /api/v1/users/{id}                 — 用户详情
GET  /api/v1/users/{id}/travel-history  — 旅行历史
POST /api/v1/users/{id}/travel-history  — 添加旅行历史
GET  /api/v1/users/{id}/saved-items     — 收藏列表
POST /api/v1/membership/subscribe        — 订阅会员
```

### 5.6 InnovationService API

```
GET  /api/v1/innovations                 — 项目列表
GET  /api/v1/innovations/{id}           — 项目详情
POST /api/v1/innovations                 — 创建项目
PUT  /api/v1/innovations/{id}           — 更新项目
DELETE /api/v1/innovations/{id}        — 删除项目
```

### 5.7 AIService API

```
POST /api/v1/ai/chat                     — AI 对话
GET  /api/v1/ai/history                 — 对话历史
POST /api/v1/ai/travel-plan             — AI 生成旅行计划
```

### 5.8 MessageService API

```
GET  /api/v1/conversations               — 会话列表
GET  /api/v1/conversations/{id}/messages — 消息历史
POST /api/v1/conversations/{id}/messages — 发送消息
POST /api/v1/conversations              — 创建会话
```

---

## 六、数据 Workflow

### 6.1 城市发现流程

```
用户打开 App
    ↓
城市列表页（CityList）
    ↓ 筛选/搜索
CityService.GetCities() → Gateway → CityService
    ↓
城市详情页（CityDetail）
    ↓ 加载聚合数据（并行）
    ├── CityService.GetCityById()
    ├── CityService.GetCityScores()
    ├── CityService.GetWeather()
    ├── AccommodationService.GetHotelsByCity()
    ├── CoworkingService.GetCoworkingByCity()
    ├── EventService.GetEventsByCity()
    └── CityService.GetNearbyCities()
    ↓
内容展示
```

### 6.2 旅行计划生成流程

```
用户输入目的地+偏好
    ↓
AI Service 生成旅行计划
    ↓
TravelPlan 聚合保存到后端
    ↓
用户可编辑（每日行程/景点/餐厅）
    ↓
确认后跳转预订（交通+酒店）
```

### 6.3 Meetup 参与流程

```
用户浏览活动列表 → 活动详情
    ↓ 报名
EventService.JoinEvent()
    ↓
发送通知给参与者
    ↓
Meetup 开始前 24h → 提醒通知
    ↓
Meetup 进行中 → 实时位置共享（可选）
```

---

## 七、go-nomads-admin 现状分析

**项目路径：** `/Users/walden/Workspaces/WaldenProjects/go-nomads-project/go-nomads-admin`

### 7.1 已有页面

| 页面 | 路由 | 功能 |
|------|------|------|
| Dashboard | `/dashboard` | 数据概览、KPI 卡片 |
| 城市管理 | `/cities` | 城市列表、详情 |
| 共享办公 | `/coworking` | 共享办公列表、详情 |
| 活动管理 | `/meetups` | Meetup 列表、详情 |
| 创新项目 | `/innovation` | Innovation 列表、详情 |
| 用户管理 | `/users` | 用户列表 |
| 举报审核 | `/moderation/reports` | 举报内容审核 |
| 照片审核 | `/moderation/city-photos` | 用户上传照片审核 |
| 角色管理 | `/iam/roles` | RBAC 角色管理 |
| 运营 | `/operations` | 运营管理 |
| 登录 | `/login` | 管理员登录 |
| 注册 | `/register` | 管理员注册 |

### 7.2 缺失页面（根据 App 功能对比）

| # | 模块 | 缺失功能 | 优先级 | 原因 |
|---|------|---------|--------|------|
| 1 | **Hotel（酒店）** | 酒店列表/详情/创建/编辑 | ⭐⭐⭐ | App 已有 Hotel 模块 |
| 2 | **Hotel Review** | 酒店评论审核 | ⭐⭐⭐ | App 已有 HotelReview |
| 3 | **Travel Plan** | AI 旅行计划管理 | ⭐⭐⭐ | App 核心功能 |
| 4 | **Travel History** | 用户旅行历史 | ⭐⭐ | App 已有功能 |
| 5 | **AI Chat** | AI 对话管理/知识库 | ⭐⭐ | App 已接入 AIService |
| 6 | **Chat/私信** | 聊天记录管理 | ⭐⭐ | MessageService 已存在 |
| 7 | **Notification** | 通知管理/推送 | ⭐⭐ | App 已有功能 |
| 8 | **EventType** | 活动类型管理 | ⭐⭐ | EventService 已支持 |
| 9 | **City Review** | 城市评论审核 | ⭐⭐ | App 已有 CityReview |
| 10 | **ProsCons** | 优缺点审核 | ⭐ | App 已有功能 |
| 11 | **Moderator** | 版主申请审批 | ⭐⭐ | App 已有版主体系 |
| 12 | **Community** | 社区帖子管理 | ⭐ | App 有 Community 模块 |
| 13 | **Membership** | 会员订阅管理 | ⭐ | App 有会员功能 |
| 14 | **Country** | 国家数据管理 | ⭐ | App 有国家数据 |
| 15 | **Visa Info** | 签证信息管理 | ⭐ | City 子功能 |
| 16 | **Statistics/Analytics** | 高级数据分析 | ⭐⭐ | Dashboard 仅展示概览 |

---

## 八、总结

### 8.1 App 核心价值链

```
城市数据（CityService）
    ├── 城市详情 → 评分体系 → 数字游民指南
    ├── 住宿（AccommodationService）
    ├── 共享办公（CoworkingService）
    └── 活动（EventService）
    ↓
AI 旅行规划（AIService + TravelPlan）
    ↓
用户参与（UserService + MessageService）
    ↓
会员变现（PaymentService）
```

### 8.2 Admin 优先级建议

**P0（必须实现）：**
1. 酒店管理（Hotel CRUD + RoomType）
2. 酒店评论审核
3. 城市评论审核

**P1（核心功能）：**
4. AI 旅行计划管理
5. 版主申请审批
6. 活动类型管理

**P2（增强功能）：**
7. 用户旅行历史
8. 聊天记录管理
9. 通知推送管理

**P3（运营辅助）：**
10. 社区帖子管理
11. 会员订阅管理
12. 高级数据分析

---

_分析完成于 2026-03-22_
