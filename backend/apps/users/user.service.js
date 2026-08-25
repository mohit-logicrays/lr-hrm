import User from "./user.model.js";
import { getEffectivePermissions } from "../../core/services/permissionService.js";
import {
  generateRandomPassword,
} from "../../core/utils/password.js";
import { sendWelcomeCredentialsMail } from "../../core/utils/mailer.js";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "../../core/exceptions/appExceptions.js";
import { ROLE, USER_MANAGEMENT_ROLES, MODEL_NAME } from "../../core/enums/enums.js";

const PUBLIC_FIELDS =
  "-password -permissionOverrides -createdAt -updatedAt -__v";

/**
 * List users — paginated.
 * Query: ?page=1&pageSize=10&search=&role=
 */
export async function listUsers(req) {
  const { page, pageSize, skip, limit } = req.pagination;
  const filter = {};

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (req.query.role) filter.role = req.query.role;

  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .populate("permissionGroups", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, pageSize };
}

export async function getUserById(id) {
  const user = await User.findById(id)
    .select("-password -__v")
    .populate("permissionGroups", "name permissions");
  if (!user) throw new NotFoundException("User");
  return user;
}

/**
 * Create a user. Random password is generated server-side and
 * emailed via Google SMTP. Password never appears in the response.
 */
export async function createUser(actor, payload) {
  if (payload.role === ROLE.SUPERUSER) {
    throw new ForbiddenException("Cannot create another superuser");
  }

  const existing = await User.findOne({ email: payload.email });
  if (existing) throw new ConflictException("A user with this email already exists");

  const plainPassword = generateRandomPassword();

  const user = await User.create({
    ...payload,
    password: plainPassword,
    mustChangePassword: true,
    createdBy: actor._id,
  });

  // Best-effort email — creation should not fail when SMTP is down
  let emailSent = true;
  try {
    await sendWelcomeCredentialsMail({
      to: user.email,
      name: user.name,
      email: user.email,
      password: plainPassword,
      loginUrl: `${process.env.CLIENT_URL || "http://localhost:3000"}/login`,
    });
  } catch (mailErr) {
    console.error("[mail] Welcome email failed:", mailErr.message);
    emailSent = false;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation,
    phone: user.phone,
    mustChangePassword: user.mustChangePassword,
    emailSent,
  };
}

/** Admin update of any user (superuser/HR). Never allows password changes here. */
export async function adminUpdateUser(actor, userId, updates) {
  const target = await User.findById(userId);
  if (!target) throw new NotFoundException("User");

  if (updates.role === ROLE.SUPERUSER) {
    throw new ForbiddenException("Cannot assign superuser role");
  }
  if (target.role === ROLE.SUPERUSER && actor.role !== ROLE.SUPERUSER) {
    throw new ForbiddenException("Only a superuser can modify a superuser account");
  }

  return User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select(PUBLIC_FIELDS);
}

export async function deleteUser(actor, userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundException("User");
  if (user.role === ROLE.SUPERUSER) {
    throw new ForbiddenException("Superuser cannot be deleted");
  }
  if (user._id.equals(actor._id)) {
    throw new BadRequestException("You cannot delete your own account");
  }
  await user.deleteOne();
}

/** Self-service profile update — basic details only. */
export async function updateOwnProfile(userId, updates) {
  return User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select(PUBLIC_FIELDS);
}

/** Effective permissions for the authenticated user (used by /api/auth/me). */
export async function getUserPermissions(user) {
  return {
    [MODEL_NAME.USER]: await getEffectivePermissions(user, MODEL_NAME.USER),
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
