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
