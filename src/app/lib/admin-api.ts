"use server";

type Dict = Record<string, unknown>;

import { resolveApiBase } from "@/app/lib/runtime-api-base";
import { cookies } from "next/headers";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
};

export type ApiResult<T> = {
  ok: boolean;
  message: string;
  data: T | null;
  status: number;
};

export type RoleDto = {
  id: string;
  name: string;
  description?: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UserDto = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
  membership?: UserMembershipSummary;
  stats?: UserTravelStatsSummary;
};

export type UserMembershipSummary = {
  levelName?: string;
  startDate?: string;
  expiryDate?: string;
  autoRenew?: boolean;
  aiUsageThisMonth?: number;
  aiUsageLimit?: number;
  isActive?: boolean;
  remainingDays?: number;
  canUseAI?: boolean;
  canApplyModerator?: boolean;
};

export type UserTravelStatsSummary = {
  countriesVisited?: number;
  citiesVisited?: number;
  totalDays?: number;
  totalTrips?: number;
};

export type Paginated<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CityPhotoDto = {
  id: string;
  userId?: string;
  cityId?: string;
  title?: string;
  imageUrl?: string;
  description?: string;
  locationNote?: string;
  moderationStatus?: "pending" | "approved" | "rejected";
  moderationReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt?: string;
};

export type ReportDto = {
  id: string;
  reporterId?: string;
  reporterName?: string;
  reporterDisplayName?: string;
  reporterSummary?: string;
  contentType?: string;
  targetId?: string;
  targetName?: string;
  targetDisplayName?: string;
  targetSummary?: string;
  reasonId?: string;
  reasonLabel?: string;
  status?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardUserMetrics = {
  totalUsers: number;
  newUsers: number;
};

export type DashboardEntityMetrics = {
  cities: number;
  coworkings: number;
  meetups: number;
  innovations: number;
};

export type DashboardOverview = {
  calculatedDate: string;
  users: DashboardUserMetrics;
  entities: DashboardEntityMetrics;
};

export type CityAdminDto = {
  id: string;
  name?: string;
  country?: string;
  region?: string;
  timezone?: string;
  averageCost?: number;
  meetupCount?: number;
  coworkingCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CoworkingAdminDto = {
  id: string;
  name?: string;
  cityId?: string;
  cityName?: string;
  address?: string;
  status?: string;
  rating?: number;
  pricePerDay?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InnovationAdminDto = {
  id: string;
  title?: string;
  category?: string;
  stage?: string;
  creatorId?: string;
  creatorName?: string;
  likeCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetupAdminDto = {
  id: string;
  title?: string;
  cityId?: string;
  cityName?: string;
  category?: string;
  status?: string;
  organizerId?: string;
  organizerName?: string;
  startTime?: string;
  endTime?: string;
  participantCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function getApiBase(): string {
  return resolveApiBase();
}

async function getAuthToken(): Promise<string | undefined> {
  // 运行在请求上下文时，优先使用当前用户登录 token。
  try {
    const store = await cookies();
    const token = store.get("admin_access_token")?.value;
    if (token) return token;
  } catch {
    // 在非请求上下文（如构建阶段）下 fallback 到环境变量。
  }

  return process.env.ADMIN_BEARER_TOKEN;
}

function asEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  const obj = (raw ?? {}) as Dict;
  const success = Boolean(obj.success ?? obj.Success);
  const message = String(obj.message ?? obj.Message ?? "");
  const data = (obj.data ?? obj.Data ?? null) as T | null;
  const errs = (obj.errors ?? obj.Errors ?? []) as unknown;
  const errors = Array.isArray(errs) ? errs.map((v) => String(v)) : [];

  return { success, message, data, errors };
}

async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const headers: HeadersInit = {};
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as unknown;
    const parsed = asEnvelope<T>(raw);

    return {
      ok: res.ok && parsed.success,
      message: parsed.message || (res.ok ? "OK" : `HTTP ${res.status}`),
      data: parsed.data,
      status: res.status,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Network error: ${String(error)}`,
      data: null,
      status: 0,
    };
  }
}

function readField<T>(obj: Dict, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (key in obj) return obj[key] as T;
  }
  return undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toStringOrJson(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return undefined;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function toPagedDicts(raw: unknown, fallbackPage = 1, fallbackPageSize = 10): Paginated<Dict> {
  const payload = (raw ?? {}) as Dict;
  const itemsRaw = (readField<unknown[]>(payload, "items", "Items") ?? []) as unknown[];
  const items = itemsRaw
    .map((x) => ((x ?? {}) as Dict))
    .filter((x) => Object.keys(x).length > 0);

  return {
    items,
    totalCount: Number(readField<number>(payload, "totalCount", "TotalCount") || 0),
    page: Number(readField<number>(payload, "page", "Page") || fallbackPage),
    pageSize: Number(readField<number>(payload, "pageSize", "PageSize") || fallbackPageSize),
  };
}

export async function fetchRoles() {
  const res = await apiGet<unknown[]>("/roles");
  const rows = Array.isArray(res.data) ? res.data : [];

  const roles: RoleDto[] = [];
  for (const x of rows) {
    const row = (x ?? {}) as Dict;
    const id = readField<string>(row, "id", "Id") || "";
    const name = readField<string>(row, "name", "Name") || "";
    if (!name) continue;

    roles.push({
      id: id || name,
      name,
      description: readField<string>(row, "description", "Description") || "",
      userCount: toNumberOrUndefined(readField(row, "userCount", "UserCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return { ...res, data: roles };
}

export async function createRole(body: { name: string; description?: string }) {
  const res = await apiPost<unknown>("/roles", body);
  if (!res.ok || !res.data) return { ...res, data: null as RoleDto | null };

  const row = (res.data ?? {}) as Dict;
  return {
    ...res,
    data: {
      id: String(readField<string | number>(row, "id", "Id") ?? ""),
      name: readField<string>(row, "name", "Name") || "",
      description: readField<string>(row, "description", "Description") || "",
      userCount: toNumberOrUndefined(readField(row, "userCount", "UserCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    } satisfies RoleDto,
  };
}

export async function updateRole(roleId: string, body: { name: string; description?: string }) {
  const res = await apiPut<unknown>(`/roles/${encodeURIComponent(roleId)}`, body);
  if (!res.ok || !res.data) return { ...res, data: null as RoleDto | null };

  const row = (res.data ?? {}) as Dict;
  return {
    ...res,
    data: {
      id: String(readField<string | number>(row, "id", "Id") ?? roleId),
      name: readField<string>(row, "name", "Name") || "",
      description: readField<string>(row, "description", "Description") || "",
      userCount: toNumberOrUndefined(readField(row, "userCount", "UserCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    } satisfies RoleDto,
  };
}

export async function deleteRole(roleId: string) {
  return apiDelete<null>(`/roles/${encodeURIComponent(roleId)}`);
}

export async function fetchRoleUsers(roleId: string) {
  const res = await apiGet<unknown[]>(`/roles/${encodeURIComponent(roleId)}/users`);
  const rows = Array.isArray(res.data) ? res.data : [];
  return {
    ...res,
    data: rows.map((row) => mapUser((row ?? {}) as Dict)).filter((user) => Boolean(user.id)),
  } satisfies ApiResult<UserDto[]>;
}

export async function fetchUsers(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const q = (params.q ?? "").trim();
  const role = (params.role ?? "").trim();

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let path = `/users?${query.toString()}`;
  if (q || role) {
    const search = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) search.set("q", q);
    if (role) search.set("role", role);
    path = `/users/search?${search.toString()}`;
  }

  const res = await apiGet<unknown>(path);
  const payload = (res.data ?? {}) as Dict;

  const itemsRaw = (readField<unknown[]>(payload, "items", "Items") ?? []) as unknown[];
  const users = itemsRaw
    .map((x) => mapUser((x ?? {}) as Dict))
    .filter((user) => Boolean(user.id));

  const paged: Paginated<UserDto> = {
    items: users,
    totalCount: Number(readField<number>(payload, "totalCount", "TotalCount") || 0),
    page: Number(readField<number>(payload, "page", "Page") || page),
    pageSize: Number(readField<number>(payload, "pageSize", "PageSize") || pageSize),
  };

  return { ...res, data: paged };
}

function mapUser(row: Dict): UserDto {
  const membership = (readField<Dict>(row, "membership", "Membership") ?? null) as Dict | null;
  const stats = (readField<Dict>(row, "stats", "Stats") ?? null) as Dict | null;

  return {
    id: String(readField<string | number>(row, "id", "Id") ?? ""),
    name: readField<string>(row, "name", "Name") || "",
    email: readField<string>(row, "email", "Email") || "",
    phone: readField<string>(row, "phone", "Phone") || "",
    role: readField<string>(row, "role", "Role") || "",
    avatarUrl: readField<string>(row, "avatarUrl", "AvatarUrl") || "",
    bio: readField<string>(row, "bio", "Bio") || "",
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    membership: membership
      ? {
          levelName: readField<string>(membership, "levelName", "LevelName"),
          startDate: readField<string>(membership, "startDate", "StartDate"),
          expiryDate: readField<string>(membership, "expiryDate", "ExpiryDate"),
          autoRenew: readField<boolean>(membership, "autoRenew", "AutoRenew"),
          aiUsageThisMonth: toNumberOrUndefined(readField(membership, "aiUsageThisMonth", "AiUsageThisMonth")),
          aiUsageLimit: toNumberOrUndefined(readField(membership, "aiUsageLimit", "AiUsageLimit")),
          isActive: readField<boolean>(membership, "isActive", "IsActive"),
          remainingDays: toNumberOrUndefined(readField(membership, "remainingDays", "RemainingDays")),
          canUseAI: readField<boolean>(membership, "canUseAI", "CanUseAI"),
          canApplyModerator: readField<boolean>(membership, "canApplyModerator", "CanApplyModerator"),
        }
      : undefined,
    stats: stats
      ? {
          countriesVisited: toNumberOrUndefined(readField(stats, "countriesVisited", "CountriesVisited")),
          citiesVisited: toNumberOrUndefined(readField(stats, "citiesVisited", "CitiesVisited")),
          totalDays: toNumberOrUndefined(readField(stats, "totalDays", "TotalDays")),
          totalTrips: toNumberOrUndefined(readField(stats, "totalTrips", "TotalTrips")),
        }
      : undefined,
  };
}

export async function fetchCityPhotos(cityId: string) {
  const safeCityId = cityId.trim();
  if (!safeCityId) {
    return {
      ok: false,
      message: "cityId is required",
      data: [] as CityPhotoDto[],
      status: 0,
    };
  }

  const res = await apiGet<unknown[]>(`/cities/${safeCityId}/user-content/photos`);
  const list = Array.isArray(res.data) ? res.data : [];

  const photos: CityPhotoDto[] = [];
  for (const x of list) {
    const row = (x ?? {}) as Dict;
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    photos.push({
      id,
      userId: String(readField<string | number>(row, "userId", "UserId") ?? ""),
      cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
      title: readField<string>(row, "title", "Title", "caption", "Caption", "placeName", "PlaceName") || "",
      imageUrl: readField<string>(row, "imageUrl", "ImageUrl") || "",
      description: readField<string>(row, "description", "Description") || "",
      locationNote: readField<string>(row, "locationNote", "LocationNote", "location", "Location", "address", "Address") || "",
      moderationStatus:
        (readField<string>(row, "moderationStatus", "ModerationStatus") as CityPhotoDto["moderationStatus"]) || "pending",
      moderationReason: readField<string>(row, "moderationReason", "ModerationReason") || "",
      reviewedAt: readField<string>(row, "reviewedAt", "ReviewedAt") || "",
      reviewedBy: String(readField<string | number>(row, "reviewedBy", "ReviewedBy") ?? ""),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    });
  }

  return { ...res, data: photos };
}

export async function fetchMyReports() {
  const res = await apiGet<unknown[]>("/reports/my");
  const list = Array.isArray(res.data) ? res.data : [];

  const reports: ReportDto[] = [];
  for (const x of list) {
    const row = (x ?? {}) as Dict;
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    reports.push({
      id,
      reporterId: String(readField<string | number>(row, "reporterId", "ReporterId") ?? ""),
      reporterName: readField<string>(row, "reporterName", "ReporterName") || "",
      reporterDisplayName: readField<string>(row, "reporterDisplayName", "ReporterDisplayName") || "",
      reporterSummary: readField<string>(row, "reporterSummary", "ReporterSummary") || "",
      contentType: readField<string>(row, "contentType", "ContentType") || "",
      targetId: readField<string>(row, "targetId", "TargetId") || "",
      targetName: readField<string>(row, "targetName", "TargetName") || "",
      targetDisplayName: readField<string>(row, "targetDisplayName", "TargetDisplayName") || "",
      targetSummary: readField<string>(row, "targetSummary", "TargetSummary") || "",
      reasonId: readField<string>(row, "reasonId", "ReasonId") || "",
      reasonLabel: readField<string>(row, "reasonLabel", "ReasonLabel") || "",
      status: readField<string>(row, "status", "Status") || "",
      adminNotes: readField<string>(row, "adminNotes", "AdminNotes") || "",
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return { ...res, data: reports };
}

export async function fetchReportById(reportId: string) {
  const safeId = reportId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "reportId is required",
      data: null as ReportDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/reports/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as ReportDto | null,
      message: res.message || "Report not found",
    };
  }

  const report: ReportDto = {
    id,
    reporterId: String(readField<string | number>(row, "reporterId", "ReporterId") ?? ""),
    reporterName: readField<string>(row, "reporterName", "ReporterName") || "",
    reporterDisplayName: readField<string>(row, "reporterDisplayName", "ReporterDisplayName") || "",
    reporterSummary: readField<string>(row, "reporterSummary", "ReporterSummary") || "",
    contentType: readField<string>(row, "contentType", "ContentType") || "",
    targetId: readField<string>(row, "targetId", "TargetId") || "",
    targetName: readField<string>(row, "targetName", "TargetName") || "",
    targetDisplayName: readField<string>(row, "targetDisplayName", "TargetDisplayName") || "",
    targetSummary: readField<string>(row, "targetSummary", "TargetSummary") || "",
    reasonId: readField<string>(row, "reasonId", "ReasonId") || "",
    reasonLabel: readField<string>(row, "reasonLabel", "ReasonLabel") || "",
    status: readField<string>(row, "status", "Status") || "",
    adminNotes: readField<string>(row, "adminNotes", "AdminNotes") || "",
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };

  return { ...res, data: report };
}

export async function fetchDashboardOverview() {
  const usersTask = apiGet<unknown>("/users/dashboard/overview");
  const citiesTask = apiGet<unknown>("/cities/list?pageNumber=1&pageSize=1");
  const coworkingsTask = apiGet<unknown>("/coworking?page=1&pageSize=1");
  const meetupsTask = apiGet<unknown>("/events?page=1&pageSize=1");
  const innovationsTask = apiGet<unknown>("/innovations?page=1&pageSize=1");

  const [usersRes, citiesRes, coworkingsRes, meetupsRes, innovationsRes] = await Promise.all([
    usersTask,
    citiesTask,
    coworkingsTask,
    meetupsTask,
    innovationsTask,
  ]);

  const usersPayload = (usersRes.data ?? {}) as Dict;
  const rawUsers = (readField<unknown>(usersPayload, "users", "Users") ?? {}) as Dict;

  const citiesPayload = (citiesRes.data ?? {}) as Dict;
  const coworkingsPayload = (coworkingsRes.data ?? {}) as Dict;
  const meetupsPayload = (meetupsRes.data ?? {}) as Dict;
  const innovationsPayload = (innovationsRes.data ?? {}) as Dict;

  const cities = Number(readField<number>(citiesPayload, "totalCount", "TotalCount") ?? 0);
  const coworkings = Number(readField<number>(coworkingsPayload, "totalCount", "TotalCount") ?? 0);
  const meetups = Number(readField<number>(meetupsPayload, "totalCount", "TotalCount") ?? 0);
  const innovations = Number(readField<number>(innovationsPayload, "totalCount", "TotalCount") ?? 0);

  const ok = usersRes.ok && citiesRes.ok && coworkingsRes.ok && meetupsRes.ok && innovationsRes.ok;
  const message = ok
    ? usersRes.message
    : `users:${usersRes.status} cities:${citiesRes.status} coworkings:${coworkingsRes.status} meetups:${meetupsRes.status} innovations:${innovationsRes.status}`;

  return {
    ok,
    status: ok ? usersRes.status : 207,
    message,
    data: {
      calculatedDate: String(readField<string>(usersPayload, "calculatedDate", "CalculatedDate") ?? "-"),
      users: {
        totalUsers: Number(readField<number>(rawUsers, "totalUsers", "TotalUsers") ?? 0),
        newUsers: Number(readField<number>(rawUsers, "newUsers", "NewUsers") ?? 0),
      },
      entities: {
        cities,
        coworkings,
        meetups,
        innovations,
      },
    } satisfies DashboardOverview,
  };
}

export async function fetchUserById(userId: string) {
  const safeId = userId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "userId is required",
      data: null as UserDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/users/${encodeURIComponent(safeId)}`);
  const user = mapUser((res.data ?? {}) as Dict);
  const id = user.id;

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as UserDto | null,
      message: res.message || "User not found",
    };
  }

  return { ...res, data: user };
}

export async function updateUser(
  userId: string,
  body: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
  },
): Promise<ApiResult<UserDto | null>> {
  const res = await apiPut<unknown>(`/users/${encodeURIComponent(userId)}`, body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapUser((res.data ?? {}) as Dict) };
}

