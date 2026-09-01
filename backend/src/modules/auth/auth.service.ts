import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { comparePassword } from "../../utils/password";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { permissionService } from "../permissions/permission.service";
import { groupPermissionsByResource } from "../permissions/permissions.constants";

interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    specialRoleName: string | null;
  };
  accessToken: string;
  refreshToken: string;
  permissions: string[];
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      revoked: false,
    },
  });

  // Clean up expired/revoked tokens for this user
  await prisma.refreshToken.deleteMany({
    where: { userId, OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }] },
  });
}

export class AuthService {
  async login(
    email: string,
    password: string,
    ip?: string | null
  ): Promise<LoginResult> {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    const permissions = await permissionService.getPermissionsForUser(user.id);

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role.name,
      isSpecialRole: user.isSpecialRole,
      specialRoleName: user.specialRoleName,
    });
    const refreshToken = signRefreshToken(user.id);

    await persistRefreshToken(user.id, refreshToken);

    // Update last login data
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip ?? null },
    });

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role.name,
        specialRoleName: user.specialRoleName,
      },
      accessToken,
      refreshToken,
      permissions,
    };
  }

  async refresh(refreshToken?: string | null): Promise<LoginResult> {
    if (!refreshToken) {
      throw new AppError(401, "Refresh token required");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new AppError(401, "Refresh token has expired or been revoked");
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(401, "Invalid or inactive user");
    }

    // Revoke the used token (rotation) and issue fresh pair
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const permissions = await permissionService.getPermissionsForUser(user.id);

    const newAccessToken = signAccessToken({
      sub: user.id,
      role: user.role.name,
      isSpecialRole: user.isSpecialRole,
      specialRoleName: user.specialRoleName,
    });
    const newRefreshToken = signRefreshToken(user.id);

    await persistRefreshToken(user.id, newRefreshToken);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role.name,
        specialRoleName: user.specialRoleName,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      permissions,
    };
  }

  async me(userId: string): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      designation: string | null;
      phone: string | null;
      departmentId: string | null;
      isSpecialRole: boolean;
      specialRoleName: string | null;
    };
    permissions: Record<string, Record<string, boolean>>;
    permissionKeys: string[];
  }> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { role: true },
    });

    if (!user) throw new AppError(404, "User not found");

    const keys = await permissionService.getPermissionsForUser(user.id);

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role.name,
        designation: user.designation,
        phone: user.phone,
        departmentId: user.departmentId,
        isSpecialRole: user.isSpecialRole,
        specialRoleName: user.specialRoleName,
      },
      permissions: groupPermissionsByResource(keys),
      permissionKeys: keys,
    };
  }

  async logout(userId: string, refreshToken?: string | null): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { userId, tokenHash: hashToken(refreshToken) },
        data: { revoked: true },
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }
  }
}

export const authService = new AuthService();
