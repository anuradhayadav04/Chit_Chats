import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upsertPublicKey, getPublicKey } from "../controllers/key.controller.js";

const router = express.Router();

router.post("/", protectRoute, upsertPublicKey);
router.get("/:userId", protectRoute, getPublicKey);

export default router;
