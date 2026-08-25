import mongoose from "mongoose";
import { REFRESH_TOKEN_TTL_DAYS } from "../../core/constants/constants.js";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    revokedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400000),
    },
  },
  { timestamps: true }
);

// TTL cleanup — documents auto-delete a day after expiry
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

refreshTokenSchema.statics.isBlacklisted = async function (tokenHash) {
  const doc = await this.findOne({ tokenHash });
  return Boolean(doc?.revokedAt);
};

/** Blacklist = mark revoked. Revoked tokens can never be used again. */
refreshTokenSchema.statics.blacklist = async function (tokenHash) {
  await this.updateOne(
    { tokenHash },
    {
      $set: { revokedAt: new Date() },
      $setOnInsert: { expiresAt: new Date(Date.now() + 86400000) },
    },
    { upsert: true }
  );
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
