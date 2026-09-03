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
  // --- Rich detail (fetched via getUser) ---
  profile?: {
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    maritalStatus?: string | null;
    nationality?: string | null;
    aadhaarNumber?: string | null;
    panNumber?: string | null;
    currentAddress?: Record<string, unknown> | null;
    permanentAddress?: Record<string, unknown> | null;
    sameAsCurrentAddress?: boolean;
    emergencyContactName?: string | null;
    emergencyContactRelation?: string | null;
    emergencyContactPhone?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
  } | null;
  currentEmployment?: {
    designation?: string | null;
    employmentType?: string | null;
    workMode?: string | null;
    workLocation?: string | null;
    ctc?: number | null;
    probationPeriodMonths?: number | null;
    noticePeriodDays?: number | null;
    shiftTiming?: string | null;
    skills?: string[];
    about?: string | null;
    reportingManagerId?: string | null;
    projectManagerId?: string | null;
  } | null;
  importantDates?: {
    interviewDate?: string | null;
    offerDate?: string | null;
    joiningDate?: string | null;
    probationEndDate?: string | null;
    confirmationDate?: string | null;
    resignDate?: string | null;
    lastWorkingDay?: string | null;
    fullAndFinalDate?: string | null;
  } | null;
  previousEmployments?: Array<{
    companyName: string;
    designation?: string | null;
    employmentType?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    lastDrawnSalary?: number | null;
    reasonForLeaving?: string | null;
    hrContactName?: string | null;
    hrContactPhone?: string | null;
    hrContactEmail?: string | null;
    experienceLetterUrl?: string | null;
    relievingLetterUrl?: string | null;
  }> | null;
  teamMembers?: Array<{
    teamId: string;
    isTeamLead?: boolean;
  }> | null;
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

// ---------- Projects & Tasks ----------

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MilestoneStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

export type ProjectMemberRole = "MEMBER" | "LEAD" | "PROJECT_MANAGER" | "VIEWER";

export interface ProjectUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  designation?: string | null;
}

export interface Project {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string | null;
  endDate?: string | null;
  actualEndDate?: string | null;
  progress?: number;
  departmentId?: string | null;
  primaryTeamId?: string | null;
  projectManagerId?: string | null;
  createdById?: string | null;
  budget?: number | null;
  clientName?: string | null;
  isBillable?: boolean;
  category?: string | null;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
  department?: { id: string; name: string; code: string } | null;
  primaryTeam?: { id: string; name: string } | null;
  projectManager?: ProjectUserSummary | null;
  createdBy?: ProjectUserSummary | null;
  members?: ProjectMemberRow[];
  _count?: {
    members?: number;
    tasks?: number;
    milestones?: number;
    files?: number;
    timeLogs?: number;
  };
}

export interface ProjectMemberRow {
  id: string;
  roleInProject?: ProjectMemberRole | string;
  joinedAt?: string;
  user: ProjectUserSummary;
}

export interface Task {
  id: string;
  projectId: string;
  taskCode?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  reporterId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  parentTaskId?: string | null;
  order?: number;
  labels?: string[] | null;
  isCompleted?: boolean;
  assignee?: ProjectUserSummary | null;
  reporter?: ProjectUserSummary | null;
  subtasks?: Array<{
    id: string;
    title: string;
    isCompleted?: boolean;
    assignee?: ProjectUserSummary | null;
  }>;
  _count?: { comments: number };
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  status: MilestoneStatus;
  progress: number;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  taskId?: string | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: ProjectUserSummary | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  reactions?: Record<string, unknown> | null;
  createdAt: string;
  user: ProjectUserSummary;
}

export interface ProjectDetail extends Project {
  members: ProjectMemberRow[];
  tasks: Task[];
  milestones: Milestone[];
  activities: ProjectActivity[];
  files: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType?: string | null;
    size?: number | null;
    uploadedAt: string;
    uploadedBy?: ProjectUserSummary | null;
  }>;
}

// ---------- Time ----------

export type TimeLogStatus = "DRAFT" | "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface TimeLog {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  hours: number;
  durationMin: number;
  isBillable: boolean;
  isOvertime: boolean;
  description?: string | null;
  rejectionReason?: string | null;
  status: TimeLogStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
  };
  project?: { id: string; name: string; code: string | null } | null;
  task?: { id: string; title: string } | null;
}