export async function changeUserRole(userId: string, roleId: string): Promise<ApiResult<UserDto | null>> {
  const res = await apiPatch<unknown>(`/users/${encodeURIComponent(userId)}/role`, { roleId });
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapUser((res.data ?? {}) as Dict) };
}

export async function fetchCities(params: { page?: number; pageSize?: number; search?: string }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const search = (params.search ?? "").trim();

  const query = new URLSearchParams({ pageNumber: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);

  const res = await apiGet<unknown>(`/cities/list?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: CityAdminDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    rows.push({
      id,
      name: readField<string>(row, "name", "Name", "cityName", "CityName", "nameEn", "NameEn") || "",
      country: readField<string>(row, "country", "Country", "countryName", "CountryName") || "",
      region: readField<string>(row, "region", "Region") || "",
      timezone: readField<string>(row, "timezone", "Timezone", "timeZone", "TimeZone") || "",
      averageCost: toNumberOrUndefined(readField<unknown>(row, "averageCost", "AverageCost", "costOfLiving", "CostOfLiving")),
      meetupCount: toNumberOrUndefined(readField<unknown>(row, "meetupCount", "MeetupCount")),
      coworkingCount: toNumberOrUndefined(readField<unknown>(row, "coworkingCount", "CoworkingCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return {
    ...res,
    data: {
      items: rows,
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    } satisfies Paginated<CityAdminDto>,
  };
}

export async function fetchCityById(cityId: string) {
  const safeId = cityId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "cityId is required",
      data: null as CityAdminDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/cities/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as CityAdminDto | null,
      message: res.message || "City not found",
    };
  }

  const city: CityAdminDto = {
    id,
    name: readField<string>(row, "name", "Name", "cityName", "CityName", "nameEn", "NameEn") || "",
    country: readField<string>(row, "country", "Country", "countryName", "CountryName") || "",
    region: readField<string>(row, "region", "Region") || "",
    timezone: readField<string>(row, "timezone", "Timezone", "timeZone", "TimeZone") || "",
    averageCost: toNumberOrUndefined(readField<unknown>(row, "averageCost", "AverageCost", "costOfLiving", "CostOfLiving")),
    meetupCount: toNumberOrUndefined(readField<unknown>(row, "meetupCount", "MeetupCount")),
    coworkingCount: toNumberOrUndefined(readField<unknown>(row, "coworkingCount", "CoworkingCount")),
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };

  return { ...res, data: city };
}

export async function fetchCoworkings(params: { page?: number; pageSize?: number; cityId?: string }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const cityId = (params.cityId ?? "").trim();

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (cityId) query.set("cityId", cityId);

  const res = await apiGet<unknown>(`/coworking?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: CoworkingAdminDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    rows.push({
      id,
      name: readField<string>(row, "name", "Name", "title", "Title") || "",
      cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
      cityName: readField<string>(row, "cityName", "CityName") || "",
      address: readField<string>(row, "address", "Address", "location", "Location") || "",
      status: readField<string>(row, "status", "Status") || "",
      rating: toNumberOrUndefined(readField<unknown>(row, "rating", "Rating", "averageRating", "AverageRating")),
      pricePerDay: toNumberOrUndefined(readField<unknown>(row, "pricePerDay", "PricePerDay", "dailyPrice", "DailyPrice")),
      createdBy: String(readField<string | number>(row, "createdBy", "CreatedBy", "ownerId", "OwnerId") ?? ""),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return {
    ...res,
    data: {
      items: rows,
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    } satisfies Paginated<CoworkingAdminDto>,
  };
}

export async function fetchCoworkingById(coworkingId: string) {
  const safeId = coworkingId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "coworkingId is required",
      data: null as CoworkingAdminDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/coworking/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as CoworkingAdminDto | null,
      message: res.message || "Coworking not found",
    };
  }

  const item: CoworkingAdminDto = {
    id,
    name: readField<string>(row, "name", "Name", "title", "Title") || "",
    cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
    cityName: readField<string>(row, "cityName", "CityName") || "",
    address: readField<string>(row, "address", "Address", "location", "Location") || "",
    status: readField<string>(row, "status", "Status") || "",
    rating: toNumberOrUndefined(readField<unknown>(row, "rating", "Rating", "averageRating", "AverageRating")),
    pricePerDay: toNumberOrUndefined(readField<unknown>(row, "pricePerDay", "PricePerDay", "dailyPrice", "DailyPrice")),
    createdBy: String(readField<string | number>(row, "createdBy", "CreatedBy", "ownerId", "OwnerId") ?? ""),
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };

  return { ...res, data: item };
}

export async function fetchInnovations(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  stage?: string;
  search?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const category = (params.category ?? "").trim();
  const stage = (params.stage ?? "").trim();
  const search = (params.search ?? "").trim();

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (category) query.set("category", category);
  if (stage) query.set("stage", stage);
  if (search) query.set("search", search);

  const res = await apiGet<unknown>(`/innovations?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: InnovationAdminDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    rows.push({
      id,
      title: readField<string>(row, "title", "Title", "name", "Name") || "",
      category: readField<string>(row, "category", "Category") || "",
      stage: readField<string>(row, "stage", "Stage") || "",
      creatorId: String(readField<string | number>(row, "creatorId", "CreatorId", "userId", "UserId") ?? ""),
      creatorName: readField<string>(row, "creatorName", "CreatorName", "authorName", "AuthorName") || "",
      likeCount: toNumberOrUndefined(readField<unknown>(row, "likeCount", "LikeCount")),
      viewCount: toNumberOrUndefined(readField<unknown>(row, "viewCount", "ViewCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return {
    ...res,
    data: {
      items: rows,
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    } satisfies Paginated<InnovationAdminDto>,
  };
}

export async function fetchInnovationById(innovationId: string) {
  const safeId = innovationId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "innovationId is required",
      data: null as InnovationAdminDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/innovations/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as InnovationAdminDto | null,
      message: res.message || "Innovation not found",
    };
  }

  const item: InnovationAdminDto = {
    id,
    title: readField<string>(row, "title", "Title", "name", "Name") || "",
    category: readField<string>(row, "category", "Category") || "",
    stage: readField<string>(row, "stage", "Stage") || "",
    creatorId: String(readField<string | number>(row, "creatorId", "CreatorId", "userId", "UserId") ?? ""),
    creatorName: readField<string>(row, "creatorName", "CreatorName", "authorName", "AuthorName") || "",
    likeCount: toNumberOrUndefined(readField<unknown>(row, "likeCount", "LikeCount")),
    viewCount: toNumberOrUndefined(readField<unknown>(row, "viewCount", "ViewCount")),
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };

  return { ...res, data: item };
}

export async function fetchMeetups(params: {
  page?: number;
  pageSize?: number;
  cityId?: string;
  category?: string;
  status?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const cityId = (params.cityId ?? "").trim();
  const category = (params.category ?? "").trim();
  const status = (params.status ?? "").trim();

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (cityId) query.set("cityId", cityId);
  if (category) query.set("category", category);
  if (status) query.set("status", status);

  const res = await apiGet<unknown>(`/events?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: MeetupAdminDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;

    rows.push({
      id,
      title: readField<string>(row, "title", "Title", "name", "Name") || "",
      cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
      cityName: readField<string>(row, "cityName", "CityName") || "",
      category: readField<string>(row, "category", "Category") || "",
      status: readField<string>(row, "status", "Status") || "",
      organizerId: String(readField<string | number>(row, "organizerId", "OrganizerId", "hostId", "HostId") ?? ""),
      organizerName: readField<string>(row, "organizerName", "OrganizerName", "hostName", "HostName") || "",
      startTime: readField<string>(row, "startTime", "StartTime", "startAt", "StartAt") || "",
      endTime: readField<string>(row, "endTime", "EndTime", "endAt", "EndAt") || "",
      participantCount: toNumberOrUndefined(readField<unknown>(row, "participantCount", "ParticipantCount", "attendeeCount", "AttendeeCount")),
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
    });
  }

  return {
    ...res,
    data: {
      items: rows,
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    } satisfies Paginated<MeetupAdminDto>,
  };
}

export async function fetchMeetupById(meetupId: string) {
  const safeId = meetupId.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "meetupId is required",
      data: null as MeetupAdminDto | null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/events/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as MeetupAdminDto | null,
      message: res.message || "Meetup not found",
    };
  }

  const item: MeetupAdminDto = {
    id,
    title: readField<string>(row, "title", "Title", "name", "Name") || "",
    cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
    cityName: readField<string>(row, "cityName", "CityName") || "",
    category: readField<string>(row, "category", "Category") || "",
    status: readField<string>(row, "status", "Status") || "",
    organizerId: String(readField<string | number>(row, "organizerId", "OrganizerId", "hostId", "HostId") ?? ""),
    organizerName: readField<string>(row, "organizerName", "OrganizerName", "hostName", "HostName") || "",
    startTime: readField<string>(row, "startTime", "StartTime", "startAt", "StartAt") || "",
    endTime: readField<string>(row, "endTime", "EndTime", "endAt", "EndAt") || "",
    participantCount: toNumberOrUndefined(readField<unknown>(row, "participantCount", "ParticipantCount", "attendeeCount", "AttendeeCount")),
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };

  return { ...res, data: item };
}

