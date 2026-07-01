import express from "express";
import { requireAuth } from "../src/auth.js";
import { applyLeave, getLeaveHistory, getLeaveSummary, cancelLeave } from "../controllers/leave.controller.js";

const router = express.Router();

router.post(
  "/apply",
  requireAuth,
  applyLeave
);

router.get(
  "/history",
  requireAuth,
  getLeaveHistory
);

router.get(
  "/summary",
  requireAuth,
  getLeaveSummary
);

router.post(
  "/:id/cancel",
  requireAuth,
  cancelLeave
);

export default router;