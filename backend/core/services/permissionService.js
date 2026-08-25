import ModelPermission from "../../apps/permissions/modelPermission.model.js";
import { PERMISSION_ACTION } from "../enums/enums.js";

function merge(target, permissions) {
  for (const action of PERMISSION_ACTIONS_LIST) {
    if (permissions?.[action]) target[action] = true;
  }
}

const PERMISSION_ACTIONS_LIST = Object.values(PERMISSION_ACTION);

/**
 * Resolves the effective permission map for a model:
 *   superuser → full access (bypass)
 *   1. Role-based ModelPermission defaults
 *   2. PermissionGroups attached to the user
 *   3. Per-user overrides (most specific — replaces, explicit deny wins)
 */
export async function getEffectivePermissions(user, modelName) {
  if (user.role === "superuser") {
    return { create: true, read: true, update: true, delete: true };
  }

  const effective = { create: false, read: false, update: false, delete: false };
  const model = modelName.toLowerCase();

  // 1. Role defaults
  const rolePerm = await ModelPermission.findOne({
    modelName: model,
    role: user.role,
  });
  merge(effective, rolePerm?.permissions);

  // 2. Groups
  for (const group of user.permissionGroups || []) {
    const entry = group.permissions.find((p) => p.modelName === model);
    merge(effective, entry?.permissions);
  }

  // 3. User-specific overrides (highest priority)
  const override = (user.permissionOverrides || []).find(
    (o) => o.modelName === model
  );
  if (override) {
    effective.create = override.permissions.create;
    effective.read = override.permissions.read;
    effective.update = override.permissions.update;
    effective.delete = override.permissions.delete;
  }

  return effective;
}
