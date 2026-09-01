import type { PermissionKey } from "../modules/permissions/permissions.constants";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roleId: string;
        roleName: string;
        isSpecialRole: boolean;
        specialRoleName?: string | null;
        permissions: PermissionKey[];
      };
    }
  }
}

export {};
