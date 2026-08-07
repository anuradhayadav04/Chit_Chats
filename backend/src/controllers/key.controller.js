import PublicKey from "../models/publicKey.model.js";

// Save or update the logged‑in user's public key
export const upsertPublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body; // Base64 string
    const userId = req.user._id;
    const result = await PublicKey.findOneAndUpdate(
      { userId },
      { publicKey, userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, publicKey: result.publicKey });
  } catch (err) {
    console.error("Upsert public key error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Retrieve another user's public key by their user ID
export const getPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const keyDoc = await PublicKey.findOne({ userId }).select("publicKey -_id");
    if (!keyDoc) {
      return res.status(404).json({ success: false, message: "Public key not found" });
    }
    res.status(200).json({ success: true, publicKey: keyDoc.publicKey });
  } catch (err) {
    console.error("Get public key error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
