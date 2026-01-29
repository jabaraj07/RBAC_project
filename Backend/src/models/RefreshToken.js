import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersDatas",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for automatic cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster lookups
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ user: 1 });

export default mongoose.model("RefreshToken", RefreshTokenSchema);

