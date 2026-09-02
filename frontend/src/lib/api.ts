export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ---------- Shared ----------

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  limit?: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  previous: number | null;
  next: number | null;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface ItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------- Auth / Users ----------

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSpecial?: boolean;
  isSystem?: boolean;
  priority?: number;
  permissionKeys?: string[];
  _count?: { users: number };
}

export interface Permission {
  id: string;
  key: string;
  group: string;
  description?: string | null;
}

export type PermissionGroups = Record<string, Permission[]>;

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { teams: number; users: number };
}

export interface DepartmentDetail extends Department {
  teams: { id: string; name: string }[];
}

export interface User {
  id: string;
  name?: string;
  email: string;
  employeeId?: string | null;
  personalEmail?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  gender?: string | null;
  avatarUrl?: string | null;
  role: string | Role;
  designation?: string | null;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  status?: string;
  department?: Department | null;
  departmentId?: string | null;
  isSpecialRole?: boolean;
  specialRoleName?: string | null;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  designation?: string | null;
  roleId: string;
  departmentId?: string | null;
  status?: UserStatus;
  password?: string;
}

export interface UserDraft {
  id: string;
  officialEmail?: string | null;
  currentStep: number;
  stepData: Record<string, unknown>;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface CreateFullUserPayload {
  draftId?: string;
  [key: string]: unknown;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  designation?: string | null;
  roleId?: string;
  departmentId?: string | null;
  status?: UserStatus;
}

// ---------- Teams ----------

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  department?: { id: string; name: string; code: string } | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members: number; projects: number };
}

export interface TeamMemberRow {
  id: string;
  isTeamLead: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string | null;
  };
}

export interface TeamDetail extends Team {
  members: TeamMemberRow[];
}

// ---------- Projects ----------

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export interface Project {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status: ProjectStatus;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members: number; timeLogs: number };
}

export interface ProjectMemberRow {
  id: string;
  projectRole?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string | null;
  };
}

export interface ProjectDetail extends Project {
  members: ProjectMemberRow[];
}

// ---------- Time ----------

export type TimeLogStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TimeLog {
  id: string;
  userId: string;
  projectId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  description?: string | null;
  status: TimeLogStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  project?: { id: string; name: string; code: string | null } | null;
}

export interface CreateTimeLogPayload {
  projectId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  description?: string | null;
}

// ---------- Leave ----------

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  maxDaysPerYear?: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  status: LeaveRequestStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  leaveType?: { id: string; name: string; code: string; isPaid: boolean } | null;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  leaveType?: { id: string; name: string; code: string; isPaid: boolean } | null;
}

export interface LeaveBalanceResponse {
  year: number;
  balances: LeaveBalance[];
}

// ---------- Holidays ----------

export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  isOptional: boolean;
  createdAt?: string;
}

// ---------- Requests / Analytics ----------

export interface RequestLog {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string | null;
  userId?: string | null;
  isSuccess: boolean;
  errorMessage?: string | null;
  createdAt: string;
}

export interface RequestAnalytics {
  period: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  successRate: number;
  avgResponseTimeMs: number;
  countsByMethod: { method: string; _count: { _all: number } }[];
}

// ---------- Client ----------

class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Resolves a backend file url (`/uploads/...`) to an absolute, loadable url. */
export function apiFileUrl(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url) || url.startsWith("data:")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

// In-flight refresh so concurrent 401s share one token rotation round.
let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

function refreshToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function fetchWithRetry(path: string, init?: RequestInit, retried = false): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  // On 401 (except auth endpoints), try to refresh the access token once and retry.
  if (res.status === 401 && !retried && !path.includes("/auth/")) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return fetchWithRetry(path, init, true);
    }
  }

  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithRetry(path, init);

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.message || `Request failed (${res.status})`,
      body?.details
    );
  }
  return body as T;
}

