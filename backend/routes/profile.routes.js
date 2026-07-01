import express from "express";
import { requireAuth } from "../src/auth.js";
import {
  getProfile,
  updateProfile
} from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/", requireAuth, getProfile);

router.put("/", requireAuth, updateProfile);

export default router;