// ─── HTTP helpers for POST / PUT / DELETE ──────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as unknown;
    const parsed = asEnvelope<T>(raw);
    return {
      ok: res.ok && parsed.success,
      message: parsed.message || (res.ok ? "OK" : `HTTP ${res.status}`),
      data: parsed.data,
      status: res.status,
    };
  } catch (error) {
    return { ok: false, message: `Network error: ${String(error)}`, data: null, status: 0 };
  }
}

async function apiPut<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as unknown;
    const parsed = asEnvelope<T>(raw);
    return {
      ok: res.ok && parsed.success,
      message: parsed.message || (res.ok ? "OK" : `HTTP ${res.status}`),
      data: parsed.data,
      status: res.status,
    };
  } catch (error) {
    return { ok: false, message: `Network error: ${String(error)}`, data: null, status: 0 };
  }
}

async function apiPatch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as unknown;
    const parsed = asEnvelope<T>(raw);
    return {
      ok: res.ok && parsed.success,
      message: parsed.message || (res.ok ? "OK" : `HTTP ${res.status}`),
      data: parsed.data,
      status: res.status,
    };
  } catch (error) {
    return { ok: false, message: `Network error: ${String(error)}`, data: null, status: 0 };
  }
}

async function apiDelete<T>(path: string): Promise<ApiResult<T>> {
  const headers: HeadersInit = {};
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });
    const raw = (await res.json().catch(() => null)) as unknown;
    const parsed = asEnvelope<T>(raw);
    return {
      ok: res.ok && parsed.success,
      message: parsed.message || (res.ok ? "OK" : `HTTP ${res.status}`),
      data: parsed.data,
      status: res.status,
    };
  } catch (error) {
    return { ok: false, message: `Network error: ${String(error)}`, data: null, status: 0 };
  }
}

// ─── Hotel types ────────────────────────────────────────────────────────────

