import mongoose from "mongoose";
import { ROLES } from "../../core/enums/enums.js";

/**
 * Default CRUD permissions for a model, applied per-role.
 * Default state is all false — access must be granted explicitly.
 */
const modelPermissionSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: ROLES.filter((r) => r !== "superuser"),
    },
    permissions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

modelPermissionSchema.index({ modelName: 1, role: 1 }, { unique: true });

const ModelPermission = mongoose.model("ModelPermission", modelPermissionSchema);

export default ModelPermission;
