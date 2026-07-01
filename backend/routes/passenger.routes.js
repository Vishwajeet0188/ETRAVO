import express from "express";
import { requireAuth } from "../src/auth.js";

import {
  createTrip,
  getPassengerDashboard,
} from "../controllers/passenger.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  requireAuth,
  getPassengerDashboard
);

router.post(
  "/trips",
  requireAuth,
  createTrip
);

export default router;