export type HotelAdminDto = {
  id: string;
  name: string;
  address?: string;
  cityId?: string;
  cityName?: string;
  country?: string;
  category?: string;
  source?: string;
  rating?: number;
  reviewCount?: number;
  pricePerNight?: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  wifiSpeed?: number;
  hasWifi?: boolean;
  hasWorkDesk?: boolean;
  hasCoworkingSpace?: boolean;
  hasAirConditioning?: boolean;
  hasKitchen?: boolean;
  hasLaundry?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  has24HReception?: boolean;
  hasLongStayDiscount?: boolean;
  isPetFriendly?: boolean;
  status?: string;
  nomadScore?: number;
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type RoomTypeDto = {
  id: string;
  hotelId?: string;
  name?: string;
  description?: string;
  bedType?: string;
  maxOccupancy?: number;
  size?: number;
  pricePerNight?: number;
  currency?: string;
  availableRooms?: number;
  isAvailable?: boolean;
  amenities?: string[];
  createdAt?: string;
};

export type HotelReviewDto = {
  id: string;
  hotelId?: string;
  hotelName?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  rating?: number;
  title?: string;
  content?: string;
  photoUrls?: string[];
  isVerified?: boolean;
  helpfulCount?: number;
  visitDate?: string;
  status?: string;
  createdAt?: string;
};

export type CityReviewDto = {
  id: string;
  cityId?: string;
  cityName?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  overallScore?: number;
  title?: string;
  content?: string;
  travelType?: string;
  stayDuration?: string;
  helpfulCount?: number;
  status?: string;
  createdAt?: string;
};

export type EventTypeDto = {
  id: string;
  name?: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  description?: string;
  eventCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Hotel API functions ────────────────────────────────────────────────────

export async function createHotel(data: {
  name: string;
  address?: string;
  cityId?: string;
  category?: string;
  source?: string;
  pricePerNight?: number;
  currency?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  hasWifi?: boolean;
  wifiSpeed?: number;
  hasWorkDesk?: boolean;
  hasCoworkingSpace?: boolean;
  hasAirConditioning?: boolean;
  hasKitchen?: boolean;
  hasLaundry?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  has24HReception?: boolean;
  hasLongStayDiscount?: boolean;
  isPetFriendly?: boolean;
}): Promise<ApiResult<HotelAdminDto>> {
  return apiPost<HotelAdminDto>(`/hotels`, data);
}

export async function fetchHotels(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  cityId?: string;
  category?: string;
  source?: string;
  status?: string;
  hasWifi?: boolean;
}): Promise<ApiResult<Paginated<HotelAdminDto>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const query = new URLSearchParams({
    pageNumber: String(page),
    pageSize: String(pageSize),
  });
  if (params.search) query.set("search", params.search);
  if (params.cityId) query.set("cityId", params.cityId);
  if (params.category) query.set("category", params.category);
  if (params.source) query.set("source", params.source);
  if (params.status) query.set("status", params.status);
  if (params.hasWifi !== undefined) query.set("hasWifi", String(params.hasWifi));

  const res = await apiGet<unknown>(`/hotels?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: HotelAdminDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;
    rows.push({
      id,
      name: readField<string>(row, "name", "Name", "hotelName", "HotelName") || "",
      address: readField<string>(row, "address", "Address"),
      cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
      cityName: readField<string>(row, "cityName", "CityName"),
      country: readField<string>(row, "country", "Country"),
      category: readField<string>(row, "category", "Category", "hotelCategory", "HotelCategory"),
      source: readField<string>(row, "source", "Source"),
      rating: toNumberOrUndefined(readField<unknown>(row, "rating", "Rating", "avgRating", "AvgRating")),
      reviewCount: toNumberOrUndefined(readField<unknown>(row, "reviewCount", "ReviewCount", "review_count")),
      pricePerNight: toNumberOrUndefined(readField<unknown>(row, "pricePerNight", "PricePerNight", "price_per_night", "price")),
      currency: readField<string>(row, "currency", "Currency"),
      description: readField<string>(row, "description", "Description"),
      imageUrl: readField<string>(row, "imageUrl", "ImageUrl", "image_url", "thumbnail"),
      wifiSpeed: toNumberOrUndefined(readField<unknown>(row, "wifiSpeed", "WifiSpeed", "wifi_speed")),
      hasWifi: Boolean(readField<unknown>(row, "hasWifi", "HasWifi", "has_wifi")),
      hasWorkDesk: Boolean(readField<unknown>(row, "hasWorkDesk", "HasWorkDesk")),
      hasCoworkingSpace: Boolean(readField<unknown>(row, "hasCoworkingSpace", "HasCoworkingSpace")),
      hasAirConditioning: Boolean(readField<unknown>(row, "hasAirConditioning", "HasAirConditioning")),
      hasKitchen: Boolean(readField<unknown>(row, "hasKitchen", "HasKitchen")),
      hasLaundry: Boolean(readField<unknown>(row, "hasLaundry", "HasLaundry")),
      hasParking: Boolean(readField<unknown>(row, "hasParking", "HasParking")),
      hasPool: Boolean(readField<unknown>(row, "hasPool", "HasPool")),
      hasGym: Boolean(readField<unknown>(row, "hasGym", "HasGym")),
      has24HReception: Boolean(readField<unknown>(row, "has24HReception", "Has24HReception", "has_24h_reception")),
      hasLongStayDiscount: Boolean(readField<unknown>(row, "hasLongStayDiscount", "HasLongStayDiscount")),
      isPetFriendly: Boolean(readField<unknown>(row, "isPetFriendly", "IsPetFriendly")),
      status: readField<string>(row, "status", "Status"),
      nomadScore: toNumberOrUndefined(readField<unknown>(row, "nomadScore", "NomadScore")),
      phone: readField<string>(row, "phone", "Phone"),
      email: readField<string>(row, "email", "Email"),
      website: readField<string>(row, "website", "Website"),
      images: (readField<unknown[]>(row, "images", "Images") ?? []) as string[],
      createdAt: readField<string>(row, "createdAt", "CreatedAt"),
      updatedAt: readField<string>(row, "updatedAt", "UpdatedAt"),
    });
  }

  return { ...res, data: { items: rows, totalCount: paged.totalCount, page: paged.page, pageSize: paged.pageSize } };
}

export async function fetchHotelById(id: string): Promise<ApiResult<HotelAdminDto | null>> {
  const safeId = id.trim();
  if (!safeId) return { ok: false, message: "id required", data: null, status: 0 };
  const res = await apiGet<unknown>(`/hotels/${encodeURIComponent(safeId)}`);
  const row = (res.data ?? {}) as Dict;
  const hotelId = String(readField<string | number>(row, "id", "Id") ?? "");
  if (!hotelId) return { ...res, ok: false, data: null, message: res.message || "Hotel not found" };

  const hotel: HotelAdminDto = {
    id: hotelId,
    name: readField<string>(row, "name", "Name", "hotelName", "HotelName") || "",
    address: readField<string>(row, "address", "Address"),
    cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
    cityName: readField<string>(row, "cityName", "CityName"),
    country: readField<string>(row, "country", "Country"),
    category: readField<string>(row, "category", "Category"),
    source: readField<string>(row, "source", "Source"),
    rating: toNumberOrUndefined(readField<unknown>(row, "rating", "Rating")),
    reviewCount: toNumberOrUndefined(readField<unknown>(row, "reviewCount", "ReviewCount")),
    pricePerNight: toNumberOrUndefined(readField<unknown>(row, "pricePerNight", "PricePerNight")),
    currency: readField<string>(row, "currency", "Currency"),
    description: readField<string>(row, "description", "Description"),
    imageUrl: readField<string>(row, "imageUrl", "ImageUrl", "thumbnail"),
    wifiSpeed: toNumberOrUndefined(readField<unknown>(row, "wifiSpeed", "WifiSpeed")),
    hasWifi: Boolean(readField<unknown>(row, "hasWifi", "HasWifi")),
    hasWorkDesk: Boolean(readField<unknown>(row, "hasWorkDesk", "HasWorkDesk")),
    hasCoworkingSpace: Boolean(readField<unknown>(row, "hasCoworkingSpace", "HasCoworkingSpace")),
    hasAirConditioning: Boolean(readField<unknown>(row, "hasAirConditioning", "HasAirConditioning")),
    hasKitchen: Boolean(readField<unknown>(row, "hasKitchen", "HasKitchen")),
    hasLaundry: Boolean(readField<unknown>(row, "hasLaundry", "HasLaundry")),
    hasParking: Boolean(readField<unknown>(row, "hasParking", "HasParking")),
    hasPool: Boolean(readField<unknown>(row, "hasPool", "HasPool")),
    hasGym: Boolean(readField<unknown>(row, "hasGym", "HasGym")),
    has24HReception: Boolean(readField<unknown>(row, "has24HReception", "Has24HReception")),
    hasLongStayDiscount: Boolean(readField<unknown>(row, "hasLongStayDiscount", "HasLongStayDiscount")),
    isPetFriendly: Boolean(readField<unknown>(row, "isPetFriendly", "IsPetFriendly")),
    status: readField<string>(row, "status", "Status"),
    nomadScore: toNumberOrUndefined(readField<unknown>(row, "nomadScore", "NomadScore")),
    phone: readField<string>(row, "phone", "Phone"),
    email: readField<string>(row, "email", "Email"),
    website: readField<string>(row, "website", "Website"),
    images: (readField<unknown[]>(row, "images", "Images") ?? []) as string[],
    createdAt: readField<string>(row, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt"),
  };
  return { ...res, data: hotel };
}

export async function fetchHotelRoomTypes(hotelId: string): Promise<ApiResult<RoomTypeDto[]>> {
  const safeId = hotelId.trim();
  if (!safeId) return { ok: false, message: "hotelId required", data: null, status: 0 };
  const res = await apiGet<unknown>(`/hotels/${encodeURIComponent(safeId)}/rooms`);
  const items = Array.isArray(res.data) ? res.data : [];
  const rows: RoomTypeDto[] = items.map((row: unknown) => {
    const r = row as Dict;
    return {
      id: String(readField<string | number>(r, "id", "Id") ?? ""),
      hotelId: String(readField<string | number>(r, "hotelId", "HotelId") ?? ""),
      name: readField<string>(r, "name", "Name", "roomName", "RoomName"),
      description: readField<string>(r, "description", "Description"),
      bedType: readField<string>(r, "bedType", "BedType", "bed_type"),
      maxOccupancy: toNumberOrUndefined(readField<unknown>(r, "maxOccupancy", "MaxOccupancy")),
      size: toNumberOrUndefined(readField<unknown>(r, "size", "Size", "roomSize", "RoomSize")),
      pricePerNight: toNumberOrUndefined(readField<unknown>(r, "pricePerNight", "PricePerNight")),
      currency: readField<string>(r, "currency", "Currency"),
      availableRooms: toNumberOrUndefined(readField<unknown>(r, "availableRooms", "AvailableRooms")),
      isAvailable: Boolean(readField<unknown>(r, "isAvailable", "IsAvailable")),
      amenities: (readField<unknown[]>(r, "amenities", "Amenities") ?? []) as string[],
      createdAt: readField<string>(r, "createdAt", "CreatedAt"),
    };
  });
  return { ...res, data: rows };
}

// ─── Hotel Review API functions ──────────────────────────────────────────────

export async function fetchHotelReviews(params: {
  page?: number;
  pageSize?: number;
  hotelId?: string;
  minRating?: number;
  status?: string;
  sortBy?: string;
}): Promise<ApiResult<Paginated<HotelReviewDto>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const query = new URLSearchParams({ pageNumber: String(page), pageSize: String(pageSize) });
  if (params.hotelId) query.set("hotelId", params.hotelId);
  if (params.minRating) query.set("minRating", String(params.minRating));
  if (params.status) query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);

  const res = await apiGet<unknown>(`/admin/hotel-reviews?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: HotelReviewDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;
    rows.push({
      id,
      hotelId: String(readField<string | number>(row, "hotelId", "HotelId") ?? ""),
      hotelName: readField<string>(row, "hotelName", "HotelName", "hotel_name"),
      userId: String(readField<string | number>(row, "userId", "UserId") ?? ""),
      userName: readField<string>(row, "userName", "UserName", "user_name"),
      userAvatar: readField<string>(row, "userAvatar", "UserAvatar", "avatar", "Avatar"),
      rating: toNumberOrUndefined(readField<unknown>(row, "rating", "Rating")),
      title: readField<string>(row, "title", "Title"),
      content: readField<string>(row, "content", "Content"),
      photoUrls: (readField<unknown[]>(row, "photoUrls", "PhotoUrls", "photos", "Photos") ?? []) as string[],
      isVerified: Boolean(readField<unknown>(row, "isVerified", "IsVerified")),
      helpfulCount: toNumberOrUndefined(readField<unknown>(row, "helpfulCount", "HelpfulCount", "helpful_count")),
      visitDate: readField<string>(row, "visitDate", "VisitDate", "visit_date"),
      status: readField<string>(row, "status", "Status"),
      createdAt: readField<string>(row, "createdAt", "CreatedAt"),
    });
  }
  return { ...res, data: { items: rows, totalCount: paged.totalCount, page: paged.page, pageSize: paged.pageSize } };
}

// ─── City Review API functions ───────────────────────────────────────────────

export async function fetchCityReviews(params: {
  page?: number;
  pageSize?: number;
  cityId?: string;
  minRating?: number;
  status?: string;
}): Promise<ApiResult<Paginated<CityReviewDto>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const query = new URLSearchParams({ pageNumber: String(page), pageSize: String(pageSize) });
  if (params.cityId) query.set("cityId", params.cityId);
  if (params.minRating) query.set("minRating", String(params.minRating));
  if (params.status) query.set("status", params.status);

  const res = await apiGet<unknown>(`/admin/city-reviews?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  const rows: CityReviewDto[] = [];
  for (const row of paged.items) {
    const id = String(readField<string | number>(row, "id", "Id") ?? "");
    if (!id) continue;
    rows.push({
      id,
      cityId: String(readField<string | number>(row, "cityId", "CityId") ?? ""),
      cityName: readField<string>(row, "cityName", "CityName"),
      userId: String(readField<string | number>(row, "userId", "UserId") ?? ""),
      userName: readField<string>(row, "userName", "UserName", "user_name"),
      userAvatar: readField<string>(row, "userAvatar", "UserAvatar", "avatar"),
      overallScore: toNumberOrUndefined(readField<unknown>(row, "overallScore", "OverallScore")),
      title: readField<string>(row, "title", "Title"),
      content: readField<string>(row, "content", "Content"),
      travelType: readField<string>(row, "travelType", "TravelType", "travel_type"),
      stayDuration: readField<string>(row, "stayDuration", "StayDuration", "stay_duration"),
      helpfulCount: toNumberOrUndefined(readField<unknown>(row, "helpfulCount", "HelpfulCount")),
      status: readField<string>(row, "status", "Status"),
      createdAt: readField<string>(row, "createdAt", "CreatedAt"),
    });
  }
  return { ...res, data: { items: rows, totalCount: paged.totalCount, page: paged.page, pageSize: paged.pageSize } };
}

// ─── Event Type API functions ───────────────────────────────────────────────

export async function fetchEventTypes(): Promise<ApiResult<EventTypeDto[]>> {
  const res = await apiGet<unknown>(`/event-types`);
  const items = Array.isArray(res.data) ? res.data : [];
  const rows: EventTypeDto[] = items.map((row: unknown) => {
    const r = row as Dict;
    return {
      id: String(readField<string | number>(r, "id", "Id") ?? ""),
      name: readField<string>(r, "name", "Name"),
      nameEn: readField<string>(r, "nameEn", "NameEn", "name_en"),
      icon: readField<string>(r, "icon", "Icon"),
      color: readField<string>(r, "color", "Color"),
      description: readField<string>(r, "description", "Description"),
      eventCount: toNumberOrUndefined(readField<unknown>(r, "eventCount", "EventCount")),
      createdAt: readField<string>(r, "createdAt", "CreatedAt"),
      updatedAt: readField<string>(r, "updatedAt", "UpdatedAt"),
    };
  });
  return { ...res, data: rows };
}

export async function createEventType(data: {
  name?: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  description?: string;
}): Promise<ApiResult<EventTypeDto>> {
  return apiPost<EventTypeDto>(`/event-types`, data);
}

export async function updateEventType(
  id: string,
  data: {
    name?: string;
    nameEn?: string;
    icon?: string;
    color?: string;
    description?: string;
  },
): Promise<ApiResult<EventTypeDto>> {
  return apiPut<EventTypeDto>(`/event-types/${encodeURIComponent(id)}`, data);
}

export async function deleteEventType(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/event-types/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Travel Plans ─────────────────────────── */

export type TravelPlanDto = {
  id: string;
  userId?: string;
  userName?: string;
  destination?: string;
  cityName?: string;
  days?: number;
  budgetLevel?: string;
  travelStyle?: string;
  completionRate?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TravelPlanDetailDto = TravelPlanDto & {
  interests?: string[];
  departureCity?: string;
  departureDate?: string;
  dailyItinerary?: unknown;
  attractions?: unknown;
  restaurants?: unknown;
  budget?: unknown;
  tips?: string[];
};

function mapTravelPlanDetail(d: Dict): TravelPlanDetailDto {
  const interestsRaw = readField<unknown[]>(d, "interests", "Interests");
  const tipsRaw = readField<unknown[]>(d, "tips", "Tips");

  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    destination: readField<string>(d, "destination", "Destination"),
    cityName: readField<string>(d, "cityName", "CityName"),
    days: toNumberOrUndefined(readField(d, "days", "Days")),
    budgetLevel: readField<string>(d, "budgetLevel", "BudgetLevel"),
    travelStyle: readField<string>(d, "travelStyle", "TravelStyle"),
    completionRate: toNumberOrUndefined(readField(d, "completionRate", "CompletionRate")),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
    interests: Array.isArray(interestsRaw) ? interestsRaw.map(String) : [],
    departureCity: readField<string>(d, "departureCity", "DepartureCity"),
    departureDate: readField<string>(d, "departureDate", "DepartureDate"),
    dailyItinerary: readField(d, "dailyItinerary", "DailyItinerary"),
    attractions: readField(d, "attractions", "Attractions"),
    restaurants: readField(d, "restaurants", "Restaurants"),
    budget: readField(d, "budget", "Budget"),
    tips: Array.isArray(tipsRaw) ? tipsRaw.map(String) : [],
  };
}

export async function fetchTravelPlans(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<ApiResult<Paginated<TravelPlanDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);

  const res = await apiGet<unknown>(`/admin/travel-plans?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: TravelPlanDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    destination: readField<string>(d, "destination", "Destination"),
    cityName: readField<string>(d, "cityName", "CityName"),
    days: toNumberOrUndefined(readField(d, "days", "Days")),
    budgetLevel: readField<string>(d, "budgetLevel", "BudgetLevel"),
    travelStyle: readField<string>(d, "travelStyle", "TravelStyle"),
    completionRate: toNumberOrUndefined(readField(d, "completionRate", "CompletionRate")),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchTravelPlanById(id: string): Promise<ApiResult<TravelPlanDetailDto | null>> {
  const res = await apiGet<unknown>(`/admin/travel-plans/${encodeURIComponent(id)}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapTravelPlanDetail((res.data ?? {}) as Dict) };
}

export async function deleteTravelPlan(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/travel-plans/${encodeURIComponent(id)}`);
}

export async function updateTravelPlanStatus(
  id: string,
  status: "planning" | "confirmed" | "completed",
): Promise<ApiResult<TravelPlanDetailDto | null>> {
  const res = await apiPut<unknown>(`/admin/travel-plans/${encodeURIComponent(id)}/status`, { status });
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapTravelPlanDetail((res.data ?? {}) as Dict) };
}

