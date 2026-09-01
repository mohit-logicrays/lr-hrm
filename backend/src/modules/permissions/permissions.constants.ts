export const PERMISSIONS = {
  // Auth
  AUTH_LOGOUT: "auth:logout",

  // Users
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_ASSIGN_ROLE: "user:assign_role",
  USER_MANAGE: "user:manage",

  // Roles & Permissions
  ROLE_READ: "role:read",
  ROLE_MANAGE: "role:manage",
  PERMISSION_READ: "permission:read",
  PERMISSION_MANAGE: "permission:manage",

  // Departments
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_READ: "department:read",
  DEPARTMENT_UPDATE: "department:update",
  DEPARTMENT_DELETE: "department:delete",

  // Teams
  TEAM_CREATE: "team:create",
  TEAM_READ: "team:read",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TEAM_MANAGE_MEMBERS: "team:manage_members",
  TEAM_MANAGE_LEADS: "team:manage_leads",

  // Projects
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_MANAGE_MEMBERS: "project:manage_members",
  PROJECT_ALL: "project:all",

  // Time
  TIME_LOG_CREATE: "time:log",
  TIME_LOG_READ_OWN: "time:read_own",
  TIME_LOG_READ_ALL: "time:read_all",
  TIME_LOG_APPROVE: "time:approve",
  TIME_LOG_MANAGE: "time:manage",

  // Leave
  LEAVE_TYPE_READ: "leave:type_read",
  LEAVE_TYPE_MANAGE: "leave:type_manage",
  LEAVE_REQUEST_CREATE: "leave:request",
  LEAVE_REQUEST_READ_OWN: "leave:read_own",
  LEAVE_REQUEST_READ_ALL: "leave:read_all",
  LEAVE_REQUEST_APPROVE: "leave:approve",
  LEAVE_BALANCE_READ: "leave:balance_read",
  LEAVE_BALANCE_MANAGE: "leave:balance_manage",

  // Holidays
  HOLIDAY_READ: "holiday:read",
  HOLIDAY_MANAGE: "holiday:manage",

  // Requests / Analytics
  REQUEST_LOG_READ: "request:read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Converts a flat list of "resource:action" permission keys into the
 * object shape the frontend expects: { resource: { action: true } }.
 */
export function groupPermissionsByResource(
  keys: PermissionKey[]
): Record<string, Record<string, boolean>> {
  const grouped: Record<string, Record<string, boolean>> = {};
  for (const key of keys) {
    const [resource, ...rest] = key.split(":");
    const action = rest.join(":");
    if (!resource) continue;
    grouped[resource] ??= {};
    grouped[resource][action] = true;
  }
  return grouped;
}
