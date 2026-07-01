import express from "express";
console.log("Dashboard Routes Loaded");
import { requireAuth } from "../src/auth.js";
import { getDashboard,getAvailableTrips } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/", requireAuth, getDashboard);
router.get(
  "/available-trips",
  requireAuth,
  getAvailableTrips
);
export default router;