/* ─────────────────────────── Moderators ─────────────────────────── */

export type ModeratorDto = {
  id: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  cityId?: string;
  cityName?: string;
  country?: string;
  visitedCountries?: number;
  visitedCities?: number;
  latestTravel?: string;
  joinedAt?: string;
};

export type ModeratorApplicationDto = {
  id: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  cityId?: string;
  cityName?: string;
  reason?: string;
  visitedCountries?: number;
  visitedCities?: number;
  travelDays?: number;
  latestTravel?: string;
  status?: string;
  createdAt?: string;
};

export async function fetchModerators(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResult<Paginated<ModeratorDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) sp.set("search", params.search);

  const res = await apiGet<unknown>(`/admin/moderators?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: ModeratorDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    avatarUrl: readField<string>(d, "avatarUrl", "AvatarUrl"),
    cityId: readField<string>(d, "cityId", "CityId"),
    cityName: readField<string>(d, "cityName", "CityName"),
    country: readField<string>(d, "country", "Country"),
    visitedCountries: toNumberOrUndefined(readField(d, "visitedCountries", "VisitedCountries")),
    visitedCities: toNumberOrUndefined(readField(d, "visitedCities", "VisitedCities")),
    latestTravel: readField<string>(d, "latestTravel", "LatestTravel"),
    joinedAt: readField<string>(d, "joinedAt", "JoinedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchModeratorApplications(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ApiResult<Paginated<ModeratorApplicationDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.status) sp.set("status", params.status);

  const res = await apiGet<unknown>(`/admin/moderator-applications?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: ModeratorApplicationDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    avatarUrl: readField<string>(d, "avatarUrl", "AvatarUrl"),
    cityId: readField<string>(d, "cityId", "CityId"),
    cityName: readField<string>(d, "cityName", "CityName"),
    reason: readField<string>(d, "reason", "Reason"),
    visitedCountries: toNumberOrUndefined(readField(d, "visitedCountries", "VisitedCountries")),
    visitedCities: toNumberOrUndefined(readField(d, "visitedCities", "VisitedCities")),
    travelDays: toNumberOrUndefined(readField(d, "travelDays", "TravelDays")),
    latestTravel: readField<string>(d, "latestTravel", "LatestTravel"),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function approveModeratorApplication(id: string): Promise<ApiResult<null>> {
  return apiPost<null>(`/admin/moderator-applications/${encodeURIComponent(id)}/approve`, {});
}

export async function rejectModeratorApplication(id: string): Promise<ApiResult<null>> {
  return apiPost<null>(`/admin/moderator-applications/${encodeURIComponent(id)}/reject`, {});
}

export async function removeModerator(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/moderators/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Membership ─────────────────────────── */

export type MembershipPlanDto = {
  id: string;
  level?: number;
  name?: string;
  description?: string;
  price?: number;
  duration?: string;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  icon?: string;
  color?: string;
  features?: string[];
  subscriberCount?: number;
  status?: string;
  aiUsageLimit?: number;
  canUseAI?: boolean;
  canApplyModerator?: boolean;
  moderatorDeposit?: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MembershipPlanDetailDto = MembershipPlanDto;

export type MembershipPlanSubscriberDto = {
  userId: string;
  userName?: string;
  email?: string;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  remainingDays?: number;
};

function mapMembershipPlan(d: Dict): MembershipPlanDto {
  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    level: toNumberOrUndefined(readField(d, "level", "Level")),
    name: readField<string>(d, "name", "Name"),
    description: readField<string>(d, "description", "Description"),
    price: toNumberOrUndefined(readField(d, "price", "Price")),
    duration: readField<string>(d, "duration", "Duration"),
    priceMonthly: toNumberOrUndefined(readField(d, "priceMonthly", "PriceMonthly")),
    priceYearly: toNumberOrUndefined(readField(d, "priceYearly", "PriceYearly")),
    currency: readField<string>(d, "currency", "Currency"),
    icon: readField<string>(d, "icon", "Icon"),
    color: readField<string>(d, "color", "Color"),
    features: readField<string[]>(d, "features", "Features"),
    subscriberCount: toNumberOrUndefined(readField(d, "subscriberCount", "SubscriberCount")),
    status: readField<string>(d, "status", "Status"),
    aiUsageLimit: toNumberOrUndefined(readField(d, "aiUsageLimit", "AiUsageLimit")),
    canUseAI: readField<boolean>(d, "canUseAI", "CanUseAI"),
    canApplyModerator: readField<boolean>(d, "canApplyModerator", "CanApplyModerator"),
    moderatorDeposit: toNumberOrUndefined(readField(d, "moderatorDeposit", "ModeratorDeposit")),
    sortOrder: toNumberOrUndefined(readField(d, "sortOrder", "SortOrder")),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
  };
}

export async function fetchMembershipPlans(): Promise<ApiResult<MembershipPlanDto[]>> {
  const res = await apiGet<unknown[]>("/admin/membership/plans");
  const rows = Array.isArray(res.data) ? res.data : [];
  const items: MembershipPlanDto[] = rows.map((x) => mapMembershipPlan((x ?? {}) as Dict));
  return { ...res, data: items };
}

export async function fetchMembershipPlanById(id: string): Promise<ApiResult<MembershipPlanDetailDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "id is required",
      data: null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/admin/membership/plans/${encodeURIComponent(safeId)}`);
  const d = (res.data ?? {}) as Dict;
  const item: MembershipPlanDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? mapMembershipPlan(d)
    : null;

  return { ...res, data: item };
}

export async function fetchMembershipPlanSubscribers(id: string): Promise<ApiResult<MembershipPlanSubscriberDto[]>> {
  const safeId = id.trim();
  if (!safeId) {
    return { ok: false, message: "id is required", data: [], status: 0 };
  }

  const res = await apiGet<unknown[]>(`/admin/membership/plans/${encodeURIComponent(safeId)}/subscribers`);
  const rows = Array.isArray(res.data) ? res.data : [];
  const items = rows.map((row) => {
    const d = (row ?? {}) as Dict;
    return {
      userId: String(readField<string>(d, "userId", "UserId") || ""),
      userName: readField<string>(d, "userName", "UserName"),
      email: readField<string>(d, "email", "Email"),
      startDate: readField<string>(d, "startDate", "StartDate"),
      expiryDate: readField<string>(d, "expiryDate", "ExpiryDate"),
      isActive: readField<boolean>(d, "isActive", "IsActive"),
      autoRenew: readField<boolean>(d, "autoRenew", "AutoRenew"),
      remainingDays: toNumberOrUndefined(readField(d, "remainingDays", "RemainingDays")),
    } satisfies MembershipPlanSubscriberDto;
  });

  return { ...res, data: items };
}

export async function createMembershipPlan(data: {
  name: string;
  price: number;
  duration: string;
  features?: string[];
}): Promise<ApiResult<MembershipPlanDto>> {
  return apiPost<MembershipPlanDto>("/admin/membership/plans", data);
}

export async function updateMembershipPlan(
  id: string,
  data: { name?: string; price?: number; duration?: string; features?: string[] },
): Promise<ApiResult<MembershipPlanDto>> {
  return apiPut<MembershipPlanDto>(`/admin/membership/plans/${encodeURIComponent(id)}`, data);
}

export async function deleteMembershipPlan(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/membership/plans/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Pros & Cons ─────────────────────────── */

export type ProsConsDto = {
  id: string;
  content?: string;
  type?: string;
  userId?: string;
  userName?: string;
  cityId?: string;
  cityName?: string;
  likes?: number;
  dislikes?: number;
  status?: string;
  createdAt?: string;
};

export async function fetchProsCons(params: {
  page?: number;
  pageSize?: number;
  cityId?: string;
  type?: string;
  status?: string;
}): Promise<ApiResult<Paginated<ProsConsDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.cityId) sp.set("cityId", params.cityId);
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);

  const res = await apiGet<unknown>(`/admin/pros-cons?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: ProsConsDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    content: readField<string>(d, "content", "Content"),
    type: readField<string>(d, "type", "Type"),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    cityId: readField<string>(d, "cityId", "CityId"),
    cityName: readField<string>(d, "cityName", "CityName"),
    likes: toNumberOrUndefined(readField(d, "likes", "Likes")),
    dislikes: toNumberOrUndefined(readField(d, "dislikes", "Dislikes")),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function hideProsConsItem(id: string): Promise<ApiResult<null>> {
  return apiPut<null>(`/admin/pros-cons/${encodeURIComponent(id)}/hide`, {});
}

export async function deleteProsConsItem(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/pros-cons/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Community ─────────────────────────── */

export type CommunityPostDto = {
  id: string;
  type?: string;
  authorId?: string;
  authorName?: string;
  content?: string;
  likeCount?: number;
  commentCount?: number;
  cityId?: string;
  cityName?: string;
  status?: string;
  createdAt?: string;
};

export type CommunityPostDetailDto = CommunityPostDto & {
  title?: string;
  updatedAt?: string;
  tags?: string[];
  acceptedAnswerId?: string;
  acceptedAnswerSummary?: string;
};

export async function fetchCommunityPosts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}): Promise<ApiResult<Paginated<CommunityPostDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) sp.set("search", params.search);
  if (params.type) sp.set("type", params.type);

  const res = await apiGet<unknown>(`/admin/community/posts?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: CommunityPostDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    type: readField<string>(d, "type", "Type"),
    authorId: readField<string>(d, "authorId", "AuthorId"),
    authorName: readField<string>(d, "authorName", "AuthorName"),
    content: readField<string>(d, "content", "Content"),
    likeCount: toNumberOrUndefined(readField(d, "likeCount", "LikeCount")),
    commentCount: toNumberOrUndefined(readField(d, "commentCount", "CommentCount")),
    cityId: readField<string>(d, "cityId", "CityId"),
    cityName: readField<string>(d, "cityName", "CityName"),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchCommunityPostById(id: string): Promise<ApiResult<CommunityPostDetailDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return { ok: false, message: "id is required", data: null, status: 0 };
  }

  const res = await apiGet<unknown>(`/admin/community/posts/${encodeURIComponent(safeId)}`);
  const d = (res.data ?? {}) as Dict;
  const item: CommunityPostDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        type: readField<string>(d, "type", "Type"),
        authorId: readField<string>(d, "authorId", "AuthorId"),
        authorName: readField<string>(d, "authorName", "AuthorName"),
        title: readField<string>(d, "title", "Title"),
        content: readField<string>(d, "content", "Content"),
        likeCount: toNumberOrUndefined(readField(d, "likeCount", "LikeCount")),
        commentCount: toNumberOrUndefined(readField(d, "commentCount", "CommentCount")),
        cityId: readField<string>(d, "cityId", "CityId"),
        cityName: readField<string>(d, "cityName", "CityName"),
        status: readField<string>(d, "status", "Status"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
        tags: (readField<unknown[]>(d, "tags", "Tags") ?? []).map((tag) => String(tag)),
        acceptedAnswerId: readField<string>(d, "acceptedAnswerId", "AcceptedAnswerId"),
        acceptedAnswerSummary: readField<string>(d, "acceptedAnswerSummary", "AcceptedAnswerSummary"),
      }
    : null;

  return { ...res, data: item };
}

export async function updateCommunityPostStatus(
  id: string,
  status: "active" | "hidden",
): Promise<ApiResult<CommunityPostDetailDto | null>> {
  const res = await apiPut<unknown>(`/admin/community/posts/${encodeURIComponent(id)}/status`, { status });
  const d = (res.data ?? {}) as Dict;
  const item: CommunityPostDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        type: readField<string>(d, "type", "Type"),
        authorId: readField<string>(d, "authorId", "AuthorId"),
        authorName: readField<string>(d, "authorName", "AuthorName"),
        title: readField<string>(d, "title", "Title"),
        content: readField<string>(d, "content", "Content"),
        likeCount: toNumberOrUndefined(readField(d, "likeCount", "LikeCount")),
        commentCount: toNumberOrUndefined(readField(d, "commentCount", "CommentCount")),
        cityId: readField<string>(d, "cityId", "CityId"),
        cityName: readField<string>(d, "cityName", "CityName"),
        status: readField<string>(d, "status", "Status"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
        tags: (readField<unknown[]>(d, "tags", "Tags") ?? []).map((tag) => String(tag)),
        acceptedAnswerId: readField<string>(d, "acceptedAnswerId", "AcceptedAnswerId"),
        acceptedAnswerSummary: readField<string>(d, "acceptedAnswerSummary", "AcceptedAnswerSummary"),
      }
    : null;

  return { ...res, data: item };
}

export async function deleteCommunityPost(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/community/posts/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Notifications ─────────────────────────── */

export type NotificationDto = {
  id: string;
  userId?: string;
  recipientUserName?: string;
  recipientSummary?: string;
  type?: string;
  title?: string;
  content?: string;
  scope?: string;
  scopeDisplay?: string;
  relatedId?: string;
  relatedResourceName?: string;
  deliveredCount?: number;
  readCount?: number;
  status?: string;
  isRead?: boolean;
  scheduledAt?: string;
  readAt?: string;
  createdAt?: string;
  metadata?: string;
};

export type NotificationDetailDto = NotificationDto;

export async function fetchNotifications(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ApiResult<Paginated<NotificationDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.status) sp.set("status", params.status);

  const res = await apiGet<unknown>(`/admin/notifications?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: NotificationDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    recipientUserName: readField<string>(d, "recipientUserName", "RecipientUserName"),
    recipientSummary: readField<string>(d, "recipientSummary", "RecipientSummary"),
    type: readField<string>(d, "type", "Type"),
    title: readField<string>(d, "title", "Title"),
    content: readField<string>(d, "content", "Content", "message", "Message"),
    scope: readField<string>(d, "scope", "Scope") || "admins",
    scopeDisplay: readField<string>(d, "scopeDisplay", "ScopeDisplay"),
    relatedId: readField<string>(d, "relatedId", "RelatedId"),
    relatedResourceName: readField<string>(d, "relatedResourceName", "RelatedResourceName"),
    deliveredCount: toNumberOrUndefined(readField(d, "deliveredCount", "DeliveredCount")) ?? 1,
    readCount:
      toNumberOrUndefined(readField(d, "readCount", "ReadCount")) ??
      (Boolean(readField<unknown>(d, "isRead", "IsRead")) ? 1 : 0),
    status:
      readField<string>(d, "status", "Status") ||
      (Boolean(readField<unknown>(d, "isRead", "IsRead")) ? "read" : "unread"),
    isRead: Boolean(readField<unknown>(d, "isRead", "IsRead")),
    scheduledAt: readField<string>(d, "scheduledAt", "ScheduledAt"),
    readAt: readField<string>(d, "readAt", "ReadAt"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    metadata: toStringOrJson(readField(d, "metadata", "Metadata")),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchNotificationById(id: string): Promise<ApiResult<NotificationDetailDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return { ok: false, message: "id is required", data: null, status: 0 };
  }

  const res = await apiGet<unknown>(`/admin/notifications/${encodeURIComponent(safeId)}`);
  const d = (res.data ?? {}) as Dict;
  const item: NotificationDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        userId: readField<string>(d, "userId", "UserId"),
        recipientUserName: readField<string>(d, "recipientUserName", "RecipientUserName"),
        recipientSummary: readField<string>(d, "recipientSummary", "RecipientSummary"),
        type: readField<string>(d, "type", "Type"),
        title: readField<string>(d, "title", "Title"),
        content: readField<string>(d, "content", "Content", "message", "Message"),
        status: readField<string>(d, "status", "Status") || (Boolean(readField<unknown>(d, "isRead", "IsRead")) ? "read" : "unread"),
        isRead: Boolean(readField<unknown>(d, "isRead", "IsRead")),
        readAt: readField<string>(d, "readAt", "ReadAt"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        metadata: toStringOrJson(readField(d, "metadata", "Metadata")),
        scope: readField<string>(d, "scope", "Scope") || "admins",
        scopeDisplay: readField<string>(d, "scopeDisplay", "ScopeDisplay"),
        relatedId: readField<string>(d, "relatedId", "RelatedId"),
        relatedResourceName: readField<string>(d, "relatedResourceName", "RelatedResourceName"),
        deliveredCount: toNumberOrUndefined(readField(d, "deliveredCount", "DeliveredCount")) ?? 1,
        readCount: toNumberOrUndefined(readField(d, "readCount", "ReadCount")) ?? 0,
        scheduledAt: readField<string>(d, "scheduledAt", "ScheduledAt"),
      }
    : null;

  return { ...res, data: item };
}