export interface CreateTimeLogPayload {
  projectId?: string | null;
  taskId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  hours: number;
  isBillable?: boolean;
  isOvertime?: boolean;
  description?: string | null;
  status?: "DRAFT" | "SUBMITTED";
}

export interface ActiveTimerData {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  description?: string | null;
  mode: "countdown" | "stopwatch" | string;
  targetSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastStartedAt?: string | null;
  updatedAt: string;
}

export interface TimesheetSummary {
  totalHours: number;
  billableHours: number;
  pendingHours: number;
  overtimeHours: number;
  totalEntries: number;
}

export interface TimesheetReports {
  hoursPerProject: Array<{
    id: string;
    name: string;
    code: string;
    totalHours: number;
  }>;
  billableRatio: {
    billableHours: number;
    nonBillableHours: number;
    billablePercentage: number;
  };
  employeeUtilization: Array<{
    id: string;
    name: string;
    department: string;
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
  }>;
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
  isHalfDay?: boolean;
  halfDaySession?: "FIRST_HALF" | "SECOND_HALF" | null;
  tlApprovalStatus?: string;
  pmApprovalStatus?: string;
  hrApprovalStatus?: string;
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

export type HolidayType = "NATIONAL" | "RESTRICTED" | "COMPANY";

export interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  type: HolidayType;
  isOptional: boolean;
  description?: string | null;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---------- Announcements ----------
export type AnnouncementCategory = "GENERAL" | "HR" | "EVENTS" | "IT_INFRA" | "URGENT";
export type AnnouncementStatus = "ACTIVE" | "EXPIRED" | "DRAFT";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: "NORMAL" | "HIGH" | "URGENT";
  isPinned: boolean;
  status: AnnouncementStatus;
  publishDate: string;
  expiryDate?: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
  };
}

// ---------- Company Policies ----------
export type PolicyCategory = "HR" | "IT" | "FINANCE" | "SECURITY" | "GENERAL";

export interface CompanyPolicy {
  id: string;
  title: string;
  code?: string | null;
  category: PolicyCategory;
  version: string;
  content: string;
  fileUrl?: string | null;
  isMandatory: boolean;
  effectiveDate: string;
  authorId: string;
  isAcknowledged?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
  };
  _count?: { acknowledgments: number };
}

