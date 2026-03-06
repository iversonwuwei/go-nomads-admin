type Dict = Record<string, unknown>;

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

function getApiBase(): string {
  return process.env.API_BASE || "https://api.go-nomads.com/api/v1";
}

function getAuthToken(): string | undefined {
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
  const token = getAuthToken();
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