export async function updateNotification(
  id: string,
  data: { title?: string; message?: string; type?: string; metadata?: string },
): Promise<ApiResult<NotificationDetailDto | null>> {
  const res = await apiPut<unknown>(`/admin/notifications/${encodeURIComponent(id)}`, data);
  const d = (res.data ?? {}) as Dict;
  const item: NotificationDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        userId: readField<string>(d, "userId", "UserId"),
        recipientUserName: readField<string>(d, "recipientUserName", "RecipientUserName"),
        recipientSummary: readField<string>(d, "recipientSummary", "RecipientSummary"),
        type: readField<string>(d, "type", "Type"),
        title: readField<string>(d, "title", "Title"),
        content: readField<string>(d, "content", "Content", "message", "Message"),
        status: readField<string>(d, "status", "Status") || (Boolean(readField<unknown>(d, "isRead", "IsRead")) ? "read" : "unread"),
        isRead: Boolean(readField<unknown>(d, "isRead", "IsRead")),
        readAt: readField<string>(d, "readAt", "ReadAt"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        metadata: toStringOrJson(readField(d, "metadata", "Metadata")),
        scope: readField<string>(d, "scope", "Scope") || "admins",
        scopeDisplay: readField<string>(d, "scopeDisplay", "ScopeDisplay"),
        relatedId: readField<string>(d, "relatedId", "RelatedId"),
        relatedResourceName: readField<string>(d, "relatedResourceName", "RelatedResourceName"),
        deliveredCount: toNumberOrUndefined(readField(d, "deliveredCount", "DeliveredCount")) ?? 1,
        readCount: toNumberOrUndefined(readField(d, "readCount", "ReadCount")) ?? 0,
        scheduledAt: readField<string>(d, "scheduledAt", "ScheduledAt"),
      }
    : null;

  return { ...res, data: item };
}

export async function createNotification(data: {
  type: string;
  title: string;
  content: string;
  scope: string;
  scheduledAt?: string;
}): Promise<ApiResult<NotificationDto>> {
  return apiPost<NotificationDto>("/admin/notifications", {
    title: data.title,
    message: data.content,
    type: data.type,
  });
}

