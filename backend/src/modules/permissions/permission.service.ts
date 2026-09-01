import { prisma } from "../../config/prisma";
import { PERMISSIONS, type PermissionKey } from "./permissions.constants";

const ALL_PERMISSION_KEYS = Object.values(PERMISSIONS) as string[];

/**
 * Returns all permission keys a user effectively holds.
 * Special roles (founder/ceo/cto/coo/cfo) inherit every permission.
 */
export class PermissionService {
  async getPermissionsForUser(userId: string): Promise<PermissionKey[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSpecialRole: true,
        role: {
          select: {
            isSpecial: true,
            rolePermissions: {
              select: {
                permission: { select: { key: true } },
              },
            },
          },
        },
      },
    });

    if (!user) return [];

    if (user.isSpecialRole || user.role?.isSpecial) {
      return ALL_PERMISSION_KEYS as PermissionKey[];
    }

    return (
      user.role?.rolePermissions.map((rp) => rp.permission.key as PermissionKey) ??
      []
    );
  }

  async hasPermission(userId: string, permission: PermissionKey): Promise<boolean> {
    const keys = await this.getPermissionsForUser(userId);
    return keys.includes(permission);
  }
}

export const permissionService = new PermissionService();
