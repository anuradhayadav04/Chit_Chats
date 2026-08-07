import mongoose from "mongoose";

// Stores each user's public key (Base64 encoded)
const publicKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const PublicKey = mongoose.model("PublicKey", publicKeySchema);
export default PublicKey;
