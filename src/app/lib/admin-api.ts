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
};

export type UserDto = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  createdAt?: string;
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
  createdAt?: string;
};

export type ReportDto = {
  id: string;
  reporterId?: string;
  reporterName?: string;
  contentType?: string;
  targetId?: string;
  targetName?: string;
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
    });
  }

  return { ...res, data: roles };
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
  const users: UserDto[] = [];
  for (const x of itemsRaw) {
    const row = (x ?? {}) as Dict;
    const id = readField<string>(row, "id", "Id") || "";
    if (!id) continue;

    users.push({
      id,
      name: readField<string>(row, "name", "Name") || "",
      email: readField<string>(row, "email", "Email") || "",
      role: readField<string>(row, "role", "Role") || "",
      avatarUrl: readField<string>(row, "avatarUrl", "AvatarUrl") || "",
      createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
    });
  }

  const paged: Paginated<UserDto> = {
    items: users,
    totalCount: Number(readField<number>(payload, "totalCount", "TotalCount") || 0),
    page: Number(readField<number>(payload, "page", "Page") || page),
    pageSize: Number(readField<number>(payload, "pageSize", "PageSize") || pageSize),
  };

  return { ...res, data: paged };
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
      title: readField<string>(row, "title", "Title") || "",
      imageUrl: readField<string>(row, "imageUrl", "ImageUrl") || "",
      description: readField<string>(row, "description", "Description") || "",
      locationNote: readField<string>(row, "locationNote", "LocationNote") || "",
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
      contentType: readField<string>(row, "contentType", "ContentType") || "",
      targetId: readField<string>(row, "targetId", "TargetId") || "",
      targetName: readField<string>(row, "targetName", "TargetName") || "",
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
    contentType: readField<string>(row, "contentType", "ContentType") || "",
    targetId: readField<string>(row, "targetId", "TargetId") || "",
    targetName: readField<string>(row, "targetName", "TargetName") || "",
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
  const row = (res.data ?? {}) as Dict;
  const id = String(readField<string | number>(row, "id", "Id") ?? "");

  if (!id) {
    return {
      ...res,
      ok: false,
      data: null as UserDto | null,
      message: res.message || "User not found",
    };
  }

  const user: UserDto = {
    id,
    name: readField<string>(row, "name", "Name") || "",
    email: readField<string>(row, "email", "Email") || "",
    role: readField<string>(row, "role", "Role") || "",
    avatarUrl: readField<string>(row, "avatarUrl", "AvatarUrl") || "",
    createdAt: readField<string>(row, "createdAt", "CreatedAt") || "",
  };

  return { ...res, data: user };
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

  const res = await apiGet<unknown>(`/hotel-reviews?${query.toString()}`);
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

  const res = await apiGet<unknown>(`/city-reviews?${query.toString()}`);
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
  dailyItinerary?: unknown[];
  attractions?: unknown[];
  restaurants?: unknown[];
  budget?: unknown;
  tips?: string[];
};

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

  const res = await apiGet<unknown>(`/travel-plans?${sp}`);
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
  return apiGet<TravelPlanDetailDto>(`/travel-plans/${encodeURIComponent(id)}`);
}

export async function deleteTravelPlan(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/travel-plans/${encodeURIComponent(id)}`);
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

  const res = await apiGet<unknown>(`/moderators?${sp}`);
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

  const res = await apiGet<unknown>(`/moderator-applications?${sp}`);
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
  return apiPut<null>(`/moderator-applications/${encodeURIComponent(id)}`, { status: "approved" });
}

export async function rejectModeratorApplication(id: string): Promise<ApiResult<null>> {
  return apiPut<null>(`/moderator-applications/${encodeURIComponent(id)}`, { status: "rejected" });
}

export async function removeModerator(cityId: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/moderators/${encodeURIComponent(cityId)}`);
}

/* ─────────────────────────── Membership ─────────────────────────── */

export type MembershipPlanDto = {
  id: string;
  name?: string;
  price?: number;
  duration?: string;
  features?: string[];
  subscriberCount?: number;
  status?: string;
  createdAt?: string;
};

export async function fetchMembershipPlans(): Promise<ApiResult<MembershipPlanDto[]>> {
  const res = await apiGet<unknown[]>("/memberships/plans");
  const rows = Array.isArray(res.data) ? res.data : [];
  const items: MembershipPlanDto[] = rows.map((x) => {
    const d = (x ?? {}) as Dict;
    return {
      id: String(readField<string>(d, "id", "Id") || ""),
      name: readField<string>(d, "name", "Name"),
      price: toNumberOrUndefined(readField(d, "price", "Price")),
      duration: readField<string>(d, "duration", "Duration"),
      features: readField<string[]>(d, "features", "Features"),
      subscriberCount: toNumberOrUndefined(readField(d, "subscriberCount", "SubscriberCount")),
      status: readField<string>(d, "status", "Status"),
      createdAt: readField<string>(d, "createdAt", "CreatedAt"),
    };
  });
  return { ...res, data: items };
}

export async function createMembershipPlan(data: {
  name: string;
  price: number;
  duration: string;
  features?: string[];
}): Promise<ApiResult<MembershipPlanDto>> {
  return apiPost<MembershipPlanDto>("/memberships/plans", data);
}

