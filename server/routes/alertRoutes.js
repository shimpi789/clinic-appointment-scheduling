import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
    getAlerts,
    dismissAlert,
} from "../controllers/alertController.js";

const router = express.Router();

// Get alerts
router.get(
    "/",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    getAlerts
);

// Dismiss an alert
router.patch(
    "/:appointmentId/dismiss",
    authMiddleware,
    roleMiddleware("FRONT_DESK", "PROVIDER"),
    dismissAlert
);

export default router;