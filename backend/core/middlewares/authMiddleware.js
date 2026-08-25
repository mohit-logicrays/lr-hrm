import User from "../../apps/users/user.model.js";
import { getEffectivePermissions } from "../services/permissionService.js";
import { COOKIE } from "../constants/constants.js";
import { verifyAccessToken } from "../utils/jwt.js";
import {
  UnauthorizedException,
  ForbiddenException,
} from "../exceptions/appExceptions.js";

/**
 * Centralized JWT auth — verifies the access token cookie and attaches
 * the fresh user document to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE.ACCESS_TOKEN];
    if (!token) throw new UnauthorizedException();

    const payload = verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired session. Please login again.");
    }

    const user = await User.findById(payload.id).populate("permissionGroups");
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account is inactive or not found");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Simple role gate for cases that don't need the permission system */
export function roles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(new ForbiddenException());
    }
    next();
  };
}

/**
 * Centralized permission gatekeeper:
 *   authorize(MODEL_NAME.USER, PERMISSION_ACTION.READ)
 * Superuser bypasses all checks.
 */
export function authorize(modelName, action) {
  return async (req, res, next) => {
    try {
      const permissions = await getEffectivePermissions(req.user, modelName);
      if (!permissions[action]) {
        return next(
          new ForbiddenException(
            `You do not have permission to ${action} ${modelName}`
          )
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