export async function updateMembershipPlan(
  id: string,
  data: { name?: string; price?: number; duration?: string; features?: string[] },
): Promise<ApiResult<MembershipPlanDto>> {
  return apiPut<MembershipPlanDto>(`/memberships/plans/${encodeURIComponent(id)}`, data);
}

export async function deleteMembershipPlan(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/memberships/plans/${encodeURIComponent(id)}`);
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

  const res = await apiGet<unknown>(`/pros-cons?${sp}`);
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
  return apiPut<null>(`/pros-cons/${encodeURIComponent(id)}/hide`, {});
}

export async function deleteProsConsItem(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/pros-cons/${encodeURIComponent(id)}`);
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

  const res = await apiGet<unknown>(`/community/posts?${sp}`);
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

export async function deleteCommunityPost(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/community/posts/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Notifications ─────────────────────────── */

export type NotificationDto = {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  scope?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredCount?: number;
  readCount?: number;
  status?: string;
  createdAt?: string;
};

export async function fetchNotifications(params: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ApiResult<Paginated<NotificationDto>>> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? 20));
  if (params.status) sp.set("status", params.status);

  const res = await apiGet<unknown>(`/notifications?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: NotificationDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    type: readField<string>(d, "type", "Type"),
    title: readField<string>(d, "title", "Title"),
    content: readField<string>(d, "content", "Content"),
    scope: readField<string>(d, "scope", "Scope"),
    scheduledAt: readField<string>(d, "scheduledAt", "ScheduledAt"),
    sentAt: readField<string>(d, "sentAt", "SentAt"),
    deliveredCount: toNumberOrUndefined(readField(d, "deliveredCount", "DeliveredCount")),
    readCount: toNumberOrUndefined(readField(d, "readCount", "ReadCount")),
    status: readField<string>(d, "status", "Status"),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function createNotification(data: {
  type: string;
  title: string;
  content: string;
  scope: string;
  scheduledAt?: string;
}): Promise<ApiResult<NotificationDto>> {
  return apiPost<NotificationDto>("/notifications", data);
}

export async function deleteNotification(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/notifications/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Chat / Conversations ─────────────────────────── */

export type ConversationDto = {
  id: string;
  participants?: { userId: string; userName: string; avatarUrl?: string }[];
  lastMessage?: string;
  unreadCount?: number;
  lastActiveAt?: string;
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

  const res = await apiGet<unknown>(`/conversations?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: ConversationDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    participants: readField(d, "participants", "Participants") as ConversationDto["participants"],
    lastMessage: readField<string>(d, "lastMessage", "LastMessage"),
    unreadCount: toNumberOrUndefined(readField(d, "unreadCount", "UnreadCount")),
    lastActiveAt: readField<string>(d, "lastActiveAt", "LastActiveAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function deleteConversation(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/conversations/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── AI Chat Sessions ─────────────────────────── */

export type AiSessionDto = {
  id: string;
  userId?: string;
  userName?: string;
  lastMessage?: string;
  model?: string;
  tokenUsage?: number;
  createdAt?: string;
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

  const res = await apiGet<unknown>(`/ai-sessions?${sp}`);
  if (!res.ok || !res.data) return { ...res, data: { items: [], totalCount: 0, page: 1, pageSize: 20 } };

  const paged = toPagedDicts(res.data, params.page, params.pageSize);
  const items: AiSessionDto[] = paged.items.map((d) => ({
    id: String(readField<string>(d, "id", "Id") || ""),
    userId: readField<string>(d, "userId", "UserId"),
    userName: readField<string>(d, "userName", "UserName"),
    lastMessage: readField<string>(d, "lastMessage", "LastMessage"),
    model: readField<string>(d, "model", "Model"),
    tokenUsage: toNumberOrUndefined(readField(d, "tokenUsage", "TokenUsage")),
    createdAt: readField<string>(d, "createdAt", "CreatedAt"),
  }));
  return { ...res, data: { ...paged, items } };
}

export async function deleteAiSession(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/ai-sessions/${encodeURIComponent(id)}`);
}

/* ─────────────────────────── Legal Documents ─────────────────────────── */

export type LegalDocumentDto = {
  id: string;
  slug?: string;
  title?: string;
  language?: string;
  version?: string;
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
};

export async function fetchLegalDocuments(): Promise<ApiResult<LegalDocumentDto[]>> {
  const res = await apiGet<unknown>("/users/legal");
  const raw = res.data;
  if (!res.ok || !raw) return { ...res, data: [] };
  const rows = Array.isArray(raw) ? raw : [];
  const items: LegalDocumentDto[] = rows.map((x) => {
    const d = (x ?? {}) as Dict;
    return {
      id: String(readField<string>(d, "id", "Id") || ""),
      slug: readField<string>(d, "slug", "Slug"),
      title: readField<string>(d, "title", "Title"),
      language: readField<string>(d, "language", "Language"),
      version: readField<string>(d, "version", "Version"),
      status: readField<string>(d, "status", "Status"),
      publishedAt: readField<string>(d, "publishedAt", "PublishedAt"),
      updatedAt: readField<string>(d, "updatedAt", "UpdatedAt"),
    };
  });
  return { ...res, data: items };
}