// ---------- Support Tickets ----------
export type TicketCategory = "IT_HARDWARE" | "IT_SOFTWARE" | "HR_QUERY" | "PAYROLL" | "ACCESS_REQUEST" | "GENERAL";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  attachments?: any;
  creatorId: string;
  assigneeId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    department?: { id: string; name: string } | null;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  comments?: Array<{
    id: string;
    content: string;
    isInternalNote: boolean;
    createdAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string | null;
    };
  }>;
  _count?: { comments: number };
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
  clientErrorRequests?: number;
  serverErrorRequests?: number;
  successRate: number;
  errorRate?: number;
  avgResponseTimeMs: number;
  maxResponseTimeMs?: number;
  minResponseTimeMs?: number;
  countsByMethod: { method: string; count: number; _count?: { _all: number } }[];
  topSlowEndpoints?: { url: string; avgLatencyMs: number; count: number }[];
  topActiveIps?: { ipAddress: string; count: number }[];
  statusDistribution?: {
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
  };
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
    } else {
      // If refresh also fails (e.g. database reset or expired refresh token), redirect to login
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
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

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  const query = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)])
  ).toString();
  return `?${query}`;
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

  updateFullUser: (id: string, payload: Omit<CreateFullUserPayload, "draftId">) =>
    request<ItemResponse<User>>(`/api/v1/users/full/${id}`, {
      method: "PUT",
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
    if (folder) formData.append("folder", folder);
    formData.append("file", file);
    const folderParam = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    const res = await fetch(`${API_BASE}/api/v1/upload${folderParam}`, {
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
    request<ItemResponse<{ sent: boolean }>>(`/api/v1/users/${id}/reset-password`, {
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

  // ---- Profile ----
  getProfile: () =>
    request<ItemResponse<User>>("/api/v1/profile"),

  updateProfileBasic: (payload: {
    firstName: string;
    lastName: string;
    personalEmail?: string;
    mobile?: string;
    alternateMobile?: string;
    gender?: string;
    dateOfBirth?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  }) =>
    request<ItemResponse<User>>("/api/v1/profile/basic", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateProfileAddress: (payload: {
    currentAddress?: Record<string, unknown>;
    permanentAddress?: Record<string, unknown>;
    sameAsCurrentAddress?: boolean;
  }) =>
    request<ItemResponse<User>>("/api/v1/profile/address", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateProfileEmergency: (payload: {
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
  }) =>
    request<ItemResponse<User>>("/api/v1/profile/emergency", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateProfilePicture: (avatarUrl: string) =>
    request<ItemResponse<User>>("/api/v1/profile/picture", {
      method: "PUT",
      body: JSON.stringify({ avatarUrl }),
    }),

  changeProfilePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) =>
    request<ItemResponse<{ message: string }>>("/api/v1/profile/password", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

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

  // ---- Projects & Tasks ----
  listProjects: (
    page = 1,
    pageSize = 10,
    search = "",
    status?: ProjectStatus,
    priority?: ProjectPriority,
    departmentId?: string,
    primaryTeamId?: string,
    projectManagerId?: string,
    memberOnly?: boolean
  ) =>
    request<ListResponse<Project>>(
      `/api/v1/projects${qs({
        page,
        pageSize,
        search,
        status,
        priority,
        departmentId,
        primaryTeamId,
        projectManagerId,
        memberOnly: memberOnly ? "true" : undefined,
      })}`
    ),

  getProject: (id: string) =>
    request<ItemResponse<ProjectDetail>>(`/api/v1/projects/${id}`),

  createProject: (payload: {
    name: string;
    code?: string | null;
    description?: string | null;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    startDate?: string | null;
    endDate?: string | null;
    departmentId?: string | null;
    primaryTeamId?: string | null;
    projectManagerId?: string | null;
    budget?: number | null;
    clientName?: string | null;
    isBillable?: boolean;
    category?: string | null;
    visibility?: string;
    initialMembers?: Array<{ userId: string; roleInProject: string }>;
    initialMilestones?: Array<{ title: string; description?: string | null; dueDate?: string | null }>;
  }) =>
    request<ItemResponse<Project>>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (
    id: string,
    payload: Record<string, unknown>
  ) =>
    request<ItemResponse<Project>>(`/api/v1/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteProject: (id: string) =>
    request<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),

  addProjectMember: (
    projectId: string,
    payload: { userId: string; roleInProject?: string }
  ) =>
    request<ItemResponse<ProjectMemberRow>>(`/api/v1/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  removeProjectMember: (projectId: string, userId: string) =>
    request<void>(`/api/v1/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    }),

  listTasks: (projectId: string) =>
    request<ItemResponse<Task[]>>(`/api/v1/projects/${projectId}/tasks`),

  createTask: (
    projectId: string,
    payload: {
      title: string;
      description?: string | null;
      taskCode?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      dueDate?: string | null;
      startDate?: string | null;
      estimatedHours?: number | null;
      parentTaskId?: string | null;
      labels?: string[] | null;
    }
  ) =>
    request<ItemResponse<Task>>(`/api/v1/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTaskStatus: (taskId: string, status: TaskStatus) =>
    request<ItemResponse<Task>>(`/api/v1/projects/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateTask: (taskId: string, payload: Record<string, unknown>) =>
    request<ItemResponse<Task>>(`/api/v1/projects/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteTask: (taskId: string) =>
    request<void>(`/api/v1/projects/tasks/${taskId}`, {
      method: "DELETE",
    }),

  createMilestone: (
    projectId: string,
    payload: { title: string; description?: string | null; dueDate?: string | null; status?: MilestoneStatus }
  ) =>
    request<ItemResponse<Milestone>>(`/api/v1/projects/${projectId}/milestones`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateMilestone: (milestoneId: string, payload: Record<string, unknown>) =>
    request<ItemResponse<Milestone>>(`/api/v1/projects/milestones/${milestoneId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getTaskComments: (taskId: string) =>
    request<ItemResponse<TaskComment[]>>(`/api/v1/projects/tasks/${taskId}/comments`),

  addComment: (taskId: string, content: string) =>
    request<ItemResponse<TaskComment>>(`/api/v1/projects/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
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

  // ---- Time ----
  listMyTimeLogs: (page = 1, pageSize = 20, opts: { from?: string; to?: string; status?: string } = {}) =>
    request<ListResponse<TimeLog>>(`/api/v1/time/my${qs({ page, pageSize, ...opts })}`),

  listTimeLogs: (
    page = 1,
    pageSize = 20,
    opts: { userId?: string; projectId?: string; taskId?: string; status?: string; from?: string; to?: string } = {}
  ) =>
    request<ListResponse<TimeLog>>(
      `/api/v1/time${qs({ page, pageSize, ...opts })}`
    ),

  getMyTimesheetSummary: (from?: string, to?: string) =>
    request<ItemResponse<TimesheetSummary>>(`/api/v1/time/summary${qs({ from, to })}`),

  createTimeLog: (payload: CreateTimeLogPayload) =>
    request<ItemResponse<TimeLog>>("/api/v1/time", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTimeLog: (id: string, payload: Partial<CreateTimeLogPayload> & { status?: TimeLogStatus; rejectionReason?: string | null }) =>
    request<ItemResponse<TimeLog>>(`/api/v1/time/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  submitWeekTimesheet: (from?: string, to?: string) =>
    request<{ submittedCount: number }>("/api/v1/time/submit-week", {
      method: "POST",
      body: JSON.stringify({ from, to }),
    }),

  approveTimeLog: (id: string, status: "APPROVED" | "REJECTED", rejectionReason?: string | null) =>
    request<ItemResponse<TimeLog>>(`/api/v1/time/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ status, rejectionReason }),
    }),

  bulkApproveTimeLogs: (ids: string[], status: "APPROVED" | "REJECTED", rejectionReason?: string | null) =>
    request<{ updatedCount: number; status: string }>("/api/v1/time/bulk-approve", {
      method: "POST",
      body: JSON.stringify({ ids, status, rejectionReason }),
    }),

  getTimesheetReports: (from?: string, to?: string) =>
    request<ItemResponse<TimesheetReports>>(`/api/v1/time/reports${qs({ from, to })}`),

  // ---- Active Timer (Database Persisted) ----
  getActiveTimer: () =>
    request<ItemResponse<ActiveTimerData | null>>("/api/v1/time/active-timer"),

  syncActiveTimer: (payload: {
    projectId?: string | null;
    taskId?: string | null;
    description?: string | null;
    mode?: string;
    targetSeconds?: number;
    elapsedSeconds?: number;
    remainingSeconds?: number;
    isRunning: boolean;
  }) =>
    request<ItemResponse<ActiveTimerData>>("/api/v1/time/active-timer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  clearActiveTimer: () =>
    request<void>("/api/v1/time/active-timer", { method: "DELETE" }),

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
    isHalfDay?: boolean;
    halfDaySession?: "FIRST_HALF" | "SECOND_HALF";
    targetUserId?: string;
  }) =>
    request<ItemResponse<LeaveRequest>>("/api/v1/leave/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateLeaveRequest: (id: string, payload: Partial<LeaveRequest>) =>
    request<ItemResponse<LeaveRequest>>(`/api/v1/leave/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  approveLeaveRequest: (
    id: string,
    status: "APPROVED" | "REJECTED",
    approvalRole: "TL" | "PM" | "HR" = "HR",
    reason?: string | null
  ) =>
    request<ItemResponse<LeaveRequest>>(`/api/v1/leave/requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ status, approvalRole, reason }),
    }),

  cancelLeaveRequest: (id: string) =>
    request<ItemResponse<LeaveRequest>>(`/api/v1/leave/requests/${id}/cancel`, {
      method: "POST",
    }),

  getLeaveLogs: (id: string) =>
    request<ItemResponse<ApprovalLogItem[]>>(`/api/v1/leave/requests/${id}/logs`),

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
  listHolidays: (page = 1, pageSize = 50, year?: number, search = "", type?: HolidayType) =>
    request<ListResponse<Holiday>>(
      `/api/v1/holidays${qs({ page, pageSize, year, search, type })}`
    ),

  getWorkingDaysConfig: () =>
    request<ItemResponse<{ workingDaysPerWeek: number; lastSaturdayWorking: boolean }>>(
      "/api/v1/holidays/working-days-config"
    ),

  getUpcomingHolidays: () =>
    request<ItemResponse<Holiday[]>>("/api/v1/holidays/upcoming"),

  createHoliday: (payload: { name: string; date: string; type?: HolidayType; isOptional?: boolean; description?: string | null }) =>
    request<ItemResponse<Holiday>>("/api/v1/holidays", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateHoliday: (
    id: string,
    payload: { name?: string; date?: string; type?: HolidayType; isOptional?: boolean; description?: string | null }
  ) =>
    request<ItemResponse<Holiday>>(`/api/v1/holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteHoliday: (id: string) =>
    request<void>(`/api/v1/holidays/${id}`, { method: "DELETE" }),

  importHolidaysCsv: (holidays: Array<{ name: string; date: string; type?: HolidayType; isOptional?: boolean; description?: string | null }>) =>
    request<ItemResponse<{ importedCount: number; failedCount: number; invalidRows: Array<{ row: number; data: any; reason: string }> }>>("/api/v1/holidays/import", {
      method: "POST",
      body: JSON.stringify({ holidays }),
    }),

  // ---- Request logs / analytics ----
  listRequestLogs: (
    page = 1,
    limit = 20,
    opts: { userId?: string; statusCode?: number; method?: string } = {}
  ) =>
    request<ListResponse<RequestLog>>(
      `/api/v1/requests${qs({ page, limit, ...opts })}`
    ),

  getRequestLog: (id: string) =>
    request<ItemResponse<RequestLog>>(`/api/v1/requests/${id}`),

  requestAnalytics: () =>
    request<ItemResponse<RequestAnalytics>>("/api/v1/requests/analytics"),

  // ---- Announcements ----
  listAnnouncements: (page = 1, pageSize = 20, opts: { search?: string; category?: AnnouncementCategory; status?: AnnouncementStatus } = {}) =>
    request<ListResponse<Announcement>>(`/api/v1/announcements${qs({ page, pageSize, ...opts })}`),

  getAnnouncement: (id: string) =>
    request<ItemResponse<Announcement>>(`/api/v1/announcements/${id}`),

  createAnnouncement: (payload: { title: string; content: string; category?: AnnouncementCategory; priority?: "NORMAL" | "HIGH" | "URGENT"; isPinned?: boolean; status?: AnnouncementStatus; expiryDate?: string | null }) =>
    request<ItemResponse<Announcement>>("/api/v1/announcements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateAnnouncement: (id: string, payload: Partial<{ title: string; content: string; category: AnnouncementCategory; priority: "NORMAL" | "HIGH" | "URGENT"; isPinned: boolean; status: AnnouncementStatus; expiryDate: string | null }>) =>
    request<ItemResponse<Announcement>>(`/api/v1/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteAnnouncement: (id: string) =>
    request<void>(`/api/v1/announcements/${id}`, { method: "DELETE" }),

  // ---- Company Policies ----
  listPolicies: (page = 1, pageSize = 20, opts: { search?: string; category?: PolicyCategory } = {}) =>
    request<ListResponse<CompanyPolicy>>(`/api/v1/policies${qs({ page, pageSize, ...opts })}`),

  getPolicy: (id: string) =>
    request<ItemResponse<CompanyPolicy>>(`/api/v1/policies/${id}`),

  createPolicy: (payload: { title: string; code?: string | null; category?: PolicyCategory; version?: string; content: string; fileUrl?: string | null; isMandatory?: boolean }) =>
    request<ItemResponse<CompanyPolicy>>("/api/v1/policies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePolicy: (id: string, payload: Partial<{ title: string; code: string | null; category: PolicyCategory; version: string; content: string; fileUrl: string | null; isMandatory: boolean }>) =>
    request<ItemResponse<CompanyPolicy>>(`/api/v1/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  acknowledgePolicy: (id: string) =>
    request<void>(`/api/v1/policies/${id}/acknowledge`, { method: "POST" }),

  deletePolicy: (id: string) =>
    request<void>(`/api/v1/policies/${id}`, { method: "DELETE" }),

  // ---- Support Tickets ----
  listSupportTickets: (page = 1, pageSize = 20, opts: { search?: string; category?: TicketCategory; priority?: TicketPriority; status?: TicketStatus; scope?: "my" | "admin" } = {}) =>
    request<ListResponse<SupportTicket>>(`/api/v1/support${qs({ page, pageSize, ...opts })}`),

  getSupportTicket: (id: string) =>
    request<ItemResponse<SupportTicket>>(`/api/v1/support/${id}`),

  createSupportTicket: (payload: { subject: string; category: TicketCategory; priority: TicketPriority; description: string }) =>
    request<ItemResponse<SupportTicket>>("/api/v1/support", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateSupportTicket: (id: string, payload: Partial<{ subject: string; category: TicketCategory; priority: TicketPriority; status: TicketStatus; assigneeId: string | null; description: string }>) =>
    request<ItemResponse<SupportTicket>>(`/api/v1/support/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  addTicketComment: (id: string, payload: { content: string; isInternalNote?: boolean }) =>
    request<ItemResponse<{ id: string; content: string; createdAt: string }>>(`/api/v1/support/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteSupportTicket: (id: string) =>
    request<void>(`/api/v1/support/${id}`, { method: "DELETE" }),

  // ---- Notifications ----
  listNotifications: (page = 1, pageSize = 20, unread = false) =>
    request<ListResponse<NotificationItem> & { unreadCount: number }>(
      `/api/v1/notifications${qs({ page, pageSize, unread })}`
    ),

  getNotificationUnreadCount: () =>
    request<ItemResponse<{ unreadCount: number }>>("/api/v1/notifications/unread-count"),

  markNotificationRead: (id: string) =>
    request<ItemResponse<NotificationItem>>(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request<ItemResponse<void>>("/api/v1/notifications/read-all", {
      method: "PATCH",
    }),

  deleteNotification: (id: string) =>
    request<void>(`/api/v1/notifications/${id}`, { method: "DELETE" }),

  clearAllNotifications: () =>
    request<void>("/api/v1/notifications/clear-all", { method: "DELETE" }),

  getNotificationPreferences: () =>
    request<ItemResponse<NotificationPreference>>("/api/v1/notifications/preferences"),

  updateNotificationPreferences: (payload: Partial<NotificationPreference>) =>
    request<ItemResponse<NotificationPreference>>("/api/v1/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  savePushSubscription: (subscription: any) =>
    request<ItemResponse<void>>("/api/v1/notifications/push-subscribe", {
      method: "POST",
      body: JSON.stringify({ subscription }),
    }),

  // ---- WFH (Work From Home) ----
  applyWFH: (payload: { startDate: string; endDate: string; days?: number; reason: string; attachmentUrl?: string | null }) =>
    request<ItemResponse<WFHRequest>>("/api/v1/wfh", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listMyWFH: (page = 1, pageSize = 20, status?: string) =>
    request<ListResponse<WFHRequest>>(`/api/v1/wfh/my${qs({ page, pageSize, status })}`),

  listWFHApprovals: (opts: { status?: string; search?: string; departmentId?: string } = {}) =>
    request<ItemResponse<WFHRequest[]>>(`/api/v1/wfh/approvals${qs(opts)}`),

  approveWFH: (id: string, comment?: string) =>
    request<ItemResponse<WFHRequest>>(`/api/v1/wfh/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  rejectWFH: (id: string, reason: string) =>
    request<ItemResponse<WFHRequest>>(`/api/v1/wfh/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  cancelWFH: (id: string) =>
    request<ItemResponse<WFHRequest>>(`/api/v1/wfh/${id}/cancel`, {
      method: "POST",
    }),

  getWFHLogs: (id: string) =>
    request<ItemResponse<ApprovalLogItem[]>>(`/api/v1/wfh/${id}/logs`),
};

export interface WFHRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  attachmentUrl?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    designation?: string | null;
    department?: { id: string; name: string; code: string } | null;
    role?: { id: string; name: string; displayName: string } | null;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ApprovalLogItem {
  id: string;
  module: "WFH" | "LEAVE" | "TIMESHEET";
  referenceId: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  performedById: string;
  comment?: string | null;
  createdAt: string;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    designation?: string | null;
    role?: { name: string; displayName: string } | null;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "leave" | "timesheet" | "project" | "task" | "attendance" | "user" | "support" | "system" | "wfh" | string;
  referenceId?: string | null;
  link?: string | null;
  isRead: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailLeaves: boolean;
  emailTimesheet: boolean;
  emailProjects: boolean;
  emailSupport: boolean;
  pushLeaves: boolean;
  pushTimesheet: boolean;
  pushProjects: boolean;
  pushSupport: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export { ApiError };