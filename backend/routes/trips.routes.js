import express from "express";
import { requireAuth } from "../src/auth.js";
import {
  updateTripStatus,
  getMyTrips,
  // getPassengerHistory
} from "../controllers/trips.controller.js";

const router = express.Router();

// roues for updating/ new trips.
router.patch(
  "/:id/status",
  requireAuth,
  updateTripStatus
);

router.get(
  "/mine",
  requireAuth,
  getMyTrips
);

// router.get(
//   "/history",
//   requireAuth,
//   getPassengerHistory
// )
export default router;