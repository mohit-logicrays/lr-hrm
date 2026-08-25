/**
 * Global enums — stable value sets used across the application.
 */

export const ROLE = Object.freeze({
  SUPERUSER: "superuser",
  HR: "hr",
  TEAM_LEAD: "team_lead",
  PROJECT_MANAGER: "project_manager",
  PROJECT_LEAD: "project_lead",
  MEMBER: "member",
});

export const ROLES = Object.freeze(Object.values(ROLE));

/** Roles allowed to manage users */
export const USER_MANAGEMENT_ROLES = Object.freeze([ROLE.SUPERUSER, ROLE.HR]);

export const PERMISSION_ACTION = Object.freeze({
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
});

export const PERMISSION_ACTIONS = Object.freeze(
  Object.values(PERMISSION_ACTION)
);

export const MODEL_NAME = Object.freeze({
  USER: "user",
});

export const TOKEN_TYPE = Object.freeze({
  ACCESS: "access",
  REFRESH: "refresh",
});
