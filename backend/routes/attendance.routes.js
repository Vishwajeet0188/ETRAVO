import express from "express";


import { requireAuth } from "../src/auth.js";
import { getTodayAttendance, markAttendance, checkoutAttendance, 
    getAttendanceHistory, getAttendanceSummary } from "../controllers/attendance.controller.js";

const router = express.Router();

// MARK ATTENDANCE: 
router.get(
  "/today",
  requireAuth,
  getTodayAttendance
);

// MARKING ATTENDANCE : 
router.post(
  "/mark",
  requireAuth,
  markAttendance
);

// CHECKOUT ATTENDANCE: 
router.post(
  "/checkout",
  requireAuth,
  checkoutAttendance
);

// ATTENDANCE HISTORY:
router.get(
  "/history",
  requireAuth,
  getAttendanceHistory
);

// SUMMARY:
router.get(
  "/summary",
  requireAuth,
  getAttendanceSummary
);

export default router;