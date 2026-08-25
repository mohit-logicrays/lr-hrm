import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../../core/enums/enums.js";
import { BCRYPT_ROUNDS } from "../../core/constants/constants.js";

const permissionOverrideSchema = new mongoose.Schema(
  {
    modelName: { type: String, required: true, lowercase: true },
    permissions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "member",
    },
    designation: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    permissionGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PermissionGroup",
      },
    ],
    permissionOverrides: [permissionOverrideSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Safe representation for API responses — never exposes credentials */
userSchema.methods.toProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    designation: this.designation,
    phone: this.phone,
    isActive: this.isActive,
    mustChangePassword: this.mustChangePassword,
    permissionGroups: this.permissionGroups,
    permissionOverrides: this.permissionOverrides,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
