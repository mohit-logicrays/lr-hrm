import mongoose from "mongoose";

/**
 * A named group of model permissions that can be attached to users.
 */
const permissionEntrySchema = new mongoose.Schema(
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

const permissionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    permissions: [permissionEntrySchema],
  },
  { timestamps: true }
);

const PermissionGroup = mongoose.model("PermissionGroup", permissionGroupSchema);

export default PermissionGroup;