export async function deleteNotification(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/notifications/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Chat / Conversations ─────────────────────────── */

export type ConversationDto = {
  id: string;
  name?: string;
  roomType?: string;
  city?: string;
  country?: string;
  totalMembers?: number;
  createdBy?: string;
  imageUrl?: string;
  participants?: { userId: string; userName: string; avatarUrl?: string }[];
  lastMessage?: string;
  unreadCount?: number;
  lastActiveAt?: string;
  description?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ConversationMemberDto = {
  userId: string;
  userName: string;
  userAvatar?: string;
  role?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
};

export type ConversationMessageDto = {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  message?: string;
  messageType?: string;
  timestamp?: string;
};

export type ConversationDetailDto = ConversationDto & {
  isPublic?: boolean;
  members?: ConversationMemberDto[];
  messages?: ConversationMessageDto[];
};

export async function fetchConversations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResult<Paginated<ConversationDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) sp.set("search", params.search);

  const res = await apiGet<unknown>(`/admin/chats?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: ConversationDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    name: readField<string>(d, "name", "Name"),
    roomType: readField<string>(d, "roomType", "RoomType"),
    city: readField<string>(d, "city", "City"),
    country: readField<string>(d, "country", "Country"),
    totalMembers: toNumberOrUndefined(readField(d, "totalMembers", "TotalMembers")),
    createdBy: readField<string>(d, "createdBy", "CreatedBy"),
    imageUrl: readField<string>(d, "imageUrl", "ImageUrl"),
    participants: readField(d, "participants", "Participants") as ConversationDto["participants"],
    lastMessage: readField<string>(d, "lastMessage", "LastMessage", "description", "Description"),
    unreadCount: toNumberOrUndefined(readField(d, "unreadCount", "UnreadCount")),
    lastActiveAt: readField<string>(d, "lastActiveAt", "LastActiveAt", "updatedAt", "UpdatedAt", "createdAt", "CreatedAt"),
    description: readField<string>(d, "description", "Description"),
    createdByName: readField<string>(d, "createdByName", "CreatedByName"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchConversationById(id: string): Promise<ApiResult<ConversationDetailDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return { ok: false, message: "id is required", data: null, status: 0 };
  }

  const res = await apiGet<unknown>(`/admin/chats/${encodeURIComponent(safeId)}`);
  const d = (res.data ?? {}) as Dict;
  const item: ConversationDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        name: readField<string>(d, "name", "Name"),
        roomType: readField<string>(d, "roomType", "RoomType"),
        city: readField<string>(d, "city", "City"),
        country: readField<string>(d, "country", "Country"),
        totalMembers: toNumberOrUndefined(readField(d, "totalMembers", "TotalMembers")),
        createdBy: readField<string>(d, "createdBy", "CreatedBy"),
        createdByName: readField<string>(d, "createdByName", "CreatedByName"),
        imageUrl: readField<string>(d, "imageUrl", "ImageUrl"),
        description: readField<string>(d, "description", "Description"),
        lastMessage: readField<string>(d, "lastMessage", "LastMessage"),
        lastActiveAt: readField<string>(d, "lastActiveAt", "LastActiveAt"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
        isPublic: Boolean(readField<unknown>(d, "isPublic", "IsPublic")),
        members: (readField<unknown[]>(d, "members", "Members") ?? []).map((member) => {
          const m = (member ?? {}) as Dict;
          return {
            userId: String(readField<string>(m, "userId", "UserId") || ""),
            userName: readField<string>(m, "userName", "UserName") || "",
            userAvatar: readField<string>(m, "userAvatar", "UserAvatar"),
            role: readField<string>(m, "role", "Role"),
            isOnline: Boolean(readField<unknown>(m, "isOnline", "IsOnline")),
            lastSeenAt: readField<string>(m, "lastSeenAt", "LastSeenAt"),
          };
        }),
        messages: (readField<unknown[]>(d, "messages", "Messages") ?? []).map((message) => {
          const m = (message ?? {}) as Dict;
          return {
            id: String(readField<string>(m, "id", "Id") || ""),
            userId: readField<string>(m, "userId", "UserId"),
            userName: readField<string>(m, "userName", "UserName"),
            userAvatar: readField<string>(m, "userAvatar", "UserAvatar"),
            message: readField<string>(m, "message", "Message"),
            messageType: readField<string>(m, "messageType", "MessageType"),
            timestamp: readField<string>(m, "timestamp", "Timestamp"),
          };
        }),
      }
    : null;

  return { ...res, data: item };
}

export async function deleteConversation(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/chats/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── AI Chat Sessions ─────────────────────────── */

export type AiSessionDto = {
  id: string;
  userId?: string;
  userName?: string;
  title?: string;
  status?: string;
  lastMessage?: string;
  model?: string;
  tokenUsage?: number;
  lastMessageAt?: string;
  createdAt?: string;
};

export type AiSessionMessageDto = {
  id: string;
  role?: string;
  content?: string;
  modelName?: string;
  tokenCount?: number;
  totalTokens?: number;
  isError?: boolean;
  errorMessage?: string;
  createdAt?: string;
};

export type AiSessionDetailDto = AiSessionDto & {
  updatedAt?: string;
  messages?: AiSessionMessageDto[];
};

export async function fetchAiSessions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResult<Paginated<AiSessionDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) sp.set("search", params.search);

  const res = await apiGet<unknown>(`/admin/ai/conversations?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: AiSessionDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    title: readField<string>(d, "title", "Title"),
    status: readField<string>(d, "status", "Status"),
    lastMessage: readField<string>(d, "lastMessage", "LastMessage", "title", "Title"),
    model: readField<string>(d, "model", "Model", "modelName", "ModelName"),
    tokenUsage: toNumberOrUndefined(readField(d, "tokenUsage", "TokenUsage", "totalTokens", "TotalTokens")),
    lastMessageAt: readField<string>(d, "lastMessageAt", "LastMessageAt"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function fetchAiSessionById(id: string): Promise<ApiResult<AiSessionDetailDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return { ok: false, message: "id is required", data: null, status: 0 };
  }

  const res = await apiGet<unknown>(`/admin/ai/conversations/${encodeURIComponent(safeId)}`);
  const d = (res.data ?? {}) as Dict;
  const item: AiSessionDetailDto | null = String(readField<string>(d, "id", "Id") || "")
    ? {
        id: String(readField<string>(d, "id", "Id") || ""),
        userId: readField<string>(d, "userId", "UserId"),
        userName: readField<string>(d, "userName", "UserName"),
        title: readField<string>(d, "title", "Title"),
        status: readField<string>(d, "status", "Status"),
        model: readField<string>(d, "model", "Model", "modelName", "ModelName"),
        tokenUsage: toNumberOrUndefined(readField(d, "tokenUsage", "TokenUsage", "totalTokens", "TotalTokens")),
        lastMessageAt: readField<string>(d, "lastMessageAt", "LastMessageAt"),
        createdAt: readField<string>(d, "createdAt", "CreatedAt"),
        updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
        messages: (readField<unknown[]>(d, "messages", "Messages") ?? []).map((message) => {
          const m = (message ?? {}) as Dict;
          return {
            id: String(readField<string>(m, "id", "Id") || ""),
            role: readField<string>(m, "role", "Role"),
            content: readField<string>(m, "content", "Content"),
            modelName: readField<string>(m, "modelName", "ModelName"),
            tokenCount: toNumberOrUndefined(readField(m, "tokenCount", "TokenCount")),
            totalTokens: toNumberOrUndefined(readField(m, "totalTokens", "TotalTokens")),
            isError: Boolean(readField<unknown>(m, "isError", "IsError")),
            errorMessage: readField<string>(m, "errorMessage", "ErrorMessage"),
            createdAt: readField<string>(m, "createdAt", "CreatedAt"),
          };
        }),
      }
    : null;

  return { ...res, data: item };
}

export async function deleteAiSession(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/admin/ai/conversations/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Legal Documents ─────────────────────────── */

export type LegalDocumentDto = {
  id: string;
  documentType?: string;
  slug?: string;
  title?: string;
  language?: string;
  version?: string;
  status?: string;
  effectiveDate?: string;
  isCurrent?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LegalSectionDto = {
  title: string;
  content: string;
};

export type LegalSummaryDto = {
  icon: string;
  title: string;
  content: string;
};

export type LegalSdkInfoDto = {
  name: string;
  company: string;
  purpose: string;
  dataCollected: string[];
  privacyUrl: string;
};

export type LegalDocumentDetailDto = LegalDocumentDto & {
  sections: LegalSectionDto[];
  summary: LegalSummaryDto[];
  sdkList: LegalSdkInfoDto[];
};

function mapLegalDocument(row: Dict): LegalDocumentDto {
  const documentType = readField<string>(row, "documentType", "DocumentType") || "";
  const effectiveDate = readField<string>(row, "effectiveDate", "EffectiveDate") || "";
  const isCurrent = Boolean(readField<unknown>(row, "isCurrent", "IsCurrent"));

  return {
    id: String(readField<string | number>(row, "id", "Id") ?? ""),
    documentType,
    slug: readField<string>(row, "slug", "Slug") || documentType,
    title: readField<string>(row, "title", "Title") || "",
    language: readField<string>(row, "language", "Language") || "",
    version: readField<string>(row, "version", "Version") || "",
    status: readField<string>(row, "status", "Status") || (isCurrent ? "published" : "archived"),
    effectiveDate,
    isCurrent,
    publishedAt: readField<string>(row, "publishedAt", "PublishedAt") || effectiveDate,
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || effectiveDate,
  };
}

function mapLegalDocumentDetail(row: Dict): LegalDocumentDetailDto {
  return {
    ...mapLegalDocument(row),
    sections: ((readField<unknown[]>(row, "sections", "Sections") ?? []) as unknown[]).map((item) => {
      const section = (item ?? {}) as Dict;
      return {
        title: readField<string>(section, "title", "Title") || "",
        content: readField<string>(section, "content", "Content") || "",
      } satisfies LegalSectionDto;
    }),
    summary: ((readField<unknown[]>(row, "summary", "Summary") ?? []) as unknown[]).map((item) => {
      const summary = (item ?? {}) as Dict;
      return {
        icon: readField<string>(summary, "icon", "Icon") || "",
        title: readField<string>(summary, "title", "Title") || "",
        content: readField<string>(summary, "content", "Content") || "",
      } satisfies LegalSummaryDto;
    }),
    sdkList: ((readField<unknown[]>(row, "sdkList", "SdkList") ?? []) as unknown[]).map((item) => {
      const sdk = (item ?? {}) as Dict;
      return {
        name: readField<string>(sdk, "name", "Name") || "",
        company: readField<string>(sdk, "company", "Company") || "",
        purpose: readField<string>(sdk, "purpose", "Purpose") || "",
        dataCollected: Array.isArray(readField<unknown[]>(sdk, "dataCollected", "DataCollected"))
          ? ((readField<unknown[]>(sdk, "dataCollected", "DataCollected") ?? []) as unknown[]).map((value) => String(value))
          : [],
        privacyUrl: readField<string>(sdk, "privacyUrl", "PrivacyUrl") || "",
      } satisfies LegalSdkInfoDto;
    }),
  };
}

export async function fetchLegalDocuments(params?: {
  page?: number;
  pageSize?: number;
  documentType?: string;
  language?: string;
  search?: string;
}): Promise<ApiResult<Paginated<LegalDocumentDto>>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (params?.documentType?.trim()) query.set("documentType", params.documentType.trim());
  if (params?.language?.trim()) query.set("language", params.language.trim());
  if (params?.search?.trim()) query.set("search", params.search.trim());

  const res = await apiGet<unknown>(`/admin/legal?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  return {
    ...res,
    data: {
      items: paged.items.map(mapLegalDocument).filter((item) => Boolean(item.id)),
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    },
  } satisfies ApiResult<Paginated<LegalDocumentDto>>;
}

export async function fetchLegalDocumentById(id: string): Promise<ApiResult<LegalDocumentDetailDto | null>> {
  const res = await apiGet<unknown>(`/admin/legal/${encodeURIComponent(id)}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapLegalDocumentDetail((res.data ?? {}) as Dict) };
}

export async function createLegalDocument(body: {
  documentType: string;
  version: string;
  language: string;
  title: string;
  effectiveDate: string;
  isCurrent: boolean;
  sections: LegalSectionDto[];
  summary: LegalSummaryDto[];
  sdkList: LegalSdkInfoDto[];
}) {
  const res = await apiPost<unknown>("/admin/legal", body);
  if (!res.ok || !res.data) return { ...res, data: null as LegalDocumentDetailDto | null };
  return { ...res, data: mapLegalDocumentDetail((res.data ?? {}) as Dict) };
}

export async function updateLegalDocument(
  id: string,
  body: {
    documentType: string;
    version: string;
    language: string;
    title: string;
    effectiveDate: string;
    isCurrent: boolean;
    sections: LegalSectionDto[];
    summary: LegalSummaryDto[];
    sdkList: LegalSdkInfoDto[];
  },
) {
  const res = await apiPut<unknown>(`/admin/legal/${encodeURIComponent(id)}`, body);
  if (!res.ok || !res.data) return { ...res, data: null as LegalDocumentDetailDto | null };
  return { ...res, data: mapLegalDocumentDetail((res.data ?? {}) as Dict) };
}

export async function deleteLegalDocument(id: string) {
  return apiDelete<null>(`/admin/legal/${encodeURIComponent(id)}`);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * ConfigService — 静态文本 / 选项组 / 配置快照
 * ───────────────────────────────────────────────────────────────────────────── */

export type StaticTextDto = {
  id: string;
  textKey?: string;
  locale?: string;
  textValue?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  version?: number;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OptionGroupDto = {
  id: string;
  groupCode?: string;
  groupName?: string;
  groupNameEn?: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OptionItemDto = {
  id: string;
  groupId?: string;
  optionCode?: string;
  optionValue?: string;
  optionValueEn?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ConfigSnapshotDto = {
  id: string;
  version?: string;
  isPublished?: boolean;
  publishedBy?: string;
  publishedAt?: string;
  createdAt?: string;
};

export type SystemSettingDto = {
  id: string;
  section?: string;
  settingKey?: string;
  label?: string;
  description?: string;
  valueType?: string;
  value?: string;
  defaultValue?: string;
  isActive?: boolean;
  isSecret?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

function mapSystemSetting(row: Dict): SystemSettingDto {
  return {
    id: String(readField<string | number>(row, "id", "Id") ?? ""),
    section: readField<string>(row, "section", "Section") || "",
    settingKey: readField<string>(row, "settingKey", "SettingKey") || "",
    label: readField<string>(row, "label", "Label") || "",
    description: readField<string>(row, "description", "Description") || "",
    valueType: readField<string>(row, "valueType", "ValueType") || "string",
    value: readField<string>(row, "value", "Value") || "",
    defaultValue: readField<string>(row, "defaultValue", "DefaultValue") || "",
    isActive: Boolean(readField<unknown>(row, "isActive", "IsActive")),
    isSecret: Boolean(readField<unknown>(row, "isSecret", "IsSecret")),
    sortOrder: toNumberOrUndefined(readField(row, "sortOrder", "SortOrder")),
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    updatedAt: readField<string>(row, "updatedAt", "UpdatedAt") || "",
  };
}

export async function fetchSystemSettings(params?: {
  page?: number;
  pageSize?: number;
  section?: string;
  search?: string;
}): Promise<ApiResult<Paginated<SystemSettingDto>>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  if (params?.section?.trim()) query.set("section", params.section.trim());
  if (params?.search?.trim()) query.set("search", params.search.trim());

  const res = await apiGet<unknown>(`/admin/config/system-settings?${query.toString()}`);
  const paged = toPagedDicts(res.data, page, pageSize);

  return {
    ...res,
    data: {
      items: paged.items.map(mapSystemSetting).filter((item) => Boolean(item.id)),
      totalCount: paged.totalCount,
      page: paged.page,
      pageSize: paged.pageSize,
    },
  } satisfies ApiResult<Paginated<SystemSettingDto>>;
}

export async function fetchSystemSettingById(id: string): Promise<ApiResult<SystemSettingDto | null>> {
  const res = await apiGet<unknown>(`/admin/config/system-settings/${encodeURIComponent(id)}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapSystemSetting((res.data ?? {}) as Dict) };
}

export async function createSystemSetting(body: {
  section: string;
  settingKey: string;
  label: string;
  description?: string;
  valueType: string;
  value: string;
  defaultValue?: string;
  isActive: boolean;
  isSecret: boolean;
  sortOrder: number;
}) {
  const res = await apiPost<unknown>("/admin/config/system-settings", body);
  if (!res.ok || !res.data) return { ...res, data: null as SystemSettingDto | null };
  return { ...res, data: mapSystemSetting((res.data ?? {}) as Dict) };
}

export async function updateSystemSetting(
  id: string,
  body: {
    section: string;
    settingKey: string;
    label: string;
    description?: string;
    valueType: string;
    value: string;
    defaultValue?: string;
    isActive: boolean;
    isSecret: boolean;
    sortOrder: number;
  },
) {
  const res = await apiPut<unknown>(`/admin/config/system-settings/${encodeURIComponent(id)}`, body);
  if (!res.ok || !res.data) return { ...res, data: null as SystemSettingDto | null };
  return { ...res, data: mapSystemSetting((res.data ?? {}) as Dict) };
}

export async function deleteSystemSetting(id: string) {
  return apiDelete<null>(`/admin/config/system-settings/${encodeURIComponent(id)}`);
}

function mapStaticText(d: Dict): StaticTextDto {
  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    textKey: readField<string>(d, "textKey", "TextKey"),
    locale: readField<string>(d, "locale", "Locale"),
    textValue: readField<string>(d, "textValue", "TextValue"),
    category: readField<string>(d, "category", "Category"),
    description: readField<string>(d, "description", "Description"),
    isActive: readField<boolean>(d, "isActive", "IsActive"),
    version: readField<number>(d, "version", "Version"),
    updatedBy: readField<string>(d, "updatedBy", "UpdatedBy"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
  };
}

function mapOptionGroup(d: Dict): OptionGroupDto {
  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    groupCode: readField<string>(d, "groupCode", "GroupCode"),
    groupName: readField<string>(d, "groupName", "GroupName"),
    groupNameEn: readField<string>(d, "groupNameEn", "GroupNameEn"),
    description: readField<string>(d, "description", "Description"),
    isSystem: readField<boolean>(d, "isSystem", "IsSystem"),
    isActive: readField<boolean>(d, "isActive", "IsActive"),
    itemCount: readField<number>(d, "itemCount", "ItemCount"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
  };
}

function mapOptionItem(d: Dict): OptionItemDto {
  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    groupId: readField<string>(d, "groupId", "GroupId"),
    optionCode: readField<string>(d, "optionCode", "OptionCode"),
    optionValue: readField<string>(d, "optionValue", "OptionValue"),
    optionValueEn: readField<string>(d, "optionValueEn", "OptionValueEn"),
    icon: readField<string>(d, "icon", "Icon"),
    color: readField<string>(d, "color", "Color"),
    sortOrder: readField<number>(d, "sortOrder", "SortOrder"),
    isActive: readField<boolean>(d, "isActive", "IsActive"),
    metadata: readField<string>(d, "metadata", "Metadata"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
  };
}

function mapConfigSnapshot(d: Dict): ConfigSnapshotDto {
  return {
    id: String(readField<string>(d, "id", "Id") || ""),
    version: readField<string>(d, "version", "Version"),
    isPublished: readField<boolean>(d, "isPublished", "IsPublished"),
    publishedBy: readField<string>(d, "publishedBy", "PublishedBy"),
    publishedAt: readField<string>(d, "publishedAt", "PublishedAt"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  };
}

// ── Static Texts ──

export async function fetchStaticTexts(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  key?: string;
  locale?: string;
}): Promise<ApiResult<Paginated<StaticTextDto>>> {
  const p = params.page ?? 1;
  const ps = params.pageSize ?? 20;
  const qs = new URLSearchParams({ page: String(p), pageSize: String(ps) });
  if (params.category) qs.set("category", params.category);
  if (params.key) qs.set("key", params.key);
  if (params.locale) qs.set("locale", params.locale);
  const res = await apiGet<unknown>(`/admin/static-texts?${qs}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  const paged = toPagedDicts(res.data, p, ps);
  return { ...res, data: { ...paged, items: paged.items.map((d) => mapStaticText(d as unknown as Dict)) } };
}

export async function fetchStaticTextById(id: string): Promise<ApiResult<StaticTextDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "id is required",
      data: null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/admin/static-texts/${encodeURIComponent(safeId)}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapStaticText((res.data ?? {}) as Dict) };
}

export async function fetchStaticTextCategories(): Promise<ApiResult<string[]>> {
  const res = await apiGet<unknown>("/admin/static-texts/categories");
  if (!res.ok || !res.data) return { ...res, data: [] };
  const rows = Array.isArray(res.data) ? res.data : [];
  return { ...res, data: rows.map(String) };
}

export async function createStaticText(body: {
  textKey: string;
  locale: string;
  textValue: string;
  category?: string;
  description?: string;
}): Promise<ApiResult<StaticTextDto>> {
  const res = await apiPost<unknown>("/admin/static-texts", body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapStaticText((res.data ?? {}) as Dict) };
}

export async function updateStaticText(id: string, body: {
  textValue?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}): Promise<ApiResult<StaticTextDto>> {
  const res = await apiPut<unknown>(`/admin/static-texts/${id}`, body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapStaticText((res.data ?? {}) as Dict) };
}

export async function deleteStaticText(id: string): Promise<ApiResult<unknown>> {
  return apiDelete<unknown>(`/admin/static-texts/${id}`);
}

// ── Option Groups ──

export async function fetchOptionGroups(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResult<Paginated<OptionGroupDto>>> {
  const p = params?.page ?? 1;
  const ps = params?.pageSize ?? 50;
  const res = await apiGet<unknown>(`/admin/option-groups?page=${p}&pageSize=${ps}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  const paged = toPagedDicts(res.data, p, ps);
  return { ...res, data: { ...paged, items: paged.items.map((d) => mapOptionGroup(d as unknown as Dict)) } };
}

export async function fetchOptionGroupById(id: string): Promise<ApiResult<OptionGroupDto | null>> {
  const safeId = id.trim();
  if (!safeId) {
    return {
      ok: false,
      message: "id is required",
      data: null,
      status: 0,
    };
  }

  const res = await apiGet<unknown>(`/admin/option-groups/${encodeURIComponent(safeId)}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionGroup((res.data ?? {}) as Dict) };
}

export async function createOptionGroup(body: {
  groupCode: string;
  groupName: string;
  groupNameEn?: string;
  description?: string;
}): Promise<ApiResult<OptionGroupDto>> {
  const res = await apiPost<unknown>("/admin/option-groups", body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionGroup((res.data ?? {}) as Dict) };
}

export async function updateOptionGroup(id: string, body: {
  groupName?: string;
  groupNameEn?: string;
  description?: string;
}): Promise<ApiResult<OptionGroupDto>> {
  const res = await apiPut<unknown>(`/admin/option-groups/${id}`, body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionGroup((res.data ?? {}) as Dict) };
}

export async function deleteOptionGroup(id: string): Promise<ApiResult<unknown>> {
  return apiDelete<unknown>(`/admin/option-groups/${id}`);
}

export async function toggleOptionGroup(id: string): Promise<ApiResult<OptionGroupDto>> {
  const res = await apiPost<unknown>(`/admin/option-groups/${id}/toggle`, {});
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionGroup((res.data ?? {}) as Dict) };
}

// ── Option Items ──

export async function fetchOptionItems(groupId: string): Promise<ApiResult<OptionItemDto[]>> {
  const res = await apiGet<unknown>(`/admin/option-groups/${groupId}/items`);
  if (!res.ok || !res.data) return { ...res, data: [] };
  const rows = Array.isArray(res.data) ? res.data : [];
  return { ...res, data: rows.map((x) => mapOptionItem((x ?? {}) as Dict)) };
}

export async function createOptionItem(groupId: string, body: {
  optionCode: string;
  optionValue: string;
  optionValueEn?: string;
  icon?: string;
  color?: string;
}): Promise<ApiResult<OptionItemDto>> {
  const res = await apiPost<unknown>(`/admin/option-groups/${groupId}/items`, body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionItem((res.data ?? {}) as Dict) };
}

export async function updateOptionItem(groupId: string, itemId: string, body: {
  optionValue?: string;
  optionValueEn?: string;
  icon?: string;
  color?: string;
}): Promise<ApiResult<OptionItemDto>> {
  const res = await apiPut<unknown>(`/admin/option-groups/${groupId}/items/${itemId}`, body);
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapOptionItem((res.data ?? {}) as Dict) };
}

export async function deleteOptionItem(groupId: string, itemId: string): Promise<ApiResult<unknown>> {
  return apiDelete<unknown>(`/admin/option-groups/${groupId}/items/${itemId}`);
}

export async function reorderOptionItems(groupId: string, itemIds: string[]): Promise<ApiResult<unknown>> {
  return apiPost<unknown>(`/admin/option-groups/${groupId}/items/reorder`, { itemIds });
}

// ── Config Snapshots ──

export async function fetchConfigSnapshots(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResult<Paginated<ConfigSnapshotDto>>> {
  const p = params?.page ?? 1;
  const ps = params?.pageSize ?? 20;
  const res = await apiGet<unknown>(`/admin/config/snapshots?page=${p}&pageSize=${ps}`);
  if (!res.ok || !res.data) return { ...res, data: null };
  const paged = toPagedDicts(res.data, p, ps);
  return { ...res, data: { ...paged, items: paged.items.map((d) => mapConfigSnapshot(d as unknown as Dict)) } };
}

export async function publishConfig(): Promise<ApiResult<ConfigSnapshotDto>> {
  const res = await apiPost<unknown>("/admin/config/publish", {});
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapConfigSnapshot((res.data ?? {}) as Dict) };
}

export async function rollbackConfig(snapshotId: string): Promise<ApiResult<ConfigSnapshotDto>> {
  const res = await apiPost<unknown>(`/admin/config/rollback/${snapshotId}`, {});
  if (!res.ok || !res.data) return { ...res, data: null };
  return { ...res, data: mapConfigSnapshot((res.data ?? {}) as Dict) };
}
