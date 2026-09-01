export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSpecial?: boolean;
  priority?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
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
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previous: number | null;
  next: number | null;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

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

export const api = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),

  me: () =>
    request<{
      success: boolean;
      data: {
        user: User & { permissionOverrides?: unknown[] };
        permissions: Record<string, Record<string, boolean>>;
      };
    }>("/api/v1/auth/me"),

  listRoles: () =>
    request<{ success: boolean; message: string; data: Role[] }>("/api/v1/roles"),

  listUsers: (page = 1, pageSize = 10, search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    return request<ListResponse<User>>(`/api/v1/users?${params}`);
  },

  createUser: (payload: CreateUserPayload) =>
    request<{ success: boolean; message: string; data: User }>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUser: (id: string, payload: Partial<User>) =>
    request<{ success: boolean; data: User }>(`/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteUser: (id: string) =>
    request<void>(`/api/v1/users/${id}`, { method: "DELETE" }),

  updateProfile: (payload: Partial<User>) =>
    request<{ success: boolean; data: User }>("/api/v1/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
