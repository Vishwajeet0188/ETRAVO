import express from "express";
import {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";

import { requireAuth } from "../src/auth.js";

const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
// router.get("/me", requireAuth, getCurrentUser);
// router.post("/forgot-password", forgotPassword);
// router.post("reset-password",resetPassword);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getCurrentUser);

export default router;