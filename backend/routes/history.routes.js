import express from "express";
import { requireAuth } from "../src/auth.js";
import { getPassengerHistory } from "../controllers/history.controller.js";

const router = express.Router();

router.get(
  "/trips/history",
  requireAuth,
  getPassengerHistory
);

export default router;