function qs(params: Record<string, string | number | undefined | null>) {
  const url = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.set(k, String(v));
  }
  const s = url.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // ---- Auth ----
  login: (email: string, password: string) =>
    request<ItemResponse<User>>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),

  me: () =>
    request<{
      success: boolean;
      data: {
        user: User;
        permissions: Record<string, Record<string, boolean>>;
      };
    }>("/api/v1/auth/me"),

  // ---- Users ----
  listUsers: (page = 1, pageSize = 10, search = "") =>
    request<ListResponse<User>>(
      `/api/v1/users${qs({ page, pageSize, search })}`
    ),

  getUser: (id: string) =>
    request<ItemResponse<User>>(`/api/v1/users/${id}`),

  createUser: (payload: CreateUserPayload) =>
    request<ItemResponse<User>>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createFullUser: (payload: CreateFullUserPayload) =>
    request<ItemResponse<User>>("/api/v1/users/full", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveUserDraft: (payload: { draftId?: string; officialEmail?: string; currentStep: number; stepData: object }) =>
    request<ItemResponse<UserDraft>>("/api/v1/users/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUserDraft: (draftId: string) =>
    request<ItemResponse<UserDraft>>(
      `/api/v1/users/draft/${draftId}`
    ),

  deleteUserDraft: (draftId: string) =>
    request<void>(`/api/v1/users/draft/${draftId}`, { method: "DELETE" }),

  listUserDrafts: () =>
    request<ListResponse<UserDraft>>("/api/v1/users/drafts"),

  uploadFile: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    const res = await fetch(`${API_BASE}/api/v1/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.message || "File upload failed");
    }
    return res.json() as Promise<ItemResponse<{ url: string; filename: string }>>;
  },

  updateUserStatus: (id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED") =>
    request<ItemResponse<User>>(`/api/v1/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  resetUserPassword: (id: string, newPassword?: string) =>
    request<ItemResponse<{ temporaryPassword: string }>>(`/api/v1/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),

  updateUser: (id: string, payload: UpdateUserPayload) =>
    request<ItemResponse<User>>(`/api/v1/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),


  deleteUser: (id: string) =>
    request<void>(`/api/v1/users/${id}`, { method: "DELETE" }),

  updateProfile: (payload: Partial<User>) =>
    request<ItemResponse<User>>("/api/v1/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // ---- Roles & Permissions ----
  listRoles: () => request<ItemResponse<Role[]>>("/api/v1/roles"),

  getRole: (id: string) =>
    request<ItemResponse<Role>>(`/api/v1/roles/${id}`),

  listPermissions: () =>
    request<ItemResponse<PermissionGroups>>("/api/v1/roles/permissions"),

  createRole: (payload: {
    name: string;
    displayName: string;
    description?: string | null;
    priority: number;
  }) =>
    request<ItemResponse<Role>>("/api/v1/roles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateRole: (
    id: string,
    payload: {
      displayName?: string;
      description?: string | null;
      priority?: number;
    }
  ) =>
    request<ItemResponse<Role>>(`/api/v1/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteRole: (id: string) =>
    request<void>(`/api/v1/roles/${id}`, { method: "DELETE" }),

  setRolePermissions: (id: string, permissionKeys: string[]) =>
    request<ItemResponse<Role>>(`/api/v1/roles/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissionKeys }),
    }),

  exportRoles: () => `${API_BASE}/api/v1/roles/export`,


  // ---- Departments ----
  listDepartments: (page = 1, pageSize = 10, search = "") =>
    request<ListResponse<Department>>(
      `/api/v1/departments${qs({ page, pageSize, search })}`
    ),

  createDepartment: (payload: {
    name: string;
    code: string;
    description?: string | null;
  }) =>
    request<ItemResponse<Department>>("/api/v1/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateDepartment: (
    id: string,
    payload: { name?: string; description?: string | null }
  ) =>
    request<ItemResponse<Department>>(`/api/v1/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (id: string) =>
    request<void>(`/api/v1/departments/${id}`, { method: "DELETE" }),

  // ---- Teams ----
  listTeams: (page = 1, pageSize = 10, search = "") =>
    request<ListResponse<Team>>(`/api/v1/teams${qs({ page, pageSize, search })}`),

  getTeam: (id: string) =>
    request<ItemResponse<TeamDetail>>(`/api/v1/teams/${id}`),

  createTeam: (payload: {
    name: string;
    description?: string | null;
    departmentId: string;
  }) =>
    request<ItemResponse<Team>>("/api/v1/teams", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTeam: (
    id: string,
    payload: { name?: string; description?: string | null; departmentId?: string }
  ) =>
    request<ItemResponse<Team>>(`/api/v1/teams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteTeam: (id: string) =>
    request<void>(`/api/v1/teams/${id}`, { method: "DELETE" }),

  addTeamMember: (payload: {
    teamId: string;
    userId: string;
    isTeamLead?: boolean;
  }) =>
    request<ItemResponse<TeamMemberRow>>("/api/v1/teams/members", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTeamMember: (
    teamId: string,
    userId: string,
    payload: { isTeamLead?: boolean }
  ) =>
    request<ItemResponse<TeamMemberRow>>(
      `/api/v1/teams/${teamId}/members/${userId}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    ),

  removeTeamMember: (teamId: string, userId: string) =>
    request<void>(`/api/v1/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    }),

  // ---- Projects ----
  listProjects: (
    page = 1,
    pageSize = 10,
    search = "",
    status?: ProjectStatus,
    teamId?: string
  ) =>
    request<ListResponse<Project>>(
      `/api/v1/projects${qs({ page, pageSize, search, status, teamId })}`
    ),

  getProject: (id: string) =>
    request<ItemResponse<ProjectDetail>>(`/api/v1/projects/${id}`),

  createProject: (payload: {
    name: string;
    code?: string | null;
    description?: string | null;
    status?: ProjectStatus;
    teamId?: string | null;
  }) =>
    request<ItemResponse<Project>>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (
    id: string,
    payload: {
      name?: string;
      code?: string | null;
      description?: string | null;
      status?: ProjectStatus;
      teamId?: string | null;
    }
  ) =>
    request<ItemResponse<Project>>(`/api/v1/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteProject: (id: string) =>
    request<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),

  addProjectMember: (payload: {
    projectId: string;
    userId: string;
    projectRole?: string | null;
  }) =>
    request<ItemResponse<ProjectMemberRow>>("/api/v1/projects/members", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProjectMember: (
    projectId: string,
    userId: string,
    payload: { projectRole?: string | null }
  ) =>
    request<ItemResponse<ProjectMemberRow>>(
      `/api/v1/projects/${projectId}/members/${userId}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    ),

  removeProjectMember: (projectId: string, userId: string) =>
    request<void>(`/api/v1/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    }),

  // ---- Time ----
  listMyTimeLogs: (page = 1, pageSize = 10) =>
    request<ListResponse<TimeLog>>(`/api/v1/time/my${qs({ page, pageSize })}`),

  listTimeLogs: (
    page = 1,
    pageSize = 10,
    opts: { userId?: string; projectId?: string; status?: TimeLogStatus } = {}
  ) =>
    request<ListResponse<TimeLog>>(
      `/api/v1/time${qs({ page, pageSize, ...opts })}`
    ),

  createTimeLog: (payload: CreateTimeLogPayload) =>
    request<ItemResponse<TimeLog>>("/api/v1/time", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTimeLog: (id: string, payload: Partial<CreateTimeLogPayload>) =>
    request<ItemResponse<TimeLog>>(`/api/v1/time/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  approveTimeLog: (id: string, status: "APPROVED" | "REJECTED") =>
    request<ItemResponse<TimeLog>>(`/api/v1/time/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  deleteTimeLog: (id: string) =>
    request<void>(`/api/v1/time/${id}`, { method: "DELETE" }),

  // ---- Leave ----
  listLeaveTypes: (page = 1, pageSize = 10, search = "") =>
    request<ListResponse<LeaveType>>(
      `/api/v1/leave/types${qs({ page, pageSize, search })}`
    ),

  createLeaveType: (payload: {
    name: string;
    code: string;
    maxDaysPerYear?: number | null;
    isPaid: boolean;
  }) =>
    request<ItemResponse<LeaveType>>("/api/v1/leave/types", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateLeaveType: (
    id: string,
    payload: { name?: string; maxDaysPerYear?: number | null; isPaid?: boolean }
  ) =>
    request<ItemResponse<LeaveType>>(`/api/v1/leave/types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteLeaveType: (id: string) =>
    request<void>(`/api/v1/leave/types/${id}`, { method: "DELETE" }),

  listMyLeaveRequests: (page = 1, pageSize = 10) =>
    request<ListResponse<LeaveRequest>>(
      `/api/v1/leave/requests/my${qs({ page, pageSize })}`
    ),

  listLeaveRequests: (
    page = 1,
    pageSize = 10,
    opts: { userId?: string; leaveTypeId?: string; status?: LeaveRequestStatus } = {}
  ) =>
    request<ListResponse<LeaveRequest>>(
      `/api/v1/leave/requests${qs({ page, pageSize, ...opts })}`
    ),

  createLeaveRequest: (payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string | null;
  }) =>
    request<ItemResponse<LeaveRequest>>("/api/v1/leave/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approveLeaveRequest: (
    id: string,
    status: "APPROVED" | "REJECTED",
    reason?: string | null
  ) =>
    request<ItemResponse<LeaveRequest>>(`/api/v1/leave/requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ status, reason }),
    }),

  cancelLeaveRequest: (id: string) =>
    request<ItemResponse<LeaveRequest>>(`/api/v1/leave/requests/${id}/cancel`, {
      method: "POST",
    }),

  getLeaveBalance: (year?: number) =>
    request<ItemResponse<LeaveBalanceResponse>>(
      `/api/v1/leave/balance${qs({ year })}`
    ),

  getUserLeaveBalance: (userId: string, year?: number) =>
    request<ItemResponse<LeaveBalanceResponse>>(
      `/api/v1/leave/balance/${userId}${qs({ year })}`
    ),

  allocateLeave: (payload: {
    userId: string;
    leaveTypeId: string;
    year: number;
    allocated: number;
  }) =>
    request<ItemResponse<LeaveBalance>>("/api/v1/leave/allocate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateLeaveBalance: (id: string, payload: { allocated: number }) =>
    request<ItemResponse<LeaveBalance>>(`/api/v1/leave/balances/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // ---- Holidays ----
  listHolidays: (page = 1, pageSize = 10, year?: number, search = "") =>
    request<ListResponse<Holiday>>(
      `/api/v1/holidays${qs({ page, pageSize, year, search })}`
    ),

  createHoliday: (payload: { name: string; date: string; isOptional?: boolean }) =>
    request<ItemResponse<Holiday>>("/api/v1/holidays", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateHoliday: (
    id: string,
    payload: { name?: string; date?: string; isOptional?: boolean }
  ) =>
    request<ItemResponse<Holiday>>(`/api/v1/holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteHoliday: (id: string) =>
    request<void>(`/api/v1/holidays/${id}`, { method: "DELETE" }),

  // ---- Request logs / analytics ----
  listRequestLogs: (
    page = 1,
    limit = 20,
    opts: { userId?: string; statusCode?: number; method?: string } = {}
  ) =>
    request<ListResponse<RequestLog>>(
      `/api/v1/requests${qs({ page, limit, ...opts })}`
    ),

  requestAnalytics: () =>
    request<ItemResponse<RequestAnalytics>>("/api/v1/requests/analytics"),
};

export { ApiError };